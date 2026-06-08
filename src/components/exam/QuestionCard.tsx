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
  const { state, questions, currentQuestion, setAnswer, nextQuestion } = useExam();
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
          <div className="p-8 bg-slate-50 dark:bg-white dark:bg-slate-900/5 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 text-lg leading-relaxed text-slate-700 dark:text-slate-300 italic">
            {q.texte}
          </div>
        )}

        {q.imageUrl && (
          <div className="flex justify-center">
            <img src={q.imageUrl} alt="Context" className="rounded-3xl shadow-lg border-4 border-white max-w-full h-auto" />
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-black text-[#002654] dark:text-white leading-tight">
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
                    w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center gap-4
                    ${isSelected
                      ? 'border-[#002654] bg-[#002654] text-white shadow-xl scale-[1.02]'
                      : 'border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 dark:bg-slate-900 text-slate-600 dark:text-slate-400 dark:text-slate-500 hover:border-slate-200 hover:bg-slate-50 dark:bg-white dark:bg-slate-900/5'}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg
                    ${isSelected ? 'bg-white dark:bg-slate-900 dark:bg-slate-900/20 text-white' : 'bg-slate-100 text-slate-400 dark:text-slate-500'}
                  `}>
                    {letter}
                  </div>
                  <span className="font-black text-lg">{opt.substring(3)}</span>
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
        <div className="p-6 bg-indigo-50 rounded-3xl border-l-4 border-[#002654]">
          <h3 className="font-black text-[#002654] dark:text-white flex items-center gap-2 mb-2">
            <Info size={18} /> Sujet
          </h3>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-bold">
            {q.prompt}
          </p>
        </div>

        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => setAnswer(q.id, e.target.value)}
            placeholder="Saisissez votre texte ici..."
            className="min-h-[300px] p-8 text-lg rounded-[2.5rem] border-2 border-slate-100 dark:border-white/10 focus:border-[#002654] focus:ring-0 transition-all shadow-inner bg-white dark:bg-slate-900 dark:bg-slate-900"
          />
          <div className={`absolute bottom-4 right-6 px-4 py-1.5 rounded-full text-xs font-black ${isMinReached ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {wordCount} mots {isMinReached ? '(Minimum atteint ✅)' : `(Min. ${q.minWords} mots)`}
          </div>
        </div>
      </div>
    );
  };

  const renderSpeaking = (q: SpeakingQuestion) => {
    return (
      <div className="flex flex-col items-center gap-8 py-8 text-center">
        <div className="w-20 h-20 bg-indigo-100 text-[#002654] dark:text-white rounded-[2.5rem] flex items-center justify-center mb-4">
          <HelpCircle size={40} />
        </div>

        <div className="space-y-4 max-w-2xl">
          <h2 className="text-3xl font-black text-[#002654] dark:text-white">
            Épreuve d'Expression Orale
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 dark:text-slate-500 font-bold leading-relaxed">
            {q.prompt}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-6">
          <div className="p-6 bg-slate-50 dark:bg-white dark:bg-slate-900/5 rounded-3xl border border-slate-100 dark:border-white/10">
            <div className="text-3xl font-black text-[#002654] dark:text-white">{q.prepTime} min</div>
            <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Préparation</div>
          </div>
          <div className="p-6 bg-slate-50 dark:bg-white dark:bg-slate-900/5 rounded-3xl border border-slate-100 dark:border-white/10">
            <div className="text-3xl font-black text-[#002654] dark:text-white">{q.speakTime} min</div>
            <div className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Échange</div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-3xl border-2 border-amber-100 text-amber-800 text-sm font-bold flex items-center gap-3">
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
          <div className="bg-white dark:bg-slate-900 dark:bg-slate-900 rounded-[3.5rem] shadow-2xl shadow-slate-200/50 shadow-slate-200/60 overflow-hidden border border-slate-50 mb-20">
            <div className="p-8 md:p-12">
               <div className="flex justify-between items-center mb-8">
                  <Badge variant="outline" className="px-4 py-1.5 rounded-full border-2 border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500 font-black tracking-widest uppercase text-[10px]">
                    {currentQuestion.instructions || "Consigne"}
                  </Badge>
                  <div className="text-sm font-black text-slate-400 dark:text-slate-500 italic">
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

            <div className="p-8 md:p-10 bg-slate-50 dark:bg-white dark:bg-slate-900/5 border-t flex justify-between items-center">
               <div className="hidden md:block text-slate-400 dark:text-slate-500 font-bold">
                  {state.currentQuestionIndex + 1} sur {questions.length}
               </div>
               <Button
                 onClick={nextQuestion}
                 className="h-16 px-12 bg-[#002654] hover:bg-slate-800 rounded-3xl text-lg font-black shadow-xl shadow-slate-300"
               >
                 {state.currentQuestionIndex < questions.length - 1 ? "Question suivante" : "Terminer la section"}
                 <ArrowRight className="ml-2" />
               </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
