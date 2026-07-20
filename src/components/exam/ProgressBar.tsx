'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useExam } from '@/contexts/ExamContext';

export function ProgressBar() {
  const { state, questions } = useExam();

  const progress = ((state.currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full bg-white px-4 py-3 border-b border-[var(--exam-line)] shadow-sm">
      <div className="container mx-auto flex items-center gap-4">
        <span className="font-[family-name:var(--exam-font-mono)] text-xs font-bold text-[var(--exam-ink)]/50 whitespace-nowrap">
          Question {state.currentQuestionIndex + 1} / {questions.length}
        </span>
        <div className="flex-1">
          <Progress value={progress} className="h-2 w-full" />
        </div>
      </div>
    </div>
  );
}
