'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExam, ExamMetadata } from '@/contexts/ExamContext';
import { TimerModal } from '@/components/exam/TimerModal';
import { ExamSelector } from '@/components/exam/ExamSelector';

export default function ExamPage() {
  const router = useRouter();
  const { state, isLoading } = useExam();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamMetadata | null>(null);

  // Une session est déjà en cours (ou en pause) : on redirige vers l'écran d'épreuve.
  // On attend la fin du chargement du contexte pour éviter un flash "catalogue" avant
  // la restauration de l'état depuis localStorage (voir session/page.tsx).
  useEffect(() => {
    if (!isLoading && state.status !== 'idle') {
      router.replace('/tef-irn/exam/session');
    }
  }, [isLoading, state.status, router]);

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
