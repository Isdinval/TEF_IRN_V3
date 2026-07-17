"use client";

import { useState, useMemo, useEffect } from "react";
import { useCoachContext } from "@/contexts/CoachContext";
import { Parcours, Lesson, Exercise, ParcoursProgress } from "@/lib/parcours";
import { User } from "@supabase/supabase-js";
import {
  Trophy,
  Target,
  Sparkles,
  BookText,
  ArrowRight,
  Clock,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { motion } from "framer-motion";
import LessonCard from "./components/LessonCard";
import ExerciseCard from "./components/ExerciseCard";
import { ParcoursBreadcrumb } from "@/components/shared/ParcoursBreadcrumb";

interface ParcoursInteractiveProps {
  parcours: Parcours;
  allLessons: Lesson[];
  initialProgress: ParcoursProgress | null;
  initialRecommendedExercises: Exercise[];
  initialGuideSlug: string | null;
  user: User | null;
}

export default function ParcoursInteractive({
  parcours,
  allLessons,
  initialProgress,
  initialRecommendedExercises,
  initialGuideSlug,
  user
}: ParcoursInteractiveProps) {
  const [progress] = useState(initialProgress);
  const [recommendedExercises] = useState(initialRecommendedExercises);
  const { setPageContext } = useCoachContext();

  useEffect(() => {
    const next = recommendedExercises[0];
    setPageContext({
      type: "parcours",
      category: parcours.category,
      level: parcours.level,
      objective: parcours.objective,
      progress: progress
        ? { completed: progress.completed, total: progress.total, percent: progress.percent }
        : undefined,
      nextExercise: next ? { type: next.type, instructions: next.instructions } : null,
    });
    return () => setPageContext(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcours.id, progress, recommendedExercises]);

  const lessonsWithStatus = useMemo(() => {
    if (!user || !progress) return allLessons.map(l => ({ ...l, status: 'open' as const }));

    let nextFound = false;
    return allLessons.map((lesson) => {
      const isCompleted = progress.completedLessons.includes(lesson.id);
      let status: 'completed' | 'next' | 'locked' | 'open' = 'open';

      if (isCompleted) {
        status = 'completed';
      } else if (!nextFound) {
        status = 'next';
        nextFound = true;
      }

      return { ...lesson, status };
    });
  }, [allLessons, progress, user]);

  return (
    <article className="min-h-screen bg-zinc-50/50 pb-24">
      <div className="bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-white/80">
        <ParcoursBreadcrumb />
      </div>

      <div className="relative overflow-hidden bg-zinc-900 py-24 lg:py-32">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-blue/20 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md"
              >
                <Badge className="bg-indigo-600 text-white border-none rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest">
                  {parcours.level}
                </Badge>
                <span className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  PARCOURS {parcours.category}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.95]"
              >
                {parcours.nom_parcours?.toUpperCase() || `${parcours.category.toUpperCase()} ${parcours.level}`}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-zinc-400 max-w-2xl font-medium leading-relaxed italic"
              >
                {parcours.objective}
              </motion.p>
            </div>

            {user ? (
               <div className="shrink-0 w-full lg:w-auto">
                <div className="bg-white/10 backdrop-blur-xl rounded-[3rem] p-10 border border-white/10 shadow-2xl space-y-8">
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Prêt pour la suite ?</p>
                    <h3 className="text-3xl font-black text-white">Continuez !</h3>
                  </div>
                  <Link href={`/tef-irn/lessons/${lessonsWithStatus.find(l => l.status === 'next')?.slug || lessonsWithStatus[0].slug}?parcoursId=${parcours.id}`}>
                    <Button
                      size="lg"
                      className="h-20 px-10 rounded-[2rem] bg-indigo-600 text-white font-black text-xl hover:bg-indigo-700 shadow-2xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Démarrer la leçon <ArrowRight className="ml-3" size={24} />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="shrink-0 w-full lg:w-auto">
                <Link href="/tef-irn/login">
                  <Button
                    size="lg"
                    className="h-20 px-10 rounded-[2rem] bg-brand-blue text-white font-black text-xl hover:bg-brand-blue/90 shadow-2xl shadow-brand-blue/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Essai Gratuit
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Card className="md:col-span-2 rounded-[3rem] border-none bg-white p-10 shadow-xl shadow-slate-200/40 border border-slate-50 relative overflow-hidden">
            {user ? (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Progression</span>
                    <motion.div
                      key={progress?.percent}
                      initial={{ opacity: 0.5, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-5xl font-black text-indigo-600 tracking-tighter"
                    >
                      {progress?.percent}%
                    </motion.div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {progress?.completed} / {progress?.total}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leçons terminées</p>
                  </div>
                </div>
                <div className="h-6 w-full overflow-hidden rounded-full bg-slate-100 p-1">
                  <motion.div
                    className="h-full bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress?.percent}%` }}
                    transition={{ duration: 1.2, ease: "circOut" }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Target size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Suivez votre progression</h3>
                  <p className="text-slate-500 font-medium max-w-sm">Connectez-vous pour enregistrer votre avancée et accéder aux exercices personnalisés.</p>
                </div>
                <Link href="/tef-irn/login">
                  <Button className="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 font-bold">
                    Se connecter
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card className="rounded-[3rem] border-none bg-indigo-600 p-10 shadow-2xl shadow-indigo-200/50 flex flex-col justify-center text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3 opacity-80">
                <Target size={24} />
                <span className="text-xs font-black uppercase tracking-widest">Niveau Visé</span>
              </div>
              <div className="text-6xl font-black tracking-tighter mb-2">{parcours.level}</div>
              <p className="text-sm font-bold opacity-70 leading-tight">
                Maîtrisez les concepts essentiels du {parcours.category}
              </p>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Sparkles size={200} />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-20">
          <section className="space-y-10">
            <div className="flex items-center justify-between px-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                  Programme d'études
                </h2>
                <p className="text-slate-400 font-medium italic">Suivez l'ordre recommandé pour une progression optimale.</p>
              </div>
              <Badge variant="secondary" className="rounded-full font-black text-xs px-5 py-1.5 bg-slate-100 text-slate-600 border-none">
                {allLessons.length} LEÇONS AU TOTAL
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {lessonsWithStatus.map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson as any}
                  index={index}
                  isNext={lesson.status === 'next'}
                  category={parcours.category}
                  parcoursId={parcours.id}
                />
              ))}
            </div>
          </section>

          {user && (
            <section className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                      <Sparkles size={24} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                      Entraînement Recommandé
                    </h2>
                  </div>
                  <p className="text-slate-400 font-medium italic max-w-xl">
                    Des exercices personnalisés basés sur votre parcours et vos performances récentes.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recommendedExercises.length > 0 ? (
                  recommendedExercises.map((exercise) => (
                    <ExerciseCard key={exercise.id} exercise={exercise} parcoursId={parcours.id} />
                  ))
                ) : (
                  <div className="col-span-full bg-white rounded-[3.5rem] p-20 text-center space-y-6 shadow-xl shadow-slate-200/20 border-4 border-dashed border-slate-50">
                    <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                      <BookText size={48} className="text-slate-200" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pas encore de recommandations</h3>
                       <p className="text-lg font-medium text-slate-400 max-w-md mx-auto">
                        Terminez quelques leçons pour que notre IA puisse vous proposer des exercices adaptés !
                       </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section>
            <Card className="rounded-[4rem] border-none bg-zinc-900 p-12 md:p-24 text-white overflow-hidden relative group">
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <Badge className="bg-white/10 text-white border-white/20 rounded-full px-6 py-2 text-xs font-black uppercase tracking-widest">
                    Ressource d'Expert
                  </Badge>
                  <div className="space-y-4">
                    <h3 className="font-black text-4xl md:text-6xl leading-[0.95] tracking-tighter">
                      BESOIN <br />
                      <span className="text-indigo-500">D'AIDE ?</span>
                    </h3>
                    <p className="text-xl text-zinc-400 leading-relaxed max-w-lg font-medium">
                      Accédez à notre guide complet sur la <span className="text-white underline decoration-indigo-500 underline-offset-4 capitalize">{parcours.category} {parcours.level}</span> pour maîtriser toutes les subtilités de l'examen.
                    </p>
                  </div>
                  <Link href={initialGuideSlug ? `/tef-irn/guides/${initialGuideSlug}` : "/tef-irn/guides"} className="block w-fit">
                    <Button variant="outline" className="h-20 px-12 border-zinc-700 text-white hover:bg-white hover:text-black rounded-[2rem] font-black text-lg transition-all group shadow-2xl">
                      {initialGuideSlug ? "VOIR LE GUIDE COMPLET" : "PARCOURIR LES GUIDES"}
                      <ArrowRight className="ml-3 transition-transform group-hover:translate-x-2" size={24} />
                    </Button>
                  </Link>
                </div>
                <div className="hidden lg:flex justify-center relative">
                    <div className="w-80 h-80 rounded-[3.5rem] bg-indigo-600 flex items-center justify-center rotate-6 shadow-2xl shadow-indigo-500/40 relative z-10 group-hover:rotate-3 transition-transform duration-500">
                      <BookText size={140} className="-rotate-6 group-hover:-rotate-3 transition-transform duration-500" />
                    </div>
                </div>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </article>
  );
}
