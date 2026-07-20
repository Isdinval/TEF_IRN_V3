'use client';

import React, { useState, useEffect } from 'react';
import { useExam } from '@/contexts/ExamContext';
import { QCMQuestion, WritingQuestion, SpeakingQuestion } from '@/types/exam';
import { AudioPlayer } from './AudioPlayer';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Info, HelpCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function QuestionCard() {
  const { state, questions, currentQuestion, setAnswer, nextQuestion, isCorrecting } = useExam();
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
                 disabled={isCorrecting}
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
