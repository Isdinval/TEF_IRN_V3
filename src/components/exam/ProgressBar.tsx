'use client';

import React from 'react';
import { useExam } from '@/contexts/ExamContext';

export function ProgressBar() {
  const { state, questions } = useExam();

  const progress = ((state.currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full bg-white px-4 py-3 border-b border-zinc-100">
      <div className="container mx-auto flex items-center gap-4">
        <span className="text-xs font-black text-zinc-400 uppercase tracking-wide whitespace-nowrap">
          Question {state.currentQuestionIndex + 1} / {questions.length}
        </span>
        <div className="flex-1 h-2 rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
