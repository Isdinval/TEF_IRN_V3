'use client';

import React from 'react';
import { useExam } from '@/contexts/ExamContext';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuestionNavigator() {
  const { state, questions, setQuestionIndex, nextQuestion, prevQuestion } = useExam();
  const isBackNavLocked = state.section === 'EO';

  return (
    <div className="bg-white border-t md:border-t-0 md:border-l border-zinc-100 p-6 w-full md:w-80 flex flex-col gap-6 overflow-y-auto max-h-[40vh] md:max-h-none">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-zinc-900">Navigation</h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={prevQuestion}
            disabled={state.currentQuestionIndex === 0 || isBackNavLocked}
            title={isBackNavLocked ? "Retour désactivé pendant l'expression orale" : undefined}
            className="h-8 w-8 rounded-xl"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="icon" onClick={nextQuestion} disabled={state.currentQuestionIndex === questions.length - 1} className="h-8 w-8 rounded-xl">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
        {questions.map((q, i) => {
          const isCurrent = state.currentQuestionIndex === i;
          const isAnswered = !!state.answers[q.id];
          const isLocked = isBackNavLocked && i < state.currentQuestionIndex;

          return (
            <button
              key={q.id}
              onClick={() => !isLocked && setQuestionIndex(i)}
              disabled={isLocked}
              title={isLocked ? "Retour désactivé pendant l'expression orale" : undefined}
              className={cn(
                "h-10 w-full rounded-xl text-sm font-black transition-all border",
                isCurrent
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
                  : isLocked
                    ? "border-zinc-100 bg-zinc-100 text-zinc-300 cursor-not-allowed"
                    : isAnswered
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-300"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="space-y-3 pt-6 border-t border-zinc-100 md:block hidden">
        <div className="flex items-center gap-3 text-xs font-bold text-zinc-500">
          <div className="w-4 h-4 rounded-lg bg-indigo-600" /> En cours
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-zinc-500">
          <div className="w-4 h-4 rounded-lg bg-emerald-600" /> Répondu
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-zinc-500">
          <div className="w-4 h-4 rounded-lg bg-zinc-100 border border-zinc-200" /> Non répondu
        </div>
      </div>
    </div>
  );
}
