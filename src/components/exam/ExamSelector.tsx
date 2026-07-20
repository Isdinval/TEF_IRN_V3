'use client';

import React from 'react';
import { useExam, ExamMetadata } from '@/contexts/ExamContext';
import { Headset, BookOpen, PenTool, Mic, ArrowRight, Loader2 } from 'lucide-react';

interface ExamSelectorProps {
  onSelect: (exam: ExamMetadata) => void;
}

function referenceCode(slug: string | undefined, index: number) {
  const num = slug?.match(/(\d+)$/)?.[1] ?? String(index + 1).padStart(2, '0');
  return `N° TEF-2026-${num.padStart(2, '0')}`;
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
    <div className="min-h-screen bg-[var(--exam-paper)] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <div
            className="font-[family-name:var(--exam-font-mono)] text-xs tracking-[0.25em] uppercase text-[var(--exam-seal)] font-bold mb-3"
          >
            Convocations disponibles
          </div>
          <h1 className="font-[family-name:var(--exam-font-display)] text-4xl md:text-5xl font-semibold text-[var(--exam-ink)] leading-tight">
            Choisissez votre examen blanc
          </h1>
          <p className="mt-3 text-[var(--exam-ink)]/60 text-lg">
            Trois simulations complètes, conformes au format officiel du TEF IRN.
          </p>
        </div>

        {isLoadingExams ? (
          <div className="flex justify-center py-20 text-[var(--exam-ink)]/50">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : (
          <div className="space-y-6">
            {exams.map((exam, index) => (
              <button
                key={exam.id}
                onClick={() => onSelect(exam)}
                className="group w-full text-left bg-white border border-[var(--exam-line)] rounded-sm shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* En-tête du dossier */}
                <div className="flex items-center justify-between px-6 md:px-8 pt-5 pb-4">
                  <span className="font-[family-name:var(--exam-font-mono)] text-[11px] tracking-wider uppercase text-[var(--exam-ink)]/50">
                    Dossier d'examen
                  </span>
                  <span className="font-[family-name:var(--exam-font-mono)] text-[11px] tracking-wider text-[var(--exam-seal)] font-bold">
                    {referenceCode(exam.slug, index)}
                  </span>
                </div>

                <div className="px-6 md:px-8 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-[family-name:var(--exam-font-display)] text-2xl md:text-3xl font-semibold text-[var(--exam-ink)]">
                        {exam.label}
                      </h2>
                      <p className="text-[var(--exam-ink)]/65 mt-1">{exam.description}</p>
                    </div>
                    <span className="shrink-0 font-[family-name:var(--exam-font-mono)] text-xs font-bold px-3 py-1 rounded-full border border-[var(--exam-blue)]/20 text-[var(--exam-blue)] bg-[var(--exam-blue)]/5">
                      Niveau {exam.level}
                    </span>
                  </div>
                </div>

                {/* Perforation */}
                <div
                  className="relative h-0 border-t-2 border-dashed border-[var(--exam-line)]"
                  aria-hidden
                >
                  <span className="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[var(--exam-paper)] border border-[var(--exam-line)]" />
                  <span className="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[var(--exam-paper)] border border-[var(--exam-line)]" />
                </div>

                {/* Talon : itinéraire + action */}
                <div className="px-6 md:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[var(--exam-paper-dark)]/40">
                  <div className="flex flex-wrap gap-4">
                    {legs(exam).map((leg) => (
                      <div key={leg.id} className="flex items-center gap-1.5 text-[var(--exam-ink)]/70">
                        <leg.icon size={14} />
                        <span className="font-[family-name:var(--exam-font-mono)] text-xs">
                          {leg.label} {leg.duration}min
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-[family-name:var(--exam-font-mono)] text-xs text-[var(--exam-ink)]/50">
                      Durée totale {totalDuration(exam)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--exam-blue)] group-hover:gap-2.5 transition-all">
                      Commencer <ArrowRight size={16} />
                    </span>
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
