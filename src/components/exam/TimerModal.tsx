'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Headset, BookOpen, PenTool, Mic, Award, Clock, Repeat } from 'lucide-react';
import { useExam, ExamMetadata } from '@/contexts/ExamContext';
import { ExamSectionType } from '@/types/exam';

interface TimerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  exam: ExamMetadata | null;
}

export function TimerModal({ isOpen, onOpenChange, exam }: TimerModalProps) {
  const router = useRouter();
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
    router.push('/tef-irn/exam/session');
  };

  const handleFullExam = () => {
    startExam('full', undefined, targetExam?.id, true);
    onOpenChange(false);
    router.push('/tef-irn/exam/session');
  };

  const handleFullExamUntimed = () => {
    startExam('full', undefined, targetExam?.id, false);
    onOpenChange(false);
    router.push('/tef-irn/exam/session');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl p-8 bg-white border-none shadow-2xl shadow-zinc-200">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-black text-center text-zinc-900">
            {targetExam?.label || 'Prêt pour l\'entraînement ?'}
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500 font-medium mt-1">
            Choisissez une épreuve spécifique ou lancez l'examen complet.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4">
          <button
            className="h-20 flex items-center justify-between px-6 rounded-2xl border-none bg-indigo-50/60 hover:bg-indigo-50 transition-all group"
            onClick={handleFullExam}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 shrink-0 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
                <Award size={22} />
              </div>
              <div className="text-left min-w-0">
                <div className="font-black text-zinc-900 text-base">Examen Complet</div>
                <div className="text-sm text-zinc-500 font-medium truncate">{formatTotalTime(totalDuration)} • Les 4 épreuves • Conditions réelles</div>
              </div>
            </div>
            <div className="shrink-0 bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">RECOMMANDÉ</div>
          </button>

          <button
            className="h-20 flex items-center justify-between px-6 rounded-2xl border-none bg-emerald-50/60 hover:bg-emerald-50 transition-all group"
            onClick={handleFullExamUntimed}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 shrink-0 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
                <Repeat size={22} />
              </div>
              <div className="text-left min-w-0">
                <div className="font-black text-zinc-900 text-base">Examen Complet</div>
                <div className="text-sm text-zinc-500 font-medium truncate">{formatTotalTime(totalDuration)} • Les 4 épreuves • Entraînement libre</div>
              </div>
            </div>
            <div className="shrink-0 bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">SANS CHRONO</div>
          </button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-400 font-black tracking-widest">Ou par épreuve</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-zinc-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/40 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                  <opt.icon size={22} />
                </div>
                <div>
                  <div className="font-black text-zinc-900 text-sm leading-tight">{opt.name}</div>
                  <div className="text-xs text-zinc-400 font-bold uppercase tracking-wide mt-1 flex items-center justify-center gap-1">
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
