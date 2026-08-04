'use client';

import React, { useMemo, useState } from 'react';
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

const ALL_LEVELS = 'Tous';

export function ExamSelector({ onSelect }: ExamSelectorProps) {
  const { exams, isLoadingExams } = useExam();
  const [activeLevel, setActiveLevel] = useState<string>(ALL_LEVELS);

  const legs = (exam: ExamMetadata) => [
    { id: 'CO', label: 'CO', duration: exam.duration_co, icon: Headset },
    { id: 'CE', label: 'CE', duration: exam.duration_ce, icon: BookOpen },
    { id: 'EE', label: 'EE', duration: exam.duration_ee, icon: PenTool },
    { id: 'EO', label: 'EO', duration: exam.duration_eo, icon: Mic },
  ];

  const levels = useMemo(() => {
    const distinct = Array.from(new Set(exams.map((e) => e.level).filter(Boolean))) as string[];
    return [ALL_LEVELS, ...distinct];
  }, [exams]);

  const filteredExams = activeLevel === ALL_LEVELS
    ? exams
    : exams.filter((e) => e.level === activeLevel);

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      <div className="mx-auto max-w-6xl p-4 md:p-10 lg:p-12">
        <div className="mb-8">
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
          <>
            {levels.length > 2 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setActiveLevel(level)}
                    className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                      activeLevel === level
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-zinc-500 border border-zinc-200 hover:border-indigo-200 hover:text-indigo-600'
                    }`}
                  >
                    {level === ALL_LEVELS ? level : `Niveau ${level}`}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => onSelect(exam)}
                  className="group text-left overflow-hidden rounded-[2.5rem] border-none bg-white shadow-xl shadow-zinc-200/50 transition-all hover:-translate-y-1"
                >
                  <div className="p-7 flex flex-col h-full">
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                          Niveau {exam.level}
                        </p>
                        <h2 className="text-lg font-black text-zinc-900 leading-snug">
                          {exam.label}
                        </h2>
                      </div>
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                        <Award size={22} />
                      </div>
                    </div>

                    <p className="text-sm text-zinc-500 mb-5">{exam.description}</p>

                    <div className="flex flex-wrap gap-3 mb-6">
                      {legs(exam).map((leg) => (
                        <div key={leg.id} className="flex items-center gap-1 text-zinc-400">
                          <leg.icon size={13} />
                          <span className="text-[11px] font-bold uppercase tracking-wide">
                            {leg.label} {leg.duration}min
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-zinc-400">
                        {totalDuration(exam)}
                      </span>
                      <span className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-black text-white transition-all group-hover:bg-indigo-600">
                        Commencer <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
