'use client';

import React, { useState } from 'react';
import { ExamProvider, useExam, ExamMetadata } from '@/contexts/ExamContext';
import { TimerModal } from '@/components/exam/TimerModal';
import { ExamHeader } from '@/components/exam/ExamHeader';
import { ProgressBar } from '@/components/exam/ProgressBar';
import { QuestionNavigator } from '@/components/exam/QuestionNavigator';
import { QuestionCard } from '@/components/exam/QuestionCard';
import { ResultsScreen } from '@/components/exam/ResultsScreen';
import { SectionTransition } from '@/components/exam/SectionTransition';
import { ExamSelector } from '@/components/exam/ExamSelector';

function ExamContent() {
  const { state } = useExam();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamMetadata | null>(null);

  if (state.status === 'finished') {
    return <ResultsScreen />;
  }

  if (state.status === 'paused') {
    return <SectionTransition />;
  }

  if (state.status === 'in_progress') {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[var(--exam-paper)]">
        <ExamHeader />
        <ProgressBar />
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-3 md:p-5">
            <QuestionCard />
          </div>
          <QuestionNavigator />
        </main>
      </div>
    );
  }

  return (
    <>
      <ExamSelector
        onSelect={(exam) => {
          setSelectedExam(exam);
          setIsModalOpen(true);
        }}
      />
      <TimerModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} exam={selectedExam} />
    </>
  );
}

export default function ExamPage() {
  return (
    <ExamProvider>
      <ExamContent />
    </ExamProvider>
  );
}
