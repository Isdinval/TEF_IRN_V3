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
  const { state, isLoading, exams, isLoadingExams, startExam } = useExam();
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
  // /tef-irn/progression) : ?examId=<uuid> lance directement l'examen
  // complet en conditions réelles -- même action que le premier bouton du
  // TimerModal (handleFullExam()) -- au lieu de seulement pré-ouvrir le
  // modal, qui laissait un clic de plus à faire (retour Olivier après tests
  // manuels). Ne se déclenche qu'une fois (autoLaunchedRef), et jamais si
  // une session est déjà en cours (le useEffect ci-dessus prend la main).
  const examIdParam = searchParams.get('examId');
  const autoLaunchedRef = useRef(false);
  const [matchNotFound, setMatchNotFound] = useState(false);
  useEffect(() => {
    if (autoLaunchedRef.current || !examIdParam || isLoading || isLoadingExams) return;
    if (state.status !== 'idle') return;
    const match = exams.find((e) => e.id === examIdParam);
    if (match) {
      autoLaunchedRef.current = true;
      startExam('full', undefined, match.id, true);
      router.push('/tef-irn/exam/session');
    } else {
      // examId invalide/introuvable : repli sur le catalogue plutôt que de
      // rester bloqué sur un loader indéfiniment.
      setMatchNotFound(true);
    }
  }, [examIdParam, exams, isLoading, isLoadingExams, state.status, startExam, router]);

  // Le catalogue ne doit jamais s'afficher le temps du lancement auto --
  // sinon flash visible avant la redirection vers /session.
  if (examIdParam && !matchNotFound && !autoLaunchedRef.current) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <ExamPageContent />
    </Suspense>
  );
}
