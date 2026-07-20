'use client';

import React, { useState, useEffect } from 'react';
import { useExam } from '@/contexts/ExamContext';
import { QCMQuestion, WritingQuestion, SpeakingQuestion } from '@/types/exam';
import { AudioPlayer } from './AudioPlayer';
import { SpeakingSession } from './SpeakingSession';
import { ORAL_CRITERIA_LABELS } from '@/lib/oral-criteria';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Info, HelpCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function QuestionCard() {
  const { state, questions, currentQuestion, setAnswer, nextQuestion, isCorrecting, submitOralAnalysis, oralAnalyses } = useExam();
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (currentQuestion.type === 'writing') {
      const text = state.answers[currentQuestion.id] || '';
      setWordCount(text.trim() === '' ? 0 : text.trim().split(/\s+/).length);
    }
  }, [state.answers, currentQuestion]);

  const renderQCM = (q: QCMQuestion) => {
    const selectedAnswer = state.answers[q.id];

    return (
      <div className="space-y-8">
        {q.type === 'audio' && (
          <AudioPlayer url={q.audioUrl || ''} maxPlays={q.maxPlays || 1} questionId={q.id} />
        )}

        {q.texte && (
          <div className="p-8 bg-[var(--exam-paper)] rounded-sm border border-[var(--exam-line)] text-lg leading-relaxed text-[var(--exam-ink)]/80 italic">
            {q.texte}
          </div>
        )}

        {q.imageUrl && (
          <div className="flex justify-center">
            <img src={q.imageUrl} alt="Context" className="rounded-sm shadow-lg border border-[var(--exam-line)] max-w-full h-auto" />
          </div>
        )}

        <div className="space-y-4">
          <h2 className="font-[family-name:var(--exam-font-display)] text-2xl font-semibold text-[var(--exam-ink)] leading-tight">
            {q.question}
          </h2>

          <div className="grid gap-3">
            {q.options.map((opt) => {
              const letter = opt.substring(0, 1);
              const isSelected = selectedAnswer === letter;

              return (
                <button
                  key={opt}
                  onClick={() => setAnswer(q.id, letter)}
                  className={`
                    w-full p-5 rounded-sm border text-left transition-all flex items-center gap-4
                    ${isSelected
                      ? 'border-[var(--exam-blue)] bg-[var(--exam-blue)] text-white shadow-lg'
                      : 'border-[var(--exam-line)] bg-white text-[var(--exam-ink)]/75 hover:border-[var(--exam-ink)]/30 hover:bg-[var(--exam-paper)]'}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-sm flex items-center justify-center font-[family-name:var(--exam-font-mono)] font-bold text-lg
                    ${isSelected ? 'bg-white/15 text-white' : 'bg-[var(--exam-paper)] text-[var(--exam-ink)]/40'}
                  `}>
                    {letter}
                  </div>
                  <span className="font-medium text-lg">{opt.substring(3)}</span>
                  {isSelected && <CheckCircle2 className="ml-auto text-white" size={24} />}
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
      <div className="space-y-6">
        <div className="p-6 bg-[var(--exam-paper)] rounded-sm border-l-4 border-[var(--exam-blue)]">
          <h3 className="font-[family-name:var(--exam-font-display)] font-semibold text-[var(--exam-ink)] flex items-center gap-2 mb-2">
            <Info size={18} /> Sujet
          </h3>
          <p className="text-[var(--exam-ink)]/80 leading-relaxed font-medium">
            {q.prompt}
          </p>
        </div>

        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder="Saisissez votre texte ici..."
            className="min-h-[300px] p-8 text-lg rounded-sm border border-[var(--exam-line)] focus:border-[var(--exam-blue)] focus:ring-0 transition-all shadow-inner bg-white"
          />
          <div className={`absolute bottom-4 right-6 px-4 py-1.5 rounded-full font-[family-name:var(--exam-font-mono)] text-xs font-bold ${isMinReached ? 'bg-[var(--exam-success)]/10 text-[var(--exam-success)]' : 'bg-[var(--exam-paper-dark)] text-[var(--exam-ink)]/50'}`}>
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
        <div className="space-y-6">
          <div className="p-6 bg-[var(--exam-paper)] rounded-sm border-l-4 border-[var(--exam-blue)]">
            <h3 className="font-[family-name:var(--exam-font-display)] font-semibold text-[var(--exam-ink)] flex items-center gap-2 mb-2">
              <Info size={18} /> Sujet
            </h3>
            <p className="text-[var(--exam-ink)]/80 leading-relaxed font-medium">{q.prompt}</p>
            <div className="flex gap-4 mt-4 font-[family-name:var(--exam-font-mono)] text-xs font-bold text-[var(--exam-ink)]/50">
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-[family-name:var(--exam-font-display)] text-2xl font-semibold text-[var(--exam-ink)]">
              Échange terminé
            </h2>
            <div className="font-[family-name:var(--exam-font-mono)] text-sm font-bold text-[var(--exam-blue)]">
              Niveau estimé {analysis.estimated_level}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(analysis.scores).map(([key, value]) => (
              <div key={key} className="p-4 bg-[var(--exam-paper)] rounded-sm border border-[var(--exam-line)] text-center">
                <div className="font-[family-name:var(--exam-font-mono)] font-bold text-xl text-[var(--exam-ink)]">{value}</div>
                <div className="text-[10px] font-bold text-[var(--exam-ink)]/45 uppercase tracking-wide mt-1">
                  {ORAL_CRITERIA_LABELS[key as keyof typeof ORAL_CRITERIA_LABELS]}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[var(--exam-ink)]/70 italic">"{analysis.general_comment}"</p>
        </div>
      );
    }

    // Repli : aucun scénario Realtime lié à cette question (ne devrait pas arriver
    // pour les 3 examens actuels, mais évite un écran cassé si un futur examen
    // est créé sans oral_scenario_id).
    return (
      <div className="flex flex-col items-center gap-8 py-8 text-center">
        <div className="w-20 h-20 bg-[var(--exam-paper)] text-[var(--exam-blue)] rounded-sm flex items-center justify-center mb-4">
          <HelpCircle size={40} />
        </div>

        <div className="space-y-4 max-w-2xl">
          <h2 className="font-[family-name:var(--exam-font-display)] text-3xl font-semibold text-[var(--exam-ink)]">
            Épreuve d'Expression Orale
          </h2>
          <p className="text-xl text-[var(--exam-ink)]/70 font-medium leading-relaxed">
            {q.prompt}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-6">
          <div className="p-6 bg-[var(--exam-paper)] rounded-sm border border-[var(--exam-line)]">
            <div className="font-[family-name:var(--exam-font-mono)] text-3xl font-bold text-[var(--exam-ink)]">{q.prepTime} min</div>
            <div className="text-xs font-bold text-[var(--exam-ink)]/45 uppercase tracking-widest mt-1">Préparation</div>
          </div>
          <div className="p-6 bg-[var(--exam-paper)] rounded-sm border border-[var(--exam-line)]">
            <div className="font-[family-name:var(--exam-font-mono)] text-3xl font-bold text-[var(--exam-ink)]">{q.speakTime} min</div>
            <div className="text-xs font-bold text-[var(--exam-ink)]/45 uppercase tracking-widest mt-1">Échange</div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-[var(--exam-seal)]/5 rounded-sm border border-[var(--exam-seal)]/20 text-[var(--exam-seal)] text-sm font-medium flex items-center gap-3">
           <Info className="shrink-0" />
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
          <div className="bg-white rounded-sm shadow-xl shadow-[var(--exam-ink)]/5 overflow-hidden border border-[var(--exam-line)] mb-20">
            <div className="p-8 md:p-12">
               <div className="flex justify-between items-center mb-8">
                  <Badge variant="outline" className="px-4 py-1.5 rounded-full border border-[var(--exam-line)] text-[var(--exam-ink)]/45 font-[family-name:var(--exam-font-mono)] font-bold tracking-widest uppercase text-[10px]">
                    {currentQuestion.instructions || "Consigne"}
                  </Badge>
                  <div className="text-sm font-medium text-[var(--exam-ink)]/40 italic">
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

            <div className="p-8 md:p-10 bg-[var(--exam-paper)] border-t border-[var(--exam-line)] flex justify-between items-center">
               <div className="hidden md:block font-[family-name:var(--exam-font-mono)] text-[var(--exam-ink)]/45 font-medium">
                  {state.currentQuestionIndex + 1} sur {questions.length}
               </div>
               <Button
                 onClick={nextQuestion}
                 disabled={isCorrecting || (currentQuestion.type === 'speaking' && !!(currentQuestion as SpeakingQuestion).oralScenarioId && !oralAnalyses[currentQuestion.id])}
                 className="h-16 px-12 bg-[var(--exam-blue)] hover:bg-[var(--exam-ink)] rounded-sm text-lg font-bold shadow-xl shadow-[var(--exam-blue)]/10 disabled:opacity-60"
               >
                 {isCorrecting
                   ? "Correction IA en cours..."
                   : state.currentQuestionIndex < questions.length - 1
                     ? "Question suivante"
                     : "Terminer la section"}
                 <ArrowRight className="ml-2" />
               </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
