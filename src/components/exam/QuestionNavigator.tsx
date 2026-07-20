'use client';

import React from 'react';
import { useExam } from '@/contexts/ExamContext';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuestionNavigator() {
  const { state, questions, setQuestionIndex, nextQuestion, prevQuestion } = useExam();

  return (
    <div className="bg-white border-t md:border-t-0 md:border-l border-[var(--exam-line)] p-6 w-full md:w-80 flex flex-col gap-6 overflow-y-auto max-h-[40vh] md:max-h-none">
      <div className="flex items-center justify-between">
        <h3 className="font-[family-name:var(--exam-font-display)] font-semibold text-[var(--exam-ink)]">Navigation</h3>
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
                "h-10 w-full rounded-sm font-[family-name:var(--exam-font-mono)] text-sm font-bold transition-all border",
                isCurrent
                  ? "border-[var(--exam-blue)] bg-[var(--exam-blue)] text-white shadow-md"
                  : isAnswered
                    ? "border-[var(--exam-success)]/40 bg-[var(--exam-success)]/10 text-[var(--exam-success)]"
                    : "border-[var(--exam-line)] bg-[var(--exam-paper)] text-[var(--exam-ink)]/40 hover:border-[var(--exam-ink)]/30"
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-auto space-y-3 pt-6 border-t border-[var(--exam-line)] md:block hidden">
        <div className="flex items-center gap-3 text-xs font-bold text-[var(--exam-ink)]/60">
          <div className="w-4 h-4 rounded-sm bg-[var(--exam-blue)]" /> En cours
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-[var(--exam-ink)]/60">
          <div className="w-4 h-4 rounded-sm bg-[var(--exam-success)]" /> Répondu
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-[var(--exam-ink)]/60">
          <div className="w-4 h-4 rounded-sm bg-[var(--exam-paper-dark)] border border-[var(--exam-line)]" /> Non répondu
        </div>
      </div>
    </div>
  );
}
