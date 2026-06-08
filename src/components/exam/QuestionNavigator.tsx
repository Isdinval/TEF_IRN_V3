'use client';

import React from 'react';
import { useExam } from '@/contexts/ExamContext';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuestionNavigator() {
  const { state, questions, setQuestionIndex, nextQuestion, prevQuestion } = useExam();

  return (
    <div className="bg-white border-t md:border-t-0 md:border-l p-6 w-full md:w-80 flex flex-col gap-6 overflow-y-auto max-h-[40vh] md:max-h-none">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-[#002654]">Navigation</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={prevQuestion} disabled={state.currentQuestionIndex === 0} className="h-8 w-8 rounded-lg">
            <ChevronLeft size={16} />
          </Button>
          <Button variant="outline" size="icon" onClick={nextQuestion} disabled={state.currentQuestionIndex === questions.length - 1} className="h-8 w-8 rounded-lg">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
        {questions.map((q, i) => {
          const isCurrent = state.currentQuestionIndex === i;
          const isAnswered = !!state.answers[q.id];

          return (
            <button
              key={q.id}
              onClick={() => setQuestionIndex(i)}
              className={cn(
                "h-10 w-full rounded-xl text-sm font-black transition-all border-2",
                isCurrent
                  ? "border-[#002654] bg-[#002654] text-white shadow-lg"
                  : isAnswered
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-300"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-auto space-y-3 pt-6 border-t md:block hidden">
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
          <div className="w-4 h-4 rounded-md bg-[#002654]" /> En cours
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
          <div className="w-4 h-4 rounded-md bg-emerald-500" /> Répondu
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
          <div className="w-4 h-4 rounded-md bg-slate-200" /> Non répondu
        </div>
      </div>
    </div>
  );
}
