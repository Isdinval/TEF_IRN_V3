"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParcours } from "@/contexts/ParcoursContext";
import { Lesson } from "@/types/parcours";
import {
  ArrowRight,
  BookOpen,
  Brain,
  MessageSquare,
  GraduationCap,
  Loader2,
  ChevronRight,
  Trophy,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/shared/Animations";

export default function LessonComplete({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const { activeParcours, progress: parcoursProgress, nextLesson: contextNextLesson, refreshProgress } = useParcours();

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const { data: currentLesson } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (!currentLesson) {
        setLoading(false);
        return;
      }

      setLesson(currentLesson as Lesson);

      // Update progress in context
      await refreshProgress();

      setLoading(false);
    }
    fetchData();
  }, [id, supabase, refreshProgress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!lesson) return <div className="p-8 text-center">Leçon non trouvée.</div>;

  const practiceBaseUrl = (page: string) => {
    const params = new URLSearchParams({
      lessonId: lesson.id,
      topic: lesson.category,
      level: lesson.level
    });
    if (activeParcours) {
      params.append('parcoursId', activeParcours.id);
    }
    return `/${page}?${params.toString()}`;
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto p-8 py-16 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* COLONNE GAUCHE */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-12"
          >
            <div className="space-y-6">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center rotate-12 relative z-10 shadow-xl shadow-emerald-100">
                  <Trophy size={50} />
                </div>
                <div className="absolute inset-0 bg-emerald-200 blur-3xl opacity-30 -z-10" />
              </div>

              <div className="space-y-3">
                <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  Bien joué ! 🎉
                </h1>
                <p className="text-2xl text-slate-500 font-medium leading-relaxed">
                  Vous avez terminé la leçon <span className="text-indigo-600 font-black italic block mt-1">"${lesson.title}"</span>
                </p>
              </div>
            </div>

            {parcoursProgress && (
              <Card className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/50">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Ma progression</p>
                    <h3 className="text-2xl font-black text-slate-800">Parcours {lesson.level}</h3>
                  </div>
                  <p className="text-2xl font-black text-indigo-600">
                    {parcoursProgress.completed}/{parcoursProgress.total}
                  </p>
                </div>
                <div className="h-4 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${parcoursProgress.percent}%` }}
                    className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                  />
                </div>
                <p className="mt-4 text-sm font-bold text-zinc-500 capitalize flex items-center gap-2">
                  <BookOpen size={16} className="text-indigo-400" />
                  {lesson.category}
                </p>
              </Card>
            )}

            <div>
              {contextNextLesson ? (
                <Link href={`/lessons/${contextNextLesson.id}${activeParcours ? `?parcoursId=${activeParcours.id}` : ''}`}>
                  <Button
                    size="lg"
                    className="w-full h-20 text-2xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Leçon suivante <ArrowRight className="ml-2" size={24} />
                  </Button>
                </Link>
              ) : (
                <div className="space-y-6">
                  <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 text-center">
                    <p className="text-2xl font-black text-emerald-600">🎉 Parcours terminé</p>
                    <p className="text-emerald-500 font-medium mb-6">Félicitations ! Vous avez complété toutes les leçons de ce parcours.</p>
                    <Link href="/parcours">
                      <Button size="lg" className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg">
                        Voir mes parcours
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* COLONNE DROITE: Pratiquer maintenant */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-10"
          >
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pratiquer maintenant</h2>
              <div className="h-px bg-zinc-100 flex-1" />
            </div>

            <div className="space-y-6">
              {/* Grammar Card */}
              <Link href={practiceBaseUrl('grammar-check')} className="group block">
                <Card className="relative overflow-hidden border-none shadow-2xl shadow-indigo-100/50 rounded-[2.5rem] bg-white transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <div className="flex items-stretch">
                    <div className="w-4 bg-indigo-600" />
                    <div className="flex-1 p-8 flex items-center gap-8">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <MessageSquare size={32} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-2xl text-slate-800 leading-tight">Corriger un texte</h4>
                        <p className="text-slate-400 font-bold">Orthographe & Grammaire</p>
                      </div>
                      <div className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em] flex flex-col items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>C'est parti</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* QCM Card */}
              <Link href={practiceBaseUrl('practice')} className="group block">
                <Card className="relative overflow-hidden border-none shadow-2xl shadow-violet-100/50 rounded-[2.5rem] bg-white transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <div className="flex items-stretch">
                    <div className="w-4 bg-violet-600" />
                    <div className="flex-1 p-8 flex items-center gap-8">
                      <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                        <GraduationCap size={32} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-2xl text-slate-800 leading-tight">QCM</h4>
                        <p className="text-slate-400 font-bold">Entraînement rapide</p>
                      </div>
                      <div className="text-violet-600 font-black text-xs uppercase tracking-[0.2em] flex flex-col items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>C'est parti</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Vocab Card */}
              <Link href={practiceBaseUrl('vocab')} className="group block">
                <Card className="relative overflow-hidden border-none shadow-2xl shadow-sky-100/50 rounded-[2.5rem] bg-white transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <div className="flex items-stretch">
                    <div className="w-4 bg-sky-600" />
                    <div className="flex-1 p-8 flex items-center gap-8">
                      <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                        <Brain size={32} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-2xl text-slate-800 leading-tight">Vocabulaire</h4>
                        <p className="text-slate-400 font-bold">Flashcards interactives</p>
                      </div>
                      <div className="text-sky-600 font-black text-xs uppercase tracking-[0.2em] flex flex-col items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>C'est parti</span>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            {activeParcours && (
              <div className="mt-8">
                <Link href={`/parcours/${activeParcours.id}`}>
                  <Button variant="outline" className="w-full h-14 rounded-xl font-bold text-zinc-500 hover:text-indigo-600">
                    <ArrowLeft size={18} className="mr-2" />
                    Reprendre mon parcours
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
