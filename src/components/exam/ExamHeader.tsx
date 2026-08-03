'use client';

import React from 'react';
import { Timer, LogOut, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExam } from '@/contexts/ExamContext';
import { useTimer } from '@/hooks/useTimer';
import { ExamSectionType } from '@/types/exam';

const sectionNames: Record<ExamSectionType, string> = {
  CO: 'Compréhension Orale',
  CE: 'Compréhension Écrite',
  EE: 'Expression Écrite',
  EO: 'Expression Orale',
};

export function ExamHeader() {
  const { state, finishSection, activeExam, isCorrecting } = useExam();

  const getDuration = () => {
    if (!activeExam) return 20 * 60;
    switch(state.section) {
      case 'CO': return (activeExam.duration_co || 20) * 60;
      case 'CE': return (activeExam.duration_ce || 30) * 60;
      case 'EE': return (activeExam.duration_ee || 30) * 60;
      case 'EO': return (activeExam.duration_eo || 10) * 60;
      default: return 20 * 60;
    }
  };

  const isTimed = state.isTimed !== false;

  const { formatTime, isLowTime } = useTimer({
    duration: getDuration(),
    startedAt: state.startedAt,
    isActive: state.status === 'in_progress' && isTimed,
    onTimeUp: finishSection,
  });

  const handleFinishClick = () => {
    if (confirm('Voulez-vous vraiment terminer cette épreuve ?')) {
      finishSection();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[var(--exam-line)] shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-[family-name:var(--exam-font-mono)] text-[11px] font-bold text-[var(--exam-ink)]/45 uppercase tracking-wider">
            {state.examType === 'full' ? (isTimed ? 'Examen Complet' : 'Examen Complet · Entraînement libre') : 'Épreuve Individuelle'}
          </span>
          <h1 className="font-[family-name:var(--exam-font-display)] text-lg font-semibold text-[var(--exam-ink)]">
            {sectionNames[state.section]}
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {isTimed ? (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-sm font-[family-name:var(--exam-font-mono)] text-2xl font-bold transition-colors ${isLowTime ? 'bg-[var(--exam-seal)]/10 text-[var(--exam-seal)] animate-pulse' : 'bg-[var(--exam-paper)] text-[var(--exam-ink)]'}`}>
              <Timer size={24} className={isLowTime ? 'animate-bounce' : ''} />
              {formatTime}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-sm font-[family-name:var(--exam-font-mono)] text-sm font-bold bg-[var(--exam-blue)]/10 text-[var(--exam-blue)]">
              <Clock size={18} />
              Entraînement libre
            </div>
          )}

          <Button
            variant="ghost"
            disabled={isCorrecting}
            className="hidden md:flex items-center gap-2 text-[var(--exam-ink)]/50 hover:text-[var(--exam-seal)] hover:bg-[var(--exam-seal)]/5 disabled:opacity-50"
            onClick={handleFinishClick}
          >
            <LogOut size={20} />
            {isCorrecting ? "Correction IA..." : "Terminer l'épreuve"}
          </Button>
        </div>
      </div>
    </header>
  );
}
