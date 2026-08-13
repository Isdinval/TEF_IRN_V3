'use client';

import React, { useState, useEffect } from 'react';
import { useExam } from '@/contexts/ExamContext';
import { QCMQuestion, WritingQuestion, SpeakingQuestion } from '@/types/exam';
import { renderClozeText } from '@/lib/ce-format';
import { AudioPlayer } from './AudioPlayer';
import { SpeakingSession } from './SpeakingSession';
import { ORAL_CRITERIA_LABELS } from '@/lib/oral-criteria';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowRight, Info, HelpCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function QuestionCard() {
  const { state, questions, currentQuestion, setAnswer, nextQuestion, isCorrecting, submitOralAnalysis, oralAnalyses } = useExam();
  const [wordCount, setWordCount] = useState(0);
  const [unansweredWarning, setUnansweredWarning] = useState<string | null>(null);

  useEffect(() => {
    if (currentQuestion.type === 'writing') {
      const text = state.answers[currentQuestion.id] || '';
      setWordCount(text.trim() === '' ? 0 : text.trim().split(/\s+/).length);
    }
  }, [state.answers, currentQuestion]);

  const isLastQuestion = state.currentQuestionIndex === questions.length - 1;

  // L'échange oral est considéré répondu si une analyse existe déjà (session terminée).
  // S'il n'y a pas de scénario Realtime lié (cas de repli sans oral_scenario_id), il n'y a
  // rien à vérifier — cf. le fallback dans renderSpeaking().
  const isQuestionAnswered = (q: typeof currentQuestion) => {
    if (q.type === 'speaking') {
      const sq = q as SpeakingQuestion;
      if (!sq.oralScenarioId) return true;
      return !!oralAnalyses[q.id];
    }
    return !!(state.answers[q.id] && state.answers[q.id].trim() !== '');
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const unanswered = questions.filter((q) => !isQuestionAnswered(q)).length;
      if (unanswered > 0) {
        setUnansweredWarning(
          `Il vous reste ${unanswered} question${unanswered > 1 ? 's' : ''} sans réponse dans cette épreuve. Voulez-vous quand même terminer ?`
        );
        return;
      }
    } else if (!isQuestionAnswered(currentQuestion)) {
      setUnansweredWarning(
        currentQuestion.type === 'speaking'
          ? "Vous n'avez pas terminé cet échange oral. Voulez-vous continuer sans le terminer ?"
          : "Vous n'avez pas répondu à cette question. Voulez-vous continuer sans répondre ?"
      );
      return;
    }
    nextQuestion();
  };

  const renderQCM = (q: QCMQuestion) => {
    const selectedAnswer = state.answers[q.id];

    return (
      <div className="space-y-5">
        {q.type === 'audio' && (
          <AudioPlayer url={q.audioUrl || ''} maxPlays={q.maxPlays || 1} questionId={q.id} />
        )}

        {q.ceFormat === 'multi_texte' && q.subTexts && q.subTexts.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {q.subTexts.map((st, i) => (
              <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <h4 className="text-xs font-black uppercase tracking-wide text-indigo-600 mb-1.5">
                  {st.label}
                </h4>
                <p className="text-sm leading-relaxed text-zinc-600">{st.content}</p>
              </div>
            ))}
          </div>
        )}

        {q.ceFormat !== 'multi_texte' && q.texte && (
          <div
            className={`p-5 bg-zinc-50 rounded-2xl border border-zinc-100 text-base leading-relaxed text-zinc-600 ${
              q.ceFormat === 'long_admin' || q.ceFormat === 'article_presse' ? '' : 'italic'
            }`}
          >
            {q.ceFormat === 'trous' ? (
              renderClozeText(q.texte, q.highlightGap)
            ) : q.ceFormat === 'long_admin' || q.ceFormat === 'article_presse' ? (
              q.texte
                .split(/\n+/)
                .filter((p) => p.trim() !== '')
                .map((paragraph, i) => (
                  <p key={i} className={i > 0 ? 'mt-3' : ''}>
                    {paragraph}
                  </p>
                ))
            ) : (
              q.texte
            )}
          </div>
        )}

        {q.imageUrl && (
          <div className="flex justify-center">
            <img src={q.imageUrl} alt="Context" className="rounded-2xl shadow-lg border border-zinc-100 max-w-full h-auto max-h-64" />
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-xl font-black text-zinc-900 leading-tight">
            {q.question}
          </h2>

          <div className="grid gap-2">
            {q.options.map((opt) => {
              const letter = opt.substring(0, 1);
              const isSelected = selectedAnswer === letter;

              return (
                <button
                  key={opt}
                  onClick={() => setAnswer(q.id, letter)}
                  className={`
                    w-full p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3
                    ${isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg'
                      : 'border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'}
                  `}
                >
                  <div className={`
                    w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-black
                    ${isSelected ? 'bg-white/15 text-white' : 'bg-zinc-50 text-zinc-400'}
                  `}>
                    {letter}
                  </div>
                  <span className="font-medium">{opt.substring(3)}</span>
                  {isSelected && <CheckCircle2 className="ml-auto shrink-0 text-white" size={20} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWriting = (q: WritingQuestion) => {
    const value = state.answers[q.id] || '';
    const isMinReached = wordCount >= q.minWords;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-indigo-50/60 rounded-2xl border-l-4 border-indigo-600">
          <h3 className="font-black text-zinc-900 flex items-center gap-2 mb-1.5 text-sm">
            <Info size={16} /> Sujet
          </h3>
          <p className="text-zinc-600 leading-relaxed font-medium text-sm">
            {q.prompt}
          </p>
        </div>

        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder="Saisissez votre texte ici..."
            className="min-h-[220px] p-5 text-base rounded-2xl border border-zinc-100 focus:border-indigo-600 focus:ring-0 transition-all shadow-inner bg-white"
          />
          <div className={`absolute bottom-3 right-4 px-3 py-1 rounded-full text-xs font-bold ${isMinReached ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
            {wordCount} mots {isMinReached ? '(Minimum atteint ✅)' : `(Min. ${q.minWords} mots)`}
          </div>
        </div>
      </div>
    );
  };

  const renderSpeaking = (q: SpeakingQuestion) => {
    const analysis = oralAnalyses[q.id];

    if (q.oralScenarioId && !analysis) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50/60 rounded-2xl border-l-4 border-indigo-600">
            <h3 className="font-black text-zinc-900 flex items-center gap-2 mb-1.5 text-sm">
              <Info size={16} /> Sujet
            </h3>
            <p className="text-zinc-600 leading-relaxed font-medium text-sm">{q.prompt}</p>
            <div className="flex gap-4 mt-2 text-xs font-bold text-zinc-400">
              <span>Préparation {q.prepTime} min</span>
              <span>Échange {q.speakTime} min</span>
            </div>
          </div>

          <SpeakingSession
            scenarioId={q.oralScenarioId}
            prepTime={q.prepTime}
            speakTime={q.speakTime}
            onComplete={(result) => submitOralAnalysis(q.id, result)}
          />
        </div>
      );
    }

    if (q.oralScenarioId && analysis) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-zinc-900">
              Échange terminé
            </h2>
            <div className="text-sm font-bold text-indigo-600">
              Niveau estimé {analysis.estimated_level}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(analysis.scores).map(([key, value]) => (
              <div key={key} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 text-center">
                <div className="font-black text-lg text-zinc-900">{value}</div>
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mt-0.5">
                  {ORAL_CRITERIA_LABELS[key as keyof typeof ORAL_CRITERIA_LABELS]}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-zinc-500 italic">"{analysis.general_comment}"</p>
        </div>
      );
    }

    // Repli : aucun scénario Realtime lié à cette question (ne devrait pas arriver
    // pour les 3 examens actuels, mais évite un écran cassé si un futur examen
    // est créé sans oral_scenario_id).
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
          <HelpCircle size={28} />
        </div>

        <div className="space-y-2 max-w-2xl">
          <h2 className="text-2xl font-black text-zinc-900">
            Épreuve d'Expression Orale
          </h2>
          <p className="text-base text-zinc-500 font-medium leading-relaxed">
            {q.prompt}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="text-2xl font-black text-zinc-900">{q.prepTime} min</div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Préparation</div>
          </div>
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="text-2xl font-black text-zinc-900">{q.speakTime} min</div>
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Échange</div>
          </div>
        </div>

        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 text-sm font-medium flex items-center gap-3">
           <Info className="shrink-0" size={18} />
           Dans le vrai examen, vous interagissez avec un examinateur. Entraînez-vous à voix haute.
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-white rounded-[2rem] shadow-xl shadow-zinc-200/50 overflow-hidden">
            <div className="p-5 md:p-6">
               <div className="flex justify-between items-center mb-4">
                  <Badge variant="outline" className="px-3 py-1 rounded-full border-none bg-zinc-50 text-zinc-400 font-black tracking-widest uppercase text-[10px]">
                    {currentQuestion.instructions || "Consigne"}
                  </Badge>
                  <div className="hidden sm:block text-xs font-medium text-zinc-400 italic">
                    Sauvegarde automatique...
                  </div>
               </div>

               {currentQuestion.type === 'audio' || currentQuestion.type === 'text'
                 ? renderQCM(currentQuestion as QCMQuestion)
                 : currentQuestion.type === 'writing'
                   ? renderWriting(currentQuestion as WritingQuestion)
                   : renderSpeaking(currentQuestion as SpeakingQuestion)
               }
            </div>

            <div className="p-4 md:p-5 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
               <div className="hidden md:block text-sm text-zinc-400 font-medium">
                  {state.currentQuestionIndex + 1} sur {questions.length}
               </div>
               <Button
                 onClick={handleNext}
                 disabled={isCorrecting}
                 className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-base font-black shadow-xl shadow-indigo-600/20 disabled:opacity-60"
               >
                 {isCorrecting
                   ? "Correction IA en cours..."
                   : state.currentQuestionIndex < questions.length - 1
                     ? "Question suivante"
                     : "Terminer la section"}
                 <ArrowRight className="ml-2" size={18} />
               </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <ConfirmDialog
        open={!!unansweredWarning}
        onOpenChange={(open) => !open && setUnansweredWarning(null)}
        title="Question sans réponse"
        description={unansweredWarning || ''}
        confirmLabel={isLastQuestion ? 'Terminer quand même' : 'Continuer sans répondre'}
        cancelLabel="Revenir en arrière"
        onConfirm={nextQuestion}
      />
    </div>
  );
}
