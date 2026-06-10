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
  CheckCircle2,
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

  return (
    <div className="max-w-4xl mx-auto p-8 py-16 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-12"
      >
        {/* Celebration Header */}
        <div className="space-y-6">
          <div className="relative inline-block">
            <div className="w-40 h-40 bg-emerald-100 text-emerald-600 rounded-[3rem] flex items-center justify-center mx-auto rotate-12 relative z-10 shadow-2xl shadow-emerald-100">
              <Trophy size={70} />
            </div>
            <div className="absolute inset-0 bg-emerald-200 blur-3xl opacity-30 -z-10" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4 text-emerald-400/30"
            >
              <Sparkles size={180} />
            </motion.div>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">
              Bien joué ! 🎉
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
              Vous avez terminé la leçon <span className="text-indigo-600 font-black">"{lesson.title}"</span>
            </p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/50 max-w-md mx-auto">
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
              className="h-full bg-indigo-600"
            />
          </div>
          <p className="mt-4 text-sm font-bold text-zinc-500 capitalize">
            {lesson.category}
          </p>
        </div>

        {/* Primary Action: Next Lesson */}
        <div className="max-w-md mx-auto">
          {nextLesson ? (
            <Link href={`/lessons/${nextLesson.id}`}>
              <Button
                size="lg"
                className="w-full h-20 text-2xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
              >
                Leçon suivante <ArrowRight className="ml-2" size={24} />
              </Button>
            </Link>
          ) : (
            <div className="space-y-6">
              <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
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

        {/* Contextual Exercises */}
        <div className="space-y-8 pt-8">
          <div className="flex items-center gap-4 justify-center">
            <div className="h-px bg-zinc-200 w-12" />
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em]">Pratiquer maintenant</h2>
            <div className="h-px bg-zinc-200 w-12" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href={`/grammar-check?lessonId=${lesson.id}&topic=${lesson.category}`} className="group">
              <Card className="border-none shadow-lg shadow-zinc-100 hover:shadow-indigo-100 transition-all rounded-[2rem] h-full bg-white group-hover:-translate-y-1">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">Corriger un texte</h4>
                    <p className="text-xs text-zinc-500 font-medium">Orthographe & Grammaire</p>
                  </div>
                  <div className="text-indigo-600 text-xs font-black flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    C'est parti <ChevronRight size={14} />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/practice?lessonId=${lesson.id}&topic=${lesson.category}`} className="group">
              <Card className="border-none shadow-lg shadow-zinc-100 hover:shadow-violet-100 transition-all rounded-[2rem] h-full bg-white group-hover:-translate-y-1">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">QCM</h4>
                    <p className="text-xs text-zinc-500 font-medium">Entraînement rapide</p>
                  </div>
                  <div className="text-violet-600 text-xs font-black flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    C'est parti <ChevronRight size={14} />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/vocab?lessonId=${lesson.id}&topic=${lesson.category}`} className="group">
              <Card className="border-none shadow-lg shadow-zinc-100 hover:shadow-sky-100 transition-all rounded-[2rem] h-full bg-white group-hover:-translate-y-1">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-sky-600 group-hover:text-white transition-colors">
                    <Brain size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">Vocabulaire</h4>
                    <p className="text-xs text-zinc-500 font-medium">Flashcards interactives</p>
                  </div>
                  <div className="text-sky-600 text-xs font-black flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    C'est parti <ChevronRight size={14} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
