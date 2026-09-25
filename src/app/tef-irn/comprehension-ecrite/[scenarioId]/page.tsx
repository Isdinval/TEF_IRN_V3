'use client';

// Session de pratique pour 1 sujet de Compréhension Écrite (item 4 du plan
// "pratique CE/CO dissociée"). Indépendante d'ExamContext/startExam --
// lecture directe de ce_scenarios/ce_scenario_questions_public, correction
// via /api/comprehension/complete (jamais côté client, voir cette route).
//
// Refonte du 2026-09-21 (retour Olivier après test réel) : reprend le même
// gabarit que /tef-irn/practice ([id]/page.tsx -> page.tsx#PracticeContent)
// -- ExerciseLayout compact + barre de progression, ExerciseContextHeader,
// décorations LlamaMountainDecoration/DestinationLandmarkDecoration (nouvelle
// variante "comprehension", indigo), 1 question par page avec correction
// immédiate, écran de résultat avec mascotte. Différence structurelle avec
// practice : un sujet CE partage un texte (ou des sous-textes) entre
// plusieurs questions -- ce texte reste affiché au-dessus de la question en
// cours sur toutes les pages, jamais seulement sur la première.
//
// La correction reste faite question par question côté serveur (jamais le
// texte "A) ..." comparé côté client) : chaque "Vérifier ma réponse" envoie
// un seul élément dans results[] à /api/comprehension/complete, au lieu
// d'un envoi groupé des 5 réponses à la fin -- la route accepte déjà un
// tableau de longueur quelconque, aucun changement nécessaire côté API.

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { checkComprehensionScenarioQuota } from '@/lib/comprehension-quota-client';
import { shuffleQcmOptions } from '@/lib/shuffle-qcm-options';
import { ComprehensionQuotaBlocked } from '@/components/shared/ComprehensionQuotaBlocked';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExerciseLayout } from '@/components/shared/ExerciseLayout';
import { LlamaMountainDecoration } from '@/components/decorative/LlamaMountainDecoration';
import { DestinationLandmarkDecoration } from '@/components/decorative/DestinationLandmarkDecoration';
import { VICTORY_MASCOT_URLS, pickRandomImage } from '@/data/grammar-check-images';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Sparkles, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';

type CeFormat = 'court' | 'trous' | 'multi_texte' | 'long_admin' | 'article_presse';
const FORMAT_LABELS: Record<CeFormat, string> = {
  court: 'Texte court',
  trous: 'Texte à trous',
  multi_texte: 'Textes multiples',
  long_admin: 'Document administratif',
  article_presse: 'Article de presse',
};

// Formats à texte long : sur desktop, texte à gauche (sticky, scroll indépendant)
// et question/réponses à droite -- retour Olivier du 2026-09-23, le texte
// sortait de l'écran avant d'arriver aux réponses. Formats courts inchangés.
const LONG_FORMATS: CeFormat[] = ['multi_texte', 'long_admin', 'article_presse'];

// Consigne affichée au-dessus de chaque question, calquée sur celles de l'Examen Blanc.
const FORMAT_CONSIGNES: Record<CeFormat, string> = {
  court: 'Lisez attentivement le texte et répondez à la question.',
  trous: 'Lisez le texte et choisissez le mot qui complète la lacune indiquée.',
  multi_texte: 'Lisez les documents et répondez à la question.',
  long_admin: 'Lisez attentivement le document et répondez à la question.',
  article_presse: "Lisez attentivement l'article et répondez à la question.",
};

interface SubText { label: string; content: string }
interface CeScenario {
  id: string;
  format: CeFormat;
  level: string;
  title: string | null;
  texte: string | null;
  sub_texts: SubText[] | null;
}
interface CeQuestion {
  id: string;
  order_index: number;
  question: string;
  options: string[];
  highlight_gap: number | null;
}
interface GradedResult {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
}

export default function ComprehensionEcriteScenarioPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [scenario, setScenario] = useState<CeScenario | null>(null);
  const [questions, setQuestions] = useState<CeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [quotaBlocked, setQuotaBlocked] = useState<string | null>(null);

  const [mode, setMode] = useState<'practice' | 'result'>('practice');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkedResult, setCheckedResult] = useState<GradedResult | null>(null);
  const [score, setScore] = useState(0);
  const [resultMascotUrl, setResultMascotUrl] = useState<string>(VICTORY_MASCOT_URLS[0]);

  useEffect(() => {
    let active = true;
    async function load() {
      const [{ data: scenarioRow }, { data: questionRows }, quota] = await Promise.all([
        supabase.from('ce_scenarios').select('id, format, level, title, texte, sub_texts').eq('id', scenarioId).maybeSingle(),
        supabase.from('ce_scenario_questions_public').select('id, order_index, question, options, highlight_gap').eq('scenario_id', scenarioId).order('order_index'),
        checkComprehensionScenarioQuota('CE', scenarioId),
      ]);
      if (!active) return;
      if (!quota.allowed) {
        setQuotaBlocked(quota.error);
        setLoading(false);
        return;
      }
      if (!scenarioRow) {
        setError(true);
        setLoading(false);
        return;
      }
      setScenario(scenarioRow as CeScenario);
      setQuestions((questionRows || []) as CeQuestion[]);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [scenarioId, supabase]);

  const currentQuestion = questions[currentIdx];
  const shuffledOptions = useMemo(
    () => (currentQuestion ? shuffleQcmOptions(currentQuestion.options) : []),
    [currentQuestion?.id]
  );
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentIdx + 1) / totalQuestions) * 100 : 0;

  const handleCheck = async () => {
    if (!selected || !currentQuestion || checking) return;
    setChecking(true);
    try {
      const res = await fetch('/api/comprehension/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: 'CE',
          results: [{ questionId: currentQuestion.id, userAnswer: selected }],
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setQuotaBlocked(data.error);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Erreur de correction');
      const graded = data.results[0] as GradedResult;
      setCheckedResult(graded);
      if (graded.isCorrect) setScore((s) => s + 1);
    } catch {
      // Filet simple : pas de correction affichée, l'utilisateur peut
      // réessayer (le bouton "Vérifier" redevient actif car checking repasse
      // à false ci-dessous, checkedResult reste null).
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setCheckedResult(null);
    } else {
      setResultMascotUrl(pickRandomImage(VICTORY_MASCOT_URLS));
      setMode('result');
    }
  };

  const restartExercise = () => {
    setCurrentIdx(0);
    setSelected(null);
    setCheckedResult(null);
    setScore(0);
    setMode('practice');
  };

  // Retour Olivier : la touche Entrée déclenche l'action principale de
  // l'écran d'exercice -- même raccourci que /tef-irn/practice.
  useEffect(() => {
    if (mode !== 'practice') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (!checkedResult) {
        if (selected !== null) handleCheck();
      } else {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, checkedResult, selected, currentIdx]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-300">
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (quotaBlocked) {
    return <ComprehensionQuotaBlocked skill="CE" message={quotaBlocked} catalogueHref="/tef-irn/comprehension-ecrite" />;
  }

  if (error || !scenario) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="text-red-300" size={40} />
        <p className="font-bold text-zinc-600">Sujet introuvable.</p>
        <Button onClick={() => router.push('/tef-irn/comprehension-ecrite')} variant="outline" className="h-11 rounded-2xl font-bold">
          Retour au catalogue
        </Button>
      </div>
    );
  }

  const isLongFormat = LONG_FORMATS.includes(scenario.format);

  // ÉCRAN RÉSULTAT
  if (mode === 'result') {
    const finalPercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-md w-full">
          <img src={resultMascotUrl} alt="Mascotte LlamaKusi célébrant la réussite du sujet" className="w-40 h-40 mx-auto object-contain drop-shadow-xl" />
          <div className="space-y-2">
            <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Sujet terminé !</h2>
            <p className="text-sm text-zinc-500 font-medium">Vous progressez vers votre objectif.</p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Badge className="bg-indigo-600 text-white rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-widest border-none">
                Niveau {scenario.level}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-widest">
                {FORMAT_LABELS[scenario.format]}
              </Badge>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex items-center justify-around">
            <div className="text-center">
              <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Score</div>
              <div className="text-2xl font-black text-zinc-900">{finalPercent}%</div>
            </div>
            <div className="w-px h-10 bg-zinc-100" />
            <div className="text-center">
              <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Réponses</div>
              <div className="text-2xl font-black text-indigo-600">{score} / {totalQuestions}</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push('/tef-irn/comprehension-ecrite')} className="h-12 rounded-2xl border border-zinc-200 bg-white text-zinc-900 font-bold text-sm hover:bg-zinc-50 transition-all">
              Retourner au catalogue
            </Button>
            <Button variant="ghost" onClick={restartExercise} className="h-12 text-zinc-500 font-black uppercase tracking-widest text-xs hover:text-zinc-900">
              <RotateCcw size={14} className="mr-2" /> Recommencer le sujet
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Blocs de l'écran pratique, réordonnés selon le format (voir plus bas) :
  // formats courts -> ordre inchangé (question -> texte -> réponses -> bouton) ;
  // formats longs -> texte en colonne gauche, reste en colonne droite.
  const headerBlock = (
    // Retour Olivier (2026-09-21) : badges + question réunis dans UN seul
    // rectangle (au lieu de 2 blocs séparés).
    <div className="bg-white p-4 lg:p-5 rounded-3xl border border-zinc-100 shadow-sm text-center relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-center gap-2 mb-3 relative z-10">
        <Badge className="rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-widest border-none bg-indigo-600 text-white">
          {scenario.level}
        </Badge>
        <Badge variant="outline" className="rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-widest">
          {FORMAT_LABELS[scenario.format]}
        </Badge>
      </div>
      <p className="text-sm font-bold text-zinc-500 mb-2 relative z-10">
        {FORMAT_CONSIGNES[scenario.format]}
      </p>
      <h3 className="text-base lg:text-lg font-black text-zinc-900 leading-tight tracking-tight relative z-10">
        {currentQuestion?.highlight_gap ? `Lacune n°${currentQuestion.highlight_gap} — ` : `Question ${currentIdx + 1} — `}
        {currentQuestion?.question}
      </h3>
    </div>
  );

  // Texte du sujet : reste affiché à chaque question, jamais seulement sur
  // la première (retour Olivier explicite). Formats longs : sticky + scroll
  // indépendant sur desktop pour rester visible pendant qu'on répond.
  const texteBlock = (
    <div className={isLongFormat ? 'lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1 lg:col-start-2 lg:row-start-1 lg:row-span-3' : ''}>
      {scenario.sub_texts ? (
        <div className={`grid grid-cols-1 gap-3 ${isLongFormat ? '' : 'sm:grid-cols-2'}`}>
          {scenario.sub_texts.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-1.5">{t.label}</p>
              <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-line">{t.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-5">
          <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-line">{scenario.texte}</p>
        </div>
      )}
    </div>
  );

  const optionsBlock = (
    <div className="grid grid-cols-1 gap-2">
      <p className="text-center text-xs font-black text-zinc-500 uppercase tracking-widest mb-0.5">Sélectionnez la bonne réponse</p>
      {shuffledOptions.map((opt) => {
        const isSelected = selected === opt.original;
        const isCorrectOpt = !!checkedResult && opt.originalLetter === checkedResult.correctAnswer;

        let buttonStyle = 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300 shadow-sm';
        if (checkedResult) {
          if (isCorrectOpt) buttonStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-none ring-4 ring-emerald-500/10';
          else if (isSelected) buttonStyle = 'border-red-600 bg-red-50 text-red-700 shadow-none ring-4 ring-red-600/10';
        } else if (isSelected) {
          buttonStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm ring-2 ring-indigo-600/10';
        }

        return (
          <motion.button
            key={opt.original}
            whileHover={!checkedResult ? { x: 5 } : {}}
            whileTap={!checkedResult ? { scale: 0.98 } : {}}
            onClick={() => setSelected(opt.original)}
            disabled={!!checkedResult}
            className={`w-full min-h-11 p-3 rounded-2xl border-2 transition-all text-left font-bold text-sm flex items-center justify-between group ${buttonStyle}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-sm transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200'}`}>
                {opt.display.charAt(0)}
              </div>
              {opt.display.slice(3)}
            </div>
            {checkedResult && isCorrectOpt && <CheckCircle2 className="text-emerald-600" size={18} />}
            {checkedResult && isSelected && !isCorrectOpt && <XCircle className="text-red-600" size={18} />}
          </motion.button>
        );
      })}
    </div>
  );

  const answerActionBlock = (
    <div className="pt-1">
      {!checkedResult ? (
        <Button
          onClick={handleCheck}
          disabled={selected === null || checking}
          className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {checking ? <Loader2 className="animate-spin" size={18} /> : 'VÉRIFIER MA RÉPONSE'}
        </Button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          {checkedResult.explanation && (
            <Card className={`p-4 rounded-2xl border shadow-sm ${checkedResult.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <div className="flex items-center gap-2 mb-1 opacity-80 text-xs font-black uppercase tracking-widest">
                <Sparkles size={14} /> Explication
              </div>
              <p className="text-sm font-medium leading-relaxed">{checkedResult.explanation}</p>
            </Card>
          )}
          <Button
            onClick={handleNext}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest rounded-2xl text-sm shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {currentIdx < totalQuestions - 1 ? 'QUESTION SUIVANTE' : 'VOIR MON RÉSULTAT'}
            <ArrowRight size={20} />
          </Button>
        </motion.div>
      )}
    </div>
  );

  // ÉCRAN PRATIQUE
  return (
    <div className="relative h-full bg-zinc-50 flex flex-col">
      <LlamaMountainDecoration variant="comprehension" />
      <DestinationLandmarkDecoration variant="comprehension" />
      <ExerciseLayout
        variant="compact"
        title="Compréhension écrite"
        badge="Coach CE"
        onBack={() => router.push('/tef-irn/comprehension-ecrite')}
        rightElement={
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Précision</div>
              <div className="text-2xl font-black text-zinc-900">{score} / {totalQuestions}</div>
            </div>
            <div className="h-12 w-px bg-zinc-100" />
            <div className="flex flex-col gap-2">
              <div className="w-48 h-2 bg-indigo-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-indigo-600" />
              </div>
              <div className="flex justify-between text-xs font-black text-zinc-500 uppercase tracking-widest">
                <span>Début</span>
                <span>{Math.round(progress)}%</span>
                <span>Fin</span>
              </div>
            </div>
          </div>
        }
      />

      <main className="flex-1 flex flex-col items-center justify-start gap-4 p-3 lg:p-4 overflow-y-auto">
        <div className={`w-full m-auto ${isLongFormat ? 'max-w-6xl' : 'max-w-2xl'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className={isLongFormat ? 'space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-5 lg:gap-y-3 lg:items-start' : 'space-y-3'}
            >
              {isLongFormat ? (
                <>
                  {/* Formats longs : sujet/réponses/bouton à gauche, texte à
                      droite (sticky sur desktop) -- toujours visible pendant
                      la lecture. Sur mobile : sujet, texte, réponses, bouton
                      (retour Olivier du 2026-09-23). Placement en grid nommé
                      par lg:col-start/row-start pour découpler l'ordre mobile
                      (DOM naturel) de l'ordre desktop (grid). */}
                  <div className="lg:col-start-1 lg:row-start-1">{headerBlock}</div>
                  {texteBlock}
                  <div className="lg:col-start-1 lg:row-start-2">{optionsBlock}</div>
                  <div className="lg:col-start-1 lg:row-start-3">{answerActionBlock}</div>
                </>
              ) : (
                <>
                  {/* Formats courts : ordre inchangé (retour Olivier du
                      2026-09-21) -- question -> texte -> réponses -> bouton. */}
                  {headerBlock}
                  {texteBlock}
                  {optionsBlock}
                  {answerActionBlock}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
