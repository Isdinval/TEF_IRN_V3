'use client';

// Pratique libre de la Compréhension Orale, sans passer par un examen blanc
// complet. Miroir exact de comprehension-ecrite/page.tsx (voir ses
// commentaires pour le choix d'imbrication sous /tef-irn/exam et le style
// filtres/cards repris de writing/oral) -- seule différence : section 'CO'
// au lieu de 'CE', icône Headset, formats et durée propres à la CO.
//
// La lecture audio des questions est gérée par QuestionCard/AudioPlayer,
// déjà en place et inchangée : aucune nouvelle logique de lecture audio
// n'est introduite par cette page.

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExam, ExamMetadata } from '@/contexts/ExamContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Headset, Target, Shuffle, Play, Loader2, AlertTriangle, Clock } from 'lucide-react';

const ALL_LEVELS = 'Tous';

// B5 (plan "pratique CE/CO") : les 4 libellés de format ci-dessous
// reprennent la répartition officielle du skill llamakusi-co-content
// (annonces, repondeurs, chroniques, micro_trottoirs) -- à garder en
// phase si cette répartition venait à changer côté génération de contenu.
const FORMATS = ['Annonces', 'Répondeurs', 'Chroniques', 'Micro-trottoirs'];

export default function ComprehensionOralePage() {
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
    startExam('single', 'CO', exam.id);
    router.push('/tef-irn/exam/session');
  };

  const handleSurpriseMe = () => {
    if (filteredExams.length === 0) return;
    const random = filteredExams[Math.floor(Math.random() * filteredExams.length)];
    handleSelect(random);
  };

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      <div className="mx-auto max-w-6xl p-4 md:p-10 lg:p-12">
        <div className="mb-8">
          <Badge className="rounded-full border-none bg-indigo-600 px-4 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 mb-3">
            Compréhension Orale
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 leading-tight">
            Entraînez-vous à la Compréhension Orale
          </h1>
          <p className="mt-2 text-zinc-500 font-medium max-w-2xl">
            Enregistrements audio et questions conformes au format officiel du TEF IRN,
            répartis sur 4 formats. Choisissez un niveau ci-dessous pour vous entraîner
            librement, sans passer par un examen blanc complet.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {FORMATS.map((format) => (
              <span key={format} className="rounded-full bg-white border border-zinc-200 px-3 py-1 text-[11px] font-bold text-zinc-500">
                {format}
              </span>
            ))}
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 space-y-4 shadow-sm">
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} className="text-indigo-600" /> Niveau
                </div>
                <div className="flex flex-wrap gap-2">
                  {levels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setActiveLevel(level)}
                      className={`flex-1 h-12 rounded-2xl font-black transition-all ${activeLevel === level ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 hover:border-zinc-200'}`}
                    >
                      {level === ALL_LEVELS ? level : `Niveau ${level}`}
                    </button>
                  ))}
                </div>
              </div>

              <div
                onClick={handleSurpriseMe}
                className="bg-indigo-600 p-6 rounded-[2.5rem] text-white space-y-4 shadow-2xl shadow-indigo-100 relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                  <Shuffle size={14} /> Écoute surprise
                </div>
                <h4 className="text-base font-black leading-tight">Laissez-vous surprendre</h4>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                  <Play size={16} /> Tirage aléatoire
                </div>
              </div>
            </div>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tight flex items-center gap-2">
                  <Badge className="bg-indigo-600 rounded-full px-3 py-1 text-white border-none">
                    Niveau {activeLevel === ALL_LEVELS ? 'Tous' : activeLevel}
                  </Badge>
                </h2>
                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {filteredExams.length} examen{filteredExams.length > 1 ? 's' : ''} disponible{filteredExams.length > 1 ? 's' : ''}
                </div>
              </div>

              {filteredExams.length === 0 ? (
                <p className="py-10 text-center text-sm font-medium text-zinc-400">
                  Aucun examen disponible pour ce niveau.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredExams.map((exam) => (
                    <Card
                      key={exam.id}
                      className="group cursor-pointer overflow-hidden rounded-[1.75rem] border-none bg-white shadow-lg shadow-zinc-200/50 transition-transform hover:-translate-y-1 hover:shadow-xl"
                      onClick={() => handleSelect(exam)}
                    >
                      <CardContent className="flex flex-col gap-3 p-6">
                        <div className="flex items-center gap-2">
                          <Badge className="rounded-full border-none bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                            Niveau {exam.level}
                          </Badge>
                          <Badge variant="outline" className="rounded-full border-indigo-200 bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                            <Clock size={11} className="mr-1" /> {exam.duration_co} min
                          </Badge>
                        </div>
                        <h3 className="text-lg font-black leading-tight tracking-tight text-zinc-900">
                          {exam.label}
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                          20 questions · Compréhension Orale seule
                        </p>
                        <p className="line-clamp-3 text-sm font-medium leading-relaxed text-zinc-500">
                          {exam.description}
                        </p>
                        <Button
                          size="sm"
                          className="mt-2 w-fit rounded-xl bg-zinc-900 font-black group-hover:bg-indigo-600"
                        >
                          <Headset className="mr-2" size={14} /> Écouter
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
