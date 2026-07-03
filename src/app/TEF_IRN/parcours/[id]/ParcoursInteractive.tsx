"use client";

import React, { useState } from "react";
import {
  Parcours as ParcoursType,
  Lesson,
  Exercise
} from "@/lib/parcours";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Play,
  Target,
  Sparkles,
  BookText,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LessonCard from "./components/LessonCard";
import ExerciseCard from "./components/ExerciseCard";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { getParcoursProgress, getRecommendedExercises } from "@/lib/parcours";

export default function ParcoursInteractive({
  parcours,
  allLessons,
  initialProgress,
  initialRecommendedExercises,
  initialGuideSlug,
  user
}: {
  parcours: ParcoursType;
  allLessons: Lesson[];
  initialProgress: any;
  initialRecommendedExercises: Exercise[];
  initialGuideSlug: string | null;
  user: User | null;
}) {
  const [progress, setProgress] = useState(initialProgress);
  const [recommendedExercises, setRecommendedExercises] = useState(initialRecommendedExercises);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  const supabase = createClient();

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const [progressData, exercisesData] = await Promise.all([
        getParcoursProgress(user.id, parcours.level, parcours.category, parcours.id, supabase),
        getRecommendedExercises(user.id, parcours.level, parcours.category, supabase)
      ]);
      setProgress(progressData);
      setRecommendedExercises(exercisesData);
      setShowUpdateToast(true);
      setTimeout(() => setShowUpdateToast(false), 4000);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getLessonStatus = (lessonId: string, index: number) : 'completed' | 'next' | 'locked' | 'open' => {
    if (!user || !progress) return 'open';
    const isCompleted = progress.completedLessons?.includes(lessonId) || false;
    if (isCompleted) return 'completed';
    const isNext = (index === 0 && progress.completed === 0) ||
                   (index > 0 && progress.completedLessons?.includes(allLessons[index-1].id));
    return isNext ? 'next' : 'locked';
  };

  const lessonsWithStatus = allLessons.map((lesson, index) => ({
    ...lesson,
    status: getLessonStatus(lesson.id, index)
  }));

  const getLessonUrl = (lessonId: string) => `/TEF_IRN/lessons/${lessonId}?parcoursId=${parcours.id}`;

  return (
    <article className="min-h-screen bg-slate-50/50 pb-20">
      {/* Informations GEO pour IA */}
      <div className="sr-only">
        <section>
          <h2>Résumé du parcours</h2>
          <p>{parcours.objective}</p>
          <h3>Compétences visées</h3>
          <ul>
            <li>Maîtrise du {parcours.category} niveau {parcours.level}</li>
            <li>Préparation spécifique aux épreuves du TEF IRN</li>
            <li>Validation des acquis par des exercices pratiques</li>
          </ul>
          <h3>Informations pratiques</h3>
          <p>Durée estimée : {allLessons.length * 30} minutes (environ 30 min par leçon)</p>
          <p>Niveau requis : {parcours.level === 'B1' ? 'A2' : 'A1'}</p>
        </section>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showUpdateToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-zinc-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-wider">Progression mise à jour</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border-b border-slate-100 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="space-y-6">
              <div className="space-y-2">
                <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 border-none font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest">
                  Parcours de formation
                </Badge>
                <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-slate-900 capitalize leading-[0.9]">
                  {parcours.category} <span className="text-indigo-600">{parcours.level}</span>
                </h1>
              </div>
              <p className="text-xl font-medium text-slate-500 max-w-2xl leading-relaxed italic">
                "{parcours.objective}"
              </p>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-20 w-20 rounded-[2rem] border-slate-200 hover:bg-slate-50"
                >
                  <RefreshCw className={`text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} size={24} />
                </Button>

                {lessonsWithStatus.find(l => l.status !== 'completed') && (
                  <div className="shrink-0">
                    <Link href={getLessonUrl(lessonsWithStatus.find(l => l.status !== 'locked')?.id || lessonsWithStatus[0].id)}>
                      <Button
                        size="lg"
                        className="h-20 px-10 rounded-[2rem] bg-zinc-900 text-white font-black text-xl hover:bg-indigo-600 shadow-2xl shadow-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                      >
                        <Play className="mr-3 group-hover:fill-white" size={24} fill="currentColor" />
                        {progress?.completed === 0 ? "Commencer" : "Reprendre"}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="shrink-0">
                <Link href="/TEF_IRN/login">
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
                <Link href="/TEF_IRN/login">
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
                  lesson={lesson}
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
                  <Link href={initialGuideSlug ? `/TEF_IRN/guides/${initialGuideSlug}` : "/TEF_IRN/guides"} className="block w-fit">
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
