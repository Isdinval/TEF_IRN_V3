'use client';

import React from 'react';
import { useExam, ExamMetadata } from '@/contexts/ExamContext';
import { Headset, BookOpen, PenTool, Mic, ArrowRight, Loader2, Award } from 'lucide-react';

interface ExamSelectorProps {
  onSelect: (exam: ExamMetadata) => void;
}

function totalDuration(exam: ExamMetadata) {
  const mins = exam.duration_co + exam.duration_ce + exam.duration_ee + exam.duration_eo;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}` : `${m} min`;
}

export function ExamSelector({ onSelect }: ExamSelectorProps) {
  const { exams, isLoadingExams } = useExam();

  const legs = (exam: ExamMetadata) => [
    { id: 'CO', label: 'CO', duration: exam.duration_co, icon: Headset },
    { id: 'CE', label: 'CE', duration: exam.duration_ce, icon: BookOpen },
    { id: 'EE', label: 'EE', duration: exam.duration_ee, icon: PenTool },
    { id: 'EO', label: 'EO', duration: exam.duration_eo, icon: Mic },
  ];

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      <div className="mx-auto max-w-3xl p-4 md:p-10 lg:p-12">
        <div className="mb-10">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-2">
            Examens blancs
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 leading-tight">
            Choisissez votre examen blanc
          </h1>
          <p className="mt-2 text-zinc-500 font-medium">
            Trois simulations complètes, conformes au format officiel du TEF IRN.
          </p>
        </div>

        {isLoadingExams ? (
          <div className="flex justify-center py-20 text-zinc-300">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : (
          <div className="space-y-5">
            {exams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => onSelect(exam)}
                className="group w-full text-left bg-white border-none rounded-3xl shadow-lg shadow-zinc-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden"
              >
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <Award size={22} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-xl md:text-2xl font-black text-zinc-900 truncate">
                          {exam.label}
                        </h2>
                        <p className="text-sm text-zinc-500 mt-0.5">{exam.description}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-indigo-600">
                      Niveau {exam.level}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-5 border-t border-zinc-100">
                    <div className="flex flex-wrap gap-4">
                      {legs(exam).map((leg) => (
                        <div key={leg.id} className="flex items-center gap-1.5 text-zinc-400">
                          <leg.icon size={14} />
                          <span className="text-xs font-bold uppercase tracking-wide">
                            {leg.label} {leg.duration}min
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-zinc-400">
                        Durée totale {totalDuration(exam)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-black text-indigo-600 group-hover:gap-2.5 transition-all">
                        Commencer <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
