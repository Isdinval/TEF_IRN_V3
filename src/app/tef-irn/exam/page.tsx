'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useExam, ExamMetadata } from '@/contexts/ExamContext';
import { TimerModal } from '@/components/exam/TimerModal';
import { ExamSelector } from '@/components/exam/ExamSelector';
import { Loader2 } from 'lucide-react';

function ExamPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, isLoading, exams, isLoadingExams } = useExam();
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

  // Lancement direct depuis un lien externe (checkpoint "Examen blanc" de
  // /tef-irn/progression, item Phase 3bis) : ?examId=<uuid> ouvre directement
  // le TimerModal du bon examen, sans repasser par le catalogue. Ne se
  // déclenche qu'une fois (autoLaunchedRef) pour ne pas rouvrir le modal si
  // l'utilisateur le ferme volontairement, et jamais si une session est déjà
  // en cours (le useEffect ci-dessus prend la main dans ce cas).
  const examIdParam = searchParams.get('examId');
  const autoLaunchedRef = useRef(false);
  useEffect(() => {
    if (autoLaunchedRef.current || !examIdParam || isLoading || isLoadingExams) return;
    if (state.status !== 'idle') return;
    const match = exams.find((e) => e.id === examIdParam);
    if (match) {
      autoLaunchedRef.current = true;
      setSelectedExam(match);
      setIsModalOpen(true);
    }
  }, [examIdParam, exams, isLoading, isLoadingExams, state.status]);

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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <ExamPageContent />
    </Suspense>
  );
}
