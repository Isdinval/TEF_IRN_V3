'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Headset, BookOpen, PenTool, Mic, Award, Clock, Repeat } from 'lucide-react';
import { useExam, ExamMetadata } from '@/contexts/ExamContext';
import { ExamSectionType } from '@/types/exam';

interface TimerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exam: ExamMetadata | null;
}

export function TimerModal({ isOpen, onOpenChange, exam }: TimerModalProps) {
  const { startExam, activeExam } = useExam();
  const targetExam = exam || activeExam;

  const options = [
    { id: 'CO', name: 'Compréhension orale', duration: `${targetExam?.duration_co || 20} min`, icon: Headset },
    { id: 'CE', name: 'Compréhension écrite', duration: `${targetExam?.duration_ce || 30} min`, icon: BookOpen },
    { id: 'EE', name: 'Expression écrite', duration: `${targetExam?.duration_ee || 30} min`, icon: PenTool },
    { id: 'EO', name: 'Expression orale', duration: `${targetExam?.duration_eo || 10} min`, icon: Mic },
  ];

  const totalDuration = (targetExam?.duration_co || 20) +
                        (targetExam?.duration_ce || 30) +
                        (targetExam?.duration_ee || 30) +
                        (targetExam?.duration_eo || 10);

  const formatTotalTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}` : `${m} min`;
  };

  const handleSelect = (sectionId: string) => {
    startExam('single', sectionId as ExamSectionType, targetExam?.id);
    onOpenChange(false);
  };

  const handleFullExam = () => {
    startExam('full', undefined, targetExam?.id, true);
    onOpenChange(false);
  };

  const handleFullExamUntimed = () => {
    startExam('full', undefined, targetExam?.id, false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-sm p-8 bg-[var(--exam-paper)] border border-[var(--exam-line)]">
        <DialogHeader className="mb-6">
          <span className="font-[family-name:var(--exam-font-mono,monospace)] text-[11px] tracking-[0.2em] uppercase text-[var(--exam-seal)] font-bold text-center block mb-2">
            Convocation
          </span>
          <DialogTitle className="font-[family-name:var(--exam-font-display,serif)] text-3xl font-semibold text-center text-[var(--exam-ink)]">
            {targetExam?.label || 'Prêt pour l\'entraînement ?'}
          </DialogTitle>
          <DialogDescription className="text-center text-lg mt-2 text-[var(--exam-ink)]/60">
            Choisissez une épreuve spécifique ou lancez l'examen complet.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Button
            variant="outline"
            className="h-20 flex items-center justify-between px-6 rounded-sm border border-[var(--exam-blue)]/20 bg-white hover:border-[var(--exam-blue)] hover:bg-[var(--exam-blue)]/5 transition-all group"
            onClick={handleFullExam}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--exam-blue)] rounded-sm flex items-center justify-center text-white shadow-md">
                <Award size={24} />
              </div>
              <div className="text-left">
                <div className="font-[family-name:var(--exam-font-display,serif)] font-semibold text-[var(--exam-ink)] text-lg">Examen Complet</div>
                <div className="font-[family-name:var(--exam-font-mono,monospace)] text-sm text-[var(--exam-ink)]/50 font-medium">{formatTotalTime(totalDuration)} • Les 4 épreuves • Conditions réelles</div>
              </div>
            </div>
            <div className="font-[family-name:var(--exam-font-mono,monospace)] bg-[var(--exam-blue)]/10 text-[var(--exam-blue)] px-3 py-1 rounded-full text-xs font-bold">RECOMMANDÉ</div>
          </Button>

          <Button
            variant="outline"
            className="h-20 flex items-center justify-between px-6 rounded-sm border border-[var(--exam-success)]/25 bg-white hover:border-[var(--exam-success)] hover:bg-[var(--exam-success)]/5 transition-all group"
            onClick={handleFullExamUntimed}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--exam-success)] rounded-sm flex items-center justify-center text-white shadow-md">
                <Repeat size={24} />
              </div>
              <div className="text-left">
                <div className="font-[family-name:var(--exam-font-display,serif)] font-semibold text-[var(--exam-ink)] text-lg">Examen Complet</div>
                <div className="font-[family-name:var(--exam-font-mono,monospace)] text-sm text-[var(--exam-ink)]/50 font-medium">{formatTotalTime(totalDuration)} • Les 4 épreuves • Entraînement libre</div>
              </div>
            </div>
            <div className="font-[family-name:var(--exam-font-mono,monospace)] bg-[var(--exam-success)]/10 text-[var(--exam-success)] px-3 py-1 rounded-full text-xs font-bold">SANS CHRONO</div>
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-dashed border-[var(--exam-line)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--exam-paper)] px-2 font-[family-name:var(--exam-font-mono,monospace)] text-[var(--exam-ink)]/40 font-bold tracking-widest">Ou par épreuve</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className="flex flex-col items-center gap-3 p-6 rounded-sm border border-[var(--exam-line)] bg-white hover:border-[var(--exam-blue)]/40 hover:bg-[var(--exam-blue)]/5 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-[var(--exam-blue)]/10 text-[var(--exam-blue)] rounded-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                  <opt.icon size={24} />
                </div>
                <div>
                  <div className="font-[family-name:var(--exam-font-display,serif)] font-semibold text-[var(--exam-ink)] text-sm leading-tight">{opt.name}</div>
                  <div className="font-[family-name:var(--exam-font-mono,monospace)] text-xs text-[var(--exam-ink)]/45 font-medium mt-1 flex items-center justify-center gap-1">
                    <Clock size={10} /> {opt.duration}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
