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
    <header className="sticky top-0 z-50 w-full bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-white/70 uppercase tracking-wider">
            {state.examType === 'full' ? (isTimed ? 'Examen Complet' : 'Examen Complet · Entraînement libre') : 'Épreuve Individuelle'}
          </span>
          <h1 className="text-lg font-black text-white">
            {sectionNames[state.section]}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {isTimed ? (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-2xl font-black transition-colors ${isLowTime ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/15 text-white'}`}>
              <Timer size={22} className={isLowTime ? 'animate-bounce' : ''} />
              {formatTime}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-black bg-white/15 text-white">
              <Clock size={18} />
              Entraînement libre
            </div>
          )}

          <Button
            variant="ghost"
            disabled={isCorrecting}
            className="hidden md:flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50"
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
