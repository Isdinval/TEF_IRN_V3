"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getParcoursById,
  getParcoursProgress,
  getLessonsForParcours,
  getRecommendedExercises,
  Parcours as ParcoursType,
  Lesson,
  Exercise
} from "@/lib/parcours";
import { createClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Play,
  Target,
  Sparkles,
  ArrowLeft,
  BookText,
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import LessonCard from "./components/LessonCard";
import ExerciseCard from "./components/ExerciseCard";

export default function ParcoursDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [parcours, setParcours] = useState<ParcoursType | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);
  const [guideSlug, setGuideSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const parcoursData = await getParcoursById(id as string);
      if (!parcoursData) {
        setIsLoading(false);
        return;
      }

      setParcours(parcoursData);

      const [lessonsData, progressData, exercisesData] = await Promise.all([
        getLessonsForParcours(parcoursData.level, parcoursData.category),
        getParcoursProgress(user.id, parcoursData.level, parcoursData.category),
        getRecommendedExercises(user.id, parcoursData.level, parcoursData.category)
      ]);

      setAllLessons(lessonsData);
      setProgress(progressData);
      setRecommendedExercises(exercisesData);

      // Fetch associated guide
      const { data: guideData } = await supabase
        .from('guides')
        .select('slug')
        .eq('parcours_id', id)
        .eq('is_published', true)
        .single();

      if (guideData) {
        setGuideSlug(guideData.slug);
      }

      setIsLoading(false);
    }

    fetchData();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Chargement du parcours...</p>
        </div>
      </div>
    );
  }

  if (!parcours) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4">Parcours non trouvé</h1>
        <Button onClick={() => router.push("/dashboard")}>Retour au tableau de bord</Button>
      </div>
    );
  }

  const lessonsWithStatus = allLessons.map((lesson, idx) => ({
    ...lesson,
    status: idx < (progress?.completed || 0) ? 'completed' : (idx === (progress?.completed || 0) ? 'next' : 'locked')
  }));

  const getLessonUrl = (lessonId: string) => `/lessons/${lessonId}?parcoursId=${parcours.id}`;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-100 pt-24 pb-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-5 rotate-12 pointer-events-none">
            <Target size={300} />
        </div>

        <div className="max-w-6xl mx-auto px-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-sm mb-10 transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            RETOUR AU COCKPIT
          </Link>

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

            {lessonsWithStatus.find(l => l.status !== 'completed') && (
              <div className="shrink-0">
                <Link href={getLessonUrl(lessonsWithStatus.find(l => l.status !== 'locked')?.id || lessonsWithStatus[0].id)}>
                  <Button
                    size="lg"
                    className="h-20 px-10 rounded-[2rem] bg-zinc-900 text-white font-black text-xl hover:bg-indigo-600 shadow-2xl shadow-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    <Play className="mr-3 group-hover:fill-white" size={24} fill="currentColor" />
                    {progress?.completed === 0 ? "Commencer le parcours" : "Reprendre la leçon"}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-16">
        {/* Progression Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <Card className="md:col-span-2 rounded-[3rem] border-none bg-white p-10 shadow-xl shadow-slate-200/40 border border-slate-50">
            <div className="space-y-8">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Progression</span>
                  <div className="text-5xl font-black text-indigo-600 tracking-tighter">{progress?.percent}%</div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    {progress?.completed} / {progress?.total}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leçons terminées</p>
                </div>
              </div>
              <div className="h-6 w-full overflow-hidden rounded-full bg-slate-100 p-1">
                <div
                  className="h-full bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all duration-1000 ease-out"
                  style={{ width: `${progress?.percent}%` }}
                />
              </div>
            </div>
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
          {/* Lessons List */}
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

          {/* Recommended Exercises Section */}
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
                  <ExerciseCard key={exercise.id} exercise={exercise} />
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

          {/* Help/Guide Footer */}
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
                  <Link href={guideSlug ? `/guides/${guideSlug}` : "/guides"} className="block w-fit">
                    <Button variant="outline" className="h-20 px-12 border-zinc-700 text-white hover:bg-white hover:text-black rounded-[2rem] font-black text-lg transition-all group shadow-2xl">
                      {guideSlug ? "VOIR LE GUIDE COMPLET" : "PARCOURIR LES GUIDES"}
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
    </div>
  );
}
