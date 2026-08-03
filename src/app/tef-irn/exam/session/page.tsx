'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useExam } from '@/contexts/ExamContext';
import { ExamHeader } from '@/components/exam/ExamHeader';
import { ProgressBar } from '@/components/exam/ProgressBar';
import { QuestionNavigator } from '@/components/exam/QuestionNavigator';
import { QuestionCard } from '@/components/exam/QuestionCard';
import { ResultsScreen } from '@/components/exam/ResultsScreen';
import { SectionTransition } from '@/components/exam/SectionTransition';

export default function ExamSessionPage() {
  const router = useRouter();
  const { state, isLoading } = useExam();

  // Pas de session active (accès direct à l'URL, session expirée) : retour au catalogue.
  // On attend la fin de la restauration du contexte (localStorage / fetch) avant de juger :
  // au tout premier rendu, state.status vaut toujours 'idle' par défaut, même si une
  // session va être restaurée juste après.
  useEffect(() => {
    if (!isLoading && state.status === 'idle') {
      router.replace('/tef-irn/exam');
    }
  }, [isLoading, state.status, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--exam-paper)]">
        <Loader2 className="animate-spin text-[var(--exam-ink)]/40" size={28} />
      </div>
    );
  }

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

  return null;
}
