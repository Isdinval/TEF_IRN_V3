'use client';

// Pratique libre de la Compréhension Écrite, sans passer par un examen blanc
// complet. Reste volontairement imbriquée sous /tef-irn/exam (et non un
// nouveau segment top-level /tef-irn/comprehension-ecrite) pour hériter du
// ExamProvider déjà monté par exam/layout.tsx -- exactement le même
// mécanisme que TimerModal ("Ou par épreuve" -> startExam('single', 'CE', ...))
// mais accessible directement, sans devoir d'abord choisir "Examen Complet"
// puis repérer l'option secondaire dans la modale.
//
// Calquée sur ExamSelector.tsx (même contexte, mêmes classes visuelles) mais
// simplifiée : une seule "jambe" (CE) au lieu des 4, pas de modale de choix
// intermédiaire -- un clic sur une carte lance directement la session.

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExam, ExamMetadata } from '@/contexts/ExamContext';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ArrowRight, Loader2, AlertTriangle, Clock } from 'lucide-react';

const ALL_LEVELS = 'Tous';

export default function ComprehensionEcritePage() {
  const router = useRouter();
  const { exams, isLoadingExams, examsError, refetchExams, startExam } = useExam();
  const [activeLevel, setActiveLevel] = useState<string>(ALL_LEVELS);

  const levels = useMemo(() => {
    const distinct = Array.from(new Set(exams.map((e) => e.level).filter(Boolean))) as string[];
    return [ALL_LEVELS, ...distinct];
  }, [exams]);

  const filteredExams = activeLevel === ALL_LEVELS
    ? exams
    : exams.filter((e) => e.level === activeLevel);

  const handleSelect = (exam: ExamMetadata) => {
    startExam('single', 'CE', exam.id);
    router.push('/tef-irn/exam/session');
  };

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      <div className="mx-auto max-w-6xl p-4 md:p-10 lg:p-12">
        <div className="mb-8">
          <Badge className="rounded-full border-none bg-indigo-600 px-4 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 mb-3">
            Compréhension Écrite
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 leading-tight">
            Entraînez-vous à la Compréhension Écrite
          </h1>
          <p className="mt-2 text-zinc-500 font-medium max-w-2xl">
            Textes et questions conformes au format officiel du TEF IRN. Choisissez un niveau
            ci-dessous pour vous entraîner librement, sans passer par un examen blanc complet.
          </p>
        </div>

        {isLoadingExams ? (
          <div className="flex justify-center py-20 text-zinc-300">
            <Loader2 className="animate-spin" size={28} />
          </div>
        ) : examsError ? (
          <div className="rounded-[2.5rem] border-2 border-dashed border-red-200 bg-red-50/50 p-12 text-center">
            <AlertTriangle className="mx-auto mb-4 text-red-300" size={40} />
            <p className="font-bold text-zinc-600 mb-4">Impossible de charger les examens. Vérifiez votre connexion.</p>
            <button
              onClick={refetchExams}
              className="rounded-full px-6 py-2 text-xs font-black uppercase tracking-widest bg-white text-zinc-500 border border-zinc-200 hover:border-indigo-200 hover:text-indigo-600 transition-all"
            >
              Réessayer
            </button>
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
                  onClick={() => handleSelect(exam)}
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
                        <BookOpen size={22} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-zinc-400 mb-6">
                      <Clock size={13} />
                      <span className="text-[11px] font-bold uppercase tracking-wide">
                        {exam.duration_ce} min
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-zinc-400">Compréhension Écrite seule</span>
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
