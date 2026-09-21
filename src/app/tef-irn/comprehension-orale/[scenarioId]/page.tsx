'use client';

// Session de pratique pour 1 sujet de Compréhension Orale (item 4 du plan
// "pratique CE/CO dissociée"). Miroir exact de
// comprehension-ecrite/[scenarioId]/page.tsx -- voir ses commentaires pour
// le détail du gabarit repris de /tef-irn/practice (refonte du 2026-09-21).
// Seules différences : lecteur audio (AudioPlayer, déjà autonome, aucune
// dépendance à ExamContext) au lieu du texte/sous-textes, resté affiché
// au-dessus de chaque question comme pour CE ; pas de highlight_gap.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExerciseLayout } from '@/components/shared/ExerciseLayout';
import { LlamaMountainDecoration } from '@/components/decorative/LlamaMountainDecoration';
import { DestinationLandmarkDecoration } from '@/components/decorative/DestinationLandmarkDecoration';
import { AudioPlayer } from '@/components/exam/AudioPlayer';
import { VICTORY_MASCOT_URLS, pickRandomImage } from '@/data/grammar-check-images';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Sparkles, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';

type CoFormat = 'annonce' | 'repondeur' | 'chronique' | 'micro_trottoir' | 'conversation';
const FORMAT_LABELS: Record<CoFormat, string> = {
  annonce: 'Annonce',
  repondeur: 'Répondeur',
  chronique: 'Chronique',
  micro_trottoir: 'Micro-trottoir',
  conversation: 'Conversation',
};

interface CoScenario {
  id: string;
  format: CoFormat;
  level: string;
  title: string | null;
  audio_url: string;
  max_plays: number | null;
}
interface CoQuestion {
  id: string;
  order_index: number;
  question: string;
  options: string[];
}
interface GradedResult {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation?: string;
}

export default function ComprehensionOraleScenarioPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [scenario, setScenario] = useState<CoScenario | null>(null);
  const [questions, setQuestions] = useState<CoQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
      const [{ data: scenarioRow }, { data: questionRows }] = await Promise.all([
        supabase.from('co_scenarios').select('id, format, level, title, audio_url, max_plays').eq('id', scenarioId).maybeSingle(),
        supabase.from('co_scenario_questions_public').select('id, order_index, question, options').eq('scenario_id', scenarioId).order('order_index'),
      ]);
      if (!active) return;
      if (!scenarioRow) {
        setError(true);
        setLoading(false);
        return;
      }
      setScenario(scenarioRow as CoScenario);
      setQuestions((questionRows || []) as CoQuestion[]);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [scenarioId, supabase]);

  const currentQuestion = questions[currentIdx];
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
          skill: 'CO',
          results: [{ questionId: currentQuestion.id, userAnswer: selected }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de correction');
      const graded = data.results[0] as GradedResult;
      setCheckedResult(graded);
      if (graded.isCorrect) setScore((s) => s + 1);
    } catch {
      // Filet simple : pas de correction affichée, l'utilisateur peut
      // réessayer (checking repasse à false, checkedResult reste null).
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

  if (error || !scenario) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle className="text-red-300" size={40} />
        <p className="font-bold text-zinc-600">Sujet introuvable.</p>
        <Button onClick={() => router.push('/tef-irn/comprehension-orale')} className="rounded-xl bg-zinc-900 font-black">
          Retour au catalogue
        </Button>
      </div>
    );
  }

  if (mode === 'result') {
    const finalPercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-8 max-w-md w-full">
          <img src={resultMascotUrl} alt="Mascotte LlamaKusi célébrant la réussite du sujet" className="w-40 h-40 mx-auto object-contain drop-shadow-xl" />
          <div className="space-y-2">
            <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Sujet terminé !</h2>
            <p className="text-sm text-zinc-500 font-medium">Vous progressez vers votre objectif.</p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Badge className="bg-indigo-600 text-white rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none">
                Niveau {scenario.level}
              </Badge>
              <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                {FORMAT_LABELS[scenario.format]}
              </Badge>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-zinc-100 flex items-center justify-around">
            <div className="text-center">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Score</div>
              <div className="text-2xl font-black text-zinc-900">{finalPercent}%</div>
            </div>
            <div className="w-px h-10 bg-zinc-100" />
            <div className="text-center">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Réponses</div>
              <div className="text-2xl font-black text-indigo-600">{score} / {totalQuestions}</div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push('/tef-irn/comprehension-orale')} className="h-12 bg-zinc-900 text-white rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all">
              Retourner au catalogue
            </Button>
            <Button variant="ghost" onClick={restartExercise} className="h-12 text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:text-zinc-900">
              <RotateCcw size={14} className="mr-2" /> Recommencer le sujet
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-zinc-50 flex flex-col">
      <LlamaMountainDecoration variant="comprehension" />
      <DestinationLandmarkDecoration variant="comprehension" />
      <ExerciseLayout
        variant="compact"
        title="COMPRÉHENSION ORALE"
        badge="Coach CO"
        badgeColor="indigo"
        onBack={() => router.push('/tef-irn/comprehension-orale')}
        rightElement={
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Précision</div>
              <div className="text-2xl font-black text-zinc-900">{score} / {totalQuestions}</div>
            </div>
            <div className="h-12 w-px bg-zinc-100" />
            <div className="flex flex-col gap-2">
              <div className="w-48 h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-50 shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-indigo-600" />
              </div>
              <div className="flex justify-between text-[8px] font-black text-zinc-300 uppercase tracking-widest">
                <span>DÉBUT</span>
                <span>{Math.round(progress)}%</span>
                <span>FIN</span>
              </div>
            </div>
          </div>
        }
      />

      <main className="flex-1 flex flex-col items-center gap-4 p-3 lg:p-4 overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-3"
            >
              {/* Retour Olivier (2026-09-21) : badges + question réunis dans
                  UN seul rectangle, suivi de l'audio du sujet, puis des
                  réponses -- même ordre que CE (badges+question -> contenu
                  -> réponses). */}
              <div className="bg-white p-4 lg:p-5 rounded-[2rem] shadow-xl shadow-zinc-200/30 text-center relative overflow-hidden border-4 border-white ring-1 ring-zinc-100">
                <div className="flex flex-wrap items-center justify-center gap-2 mb-3 relative z-10">
                  <Badge className="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none bg-indigo-600 text-white">
                    {scenario.level}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                    {FORMAT_LABELS[scenario.format]}
                  </Badge>
                </div>
                <h3 className="text-base lg:text-lg font-black text-zinc-900 leading-tight tracking-tight relative z-10">
                  Question {currentIdx + 1} — {currentQuestion?.question}
                </h3>
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full -mr-40 -mt-40 blur-3xl opacity-30" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-zinc-50 rounded-full -ml-40 -mb-40 blur-3xl opacity-30" />
              </div>

              {/* Audio du sujet : reste affiché à chaque question, jamais
                  seulement sur la première. */}
              <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-5">
                <AudioPlayer url={scenario.audio_url} maxPlays={scenario.max_plays ?? 2} questionId={scenario.id} />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Sélectionnez la bonne réponse</p>
                {currentQuestion?.options.map((opt) => {
                  const isSelected = selected === opt;
                  const optLetter = opt.trim().charAt(0).toUpperCase();
                  const isCorrectOpt = !!checkedResult && optLetter === checkedResult.correctAnswer;

                  let buttonStyle = 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300 shadow-sm';
                  if (checkedResult) {
                    if (isCorrectOpt) buttonStyle = 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-none ring-4 ring-emerald-500/10';
                    else if (isSelected) buttonStyle = 'border-rose-500 bg-rose-50 text-rose-900 shadow-none ring-4 ring-rose-500/10';
                  } else if (isSelected) {
                    buttonStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xl ring-4 ring-indigo-600/5';
                  }

                  return (
                    <motion.button
                      key={opt}
                      whileHover={!checkedResult ? { x: 5 } : {}}
                      whileTap={!checkedResult ? { scale: 0.98 } : {}}
                      onClick={() => setSelected(opt)}
                      disabled={!!checkedResult}
                      className={`w-full p-2.5 rounded-xl border-2 transition-all text-left font-bold text-sm flex items-center justify-between group ${buttonStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'}`}>
                          {optLetter}
                        </div>
                        {opt.slice(3)}
                      </div>
                      {checkedResult && isCorrectOpt && <CheckCircle2 className="text-emerald-500" size={18} />}
                      {checkedResult && isSelected && !isCorrectOpt && <XCircle className="text-rose-500" size={18} />}
                    </motion.button>
                  );
                })}
              </div>

              <div className="pt-1">
                {!checkedResult ? (
                  <Button
                    onClick={handleCheck}
                    disabled={selected === null || checking}
                    className="w-full h-12 bg-zinc-900 hover:bg-black text-white font-bold rounded-2xl text-sm shadow-xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {checking ? <Loader2 className="animate-spin" size={18} /> : 'VÉRIFIER MA RÉPONSE'}
                  </Button>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    {checkedResult.explanation && (
                      <Card className={`p-4 rounded-2xl border-none shadow-lg ${checkedResult.isCorrect ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-white'}`}>
                        <div className="flex items-center gap-2 mb-1 opacity-80 text-[9px] font-black uppercase tracking-widest">
                          <Sparkles size={14} /> Explication
                        </div>
                        <p className="text-xs font-bold leading-relaxed italic">&quot;{checkedResult.explanation}&quot;</p>
                      </Card>
                    )}
                    <Button
                      onClick={handleNext}
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      {currentIdx < totalQuestions - 1 ? 'QUESTION SUIVANTE' : 'VOIR MON RÉSULTAT'}
                      <ArrowRight size={20} />
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
