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
import { Headset, BookOpen, PenTool, Mic, Award, Clock } from 'lucide-react';
import { useExam } from '@/contexts/ExamContext';
import { ExamSectionType } from '@/types/exam';

interface TimerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const options = [
  { id: 'CO', name: 'Compréhension orale', duration: '20 min', icon: Headset, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'CE', name: 'Compréhension écrite', duration: '30 min', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'EE', name: 'Expression écrite', duration: '30 min', icon: PenTool, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'EO', name: 'Expression orale', duration: '10 min', icon: Mic, color: 'text-purple-600', bg: 'bg-purple-50' },
];

export function TimerModal({ isOpen, onOpenChange }: TimerModalProps) {
  const { startExam } = useExam();

  const handleSelect = (sectionId: string) => {
    startExam('single', sectionId as ExamSectionType);
    onOpenChange(false);
  };

  const handleFullExam = () => {
    startExam('full');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-black text-center text-[#002654]">
            Prêt pour l'entraînement ?
          </DialogTitle>
          <DialogDescription className="text-center text-lg mt-2">
            Choisissez une épreuve spécifique ou lancez l'examen complet.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <Button
            variant="outline"
            className="h-20 flex items-center justify-between px-6 rounded-2xl border-2 border-indigo-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
            onClick={handleFullExam}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Award size={24} />
              </div>
              <div className="text-left">
                <div className="font-black text-[#002654] text-lg">Examen Complet</div>
                <div className="text-sm text-slate-500 font-medium">1h30 • Les 4 épreuves</div>
              </div>
            </div>
            <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black">POPULAIRE</div>
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Ou par section</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-50 hover:border-slate-200 hover:bg-slate-50 transition-all text-center group"
              >
                <div className={`w-12 h-12 ${opt.bg} ${opt.color} rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                  <opt.icon size={24} />
                </div>
                <div>
                  <div className="font-bold text-[#002654] text-sm leading-tight">{opt.name}</div>
                  <div className="text-xs text-slate-400 font-medium mt-1 flex items-center justify-center gap-1">
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
