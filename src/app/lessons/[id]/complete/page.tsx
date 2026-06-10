"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Brain,
  MessageSquare,
  GraduationCap,
  Loader2,
  ChevronRight,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface PathLesson {
  id: string;
  title: string;
  order_index: number | null;
  created_at: string;
}

export default function LessonComplete({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<any>(null);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      // 1. Fetch current lesson
      const { data: currentLesson } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (!currentLesson) return;
      setLesson(currentLesson);

      // 2. Fetch all lessons in the same level/category path
      const { data: pathLessonsData } = await supabase
        .from('lessons')
        .select('id, title, order_index, created_at')
        .eq('level', currentLesson.level)
        .eq('category', currentLesson.category)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });

      const pathLessons = (pathLessonsData as PathLesson[]) || [];

      if (pathLessons.length > 0) {
        // 3. Fetch user's completed lessons in this path
        const lessonIds = pathLessons.map((l: PathLesson) => l.id);
        const { data: completedData } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);

        const completedIds = new Set((completedData || []).map((c: any) => c.lesson_id));

        setProgress({
          completed: completedIds.size,
          total: pathLessons.length
        });

        // 4. Find the next lesson
        const currentIndex = pathLessons.findIndex((l: PathLesson) => l.id === id);
        if (currentIndex !== -1 && currentIndex < pathLessons.length - 1) {
          setNextLesson(pathLessons[currentIndex + 1]);
        }
      }

      setLoading(false);
    }
    fetchData();
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!lesson) return <div>Leçon non trouvée.</div>;

  const practiceBaseUrl = (page: string) => `/${page}?lessonId=${lesson.id}&topic=${lesson.category}&level=${lesson.level}`;

  return (
    <div className="max-w-6xl mx-auto p-8 py-16 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

        {/* COLONNE GAUCHE: Bien joué ! */}
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
                Vous avez terminé la leçon <span className="text-indigo-600 font-black italic block mt-1">"{lesson.title}"</span>
              </p>
            </div>
          </div>

          {/* Progress Card */}
          <Card className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/50">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Ma progression</p>
                <h3 className="text-2xl font-black text-slate-800">Parcours {lesson.level}</h3>
              </div>
              <p className="text-2xl font-black text-indigo-600">
                {progress.completed}/{progress.total}
              </p>
            </div>
            <div className="h-4 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
              />
            </div>
            <p className="mt-4 text-sm font-bold text-zinc-500 capitalize flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-400" />
              {lesson.category}
            </p>
          </Card>

          {/* Next Lesson Button */}
          <div>
            {nextLesson ? (
              <Link href={`/lessons/${nextLesson.id}`}>
                <Button
                  size="lg"
                  className="w-full h-20 text-2xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Leçon suivante <ArrowRight className="ml-2" size={24} />
                </Button>
              </Link>
            ) : (
              <div className="space-y-6">
                <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 text-center">
                  <p className="text-2xl font-black text-amber-600">Parcours terminé 🎉</p>
                  <p className="text-amber-500 font-medium">Vous avez fini toutes les leçons de ce module !</p>
                </div>
                <Link href="/lessons">
                  <Button variant="outline" size="lg" className="w-full h-16 rounded-2xl border-2 font-black text-lg">
                    Retour au catalogue
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* COLONNE DROITE: Pratiquer maintenant */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pratiquer maintenant</h2>
            <div className="h-px bg-zinc-100 flex-1" />
          </div>

          <div className="space-y-6">
            {/* Grammar Card */}
            <Link href={practiceBaseUrl('grammar-check')} className="group block">
              <Card className="border-2 border-zinc-50 hover:border-indigo-100 shadow-lg shadow-zinc-100 hover:shadow-indigo-50 transition-all rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center">
                    <div className="w-32 h-32 bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <MessageSquare size={40} />
                    </div>
                    <div className="p-8 flex-1">
                      <h4 className="font-black text-2xl text-slate-800 mb-1">Corriger un texte</h4>
                      <p className="text-base text-zinc-500 font-bold mb-4">Orthographe & Grammaire</p>
                      <div className="text-indigo-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                        C'est parti <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* QCM Card */}
            <Link href={practiceBaseUrl('practice')} className="group block">
              <Card className="border-2 border-zinc-50 hover:border-violet-100 shadow-lg shadow-zinc-100 hover:shadow-violet-50 transition-all rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center">
                    <div className="w-32 h-32 bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                      <GraduationCap size={40} />
                    </div>
                    <div className="p-8 flex-1">
                      <h4 className="font-black text-2xl text-slate-800 mb-1">QCM</h4>
                      <p className="text-base text-zinc-500 font-bold mb-4">Entraînement rapide</p>
                      <div className="text-violet-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                        C'est parti <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Vocab Card */}
            <Link href={practiceBaseUrl('vocab')} className="group block">
              <Card className="border-2 border-zinc-50 hover:border-sky-100 shadow-lg shadow-zinc-100 hover:shadow-sky-50 transition-all rounded-[2.5rem] bg-white overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center">
                    <div className="w-32 h-32 bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
                      <Brain size={40} />
                    </div>
                    <div className="p-8 flex-1">
                      <h4 className="font-black text-2xl text-slate-800 mb-1">Vocabulaire</h4>
                      <p className="text-base text-zinc-500 font-bold mb-4">Flashcards interactives</p>
                      <div className="text-sky-600 font-black text-sm uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                        C'est parti <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
