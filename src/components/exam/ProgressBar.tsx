'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useExam } from '@/contexts/ExamContext';

export function ProgressBar() {
  const { state, questions } = useExam();

  const progress = ((state.currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full bg-white dark:bg-slate-900 dark:bg-brand-dark px-4 py-3 border-b shadow-sm">
      <div className="container mx-auto flex items-center gap-4">
        <span className="text-xs font-black text-slate-400 whitespace-nowrap">
          Question {state.currentQuestionIndex + 1} / {questions.length}
        </span>
        <div className="flex-1">
          <Progress value={progress} className="h-3 w-full" />
        </div>
      </div>
    </div>
  );
}
