'use client';

import React from 'react';
import { Timer, LogOut } from 'lucide-react';
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
  const { state, finishSection, activeExam } = useExam();

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

  const { formatTime, isLowTime } = useTimer({
    duration: getDuration(),
    startedAt: state.startedAt,
    isActive: state.status === 'in_progress',
    onTimeUp: finishSection,
  });

  const handleFinishClick = () => {
    if (confirm('Voulez-vous vraiment terminer cette épreuve ?')) {
      finishSection();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {state.examType === 'full' ? 'Examen Complet' : 'Épreuve Individuelle'}
          </span>
          <h1 className="text-lg font-black text-[#002654]">
            {sectionNames[state.section]}
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-2xl font-black transition-colors ${isLowTime ? 'bg-red-50 text-[#ED2939] animate-pulse' : 'bg-slate-50 text-slate-700'}`}>
            <Timer size={24} className={isLowTime ? 'animate-bounce' : ''} />
            {formatTime}
          </div>

          <Button
            variant="ghost"
            className="hidden md:flex items-center gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleFinishClick}
          >
            <LogOut size={20} />
            Terminer l'épreuve
          </Button>
        </div>
      </div>
    </header>
  );
}
