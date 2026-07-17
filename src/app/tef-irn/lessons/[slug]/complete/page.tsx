"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getParcours, getLessonBySlug, getLessonById, Exercise } from "@/lib/parcours";
import { resolveNextExercises } from "@/lib/recommendation-resolver";
import ExerciseCard from "@/app/tef-irn/parcours/[slug]/components/ExerciseCard";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookText,
  Loader2,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface PathLesson {
  id: string;
  slug: string;
  title: string;
  order_index: number | null;
  created_at: string;
  level: string;
  category: string;
}

export default function LessonComplete({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [parcoursId, setParcoursId] = useState<string | null>(null);
  const [lesson, setLesson] = useState<PathLesson | null>(null);
  const [nextLesson, setNextLesson] = useState<PathLesson | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      let currentLesson = await getLessonBySlug(slug, supabase);

      // Backward compatibility
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!currentLesson && uuidRegex.test(slug)) {
        currentLesson = await getLessonById(slug, supabase);
        if (currentLesson) {
          router.replace(`/tef-irn/lessons/${currentLesson.slug}/complete`);
          return;
        }
      }

      if (!user) {
        if (currentLesson) {
          router.replace(`/tef-irn/lessons/${currentLesson.slug}`);
        } else {
          router.replace('/tef-irn/lessons');
        }
        return;
      }

      if (!currentLesson) {
        setLoading(false);
        return;
      }

      setLesson(currentLesson as unknown as PathLesson);

      // Fetch all lessons for the same path
      const { data: pathLessonsData } = await supabase
        .from('lessons')
        .select('id, slug, title, order_index, created_at, level, category')
        .eq('level', currentLesson.level)
        .eq('category', currentLesson.category)
        .order('order_index', { ascending: true });

      const pathLessons = (pathLessonsData as PathLesson[]) || [];

      if (pathLessons.length > 0) {
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

        const currentIndex = pathLessons.findIndex((l: PathLesson) => l.id === currentLesson?.id);
        if (currentIndex !== -1 && currentIndex < pathLessons.length - 1) {
          setNextLesson(pathLessons[currentIndex + 1]);
        }
      }

      // Find current parcours ID
      const allParcours = await getParcours(supabase);
      const currentParcours = allParcours.find(p => p.level === currentLesson?.level && p.category === currentLesson?.category);
      if (currentParcours) setParcoursId(currentParcours.id);

      // Moteur de recommandation unifié : contexte = leçon qu'on vient de terminer
      const nextExercises = await resolveNextExercises(
        user.id,
        { level: currentLesson.level, category: currentLesson.category, lessonId: currentLesson.id },
        supabase
      );
      setRecommendedExercises(nextExercises);

      setLoading(false);
    }
    fetchData();
  }, [slug, supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!lesson) return <div className="p-8 text-center">Leçon non trouvée.</div>;

  const [heroExercise, ...restExercises] = recommendedExercises;

  return (
    <div className="max-w-5xl mx-auto p-8 py-16 min-h-screen space-y-16">

      {/* BANDEAU : Bien joué */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center gap-10 bg-white rounded-[3rem] p-8 md:p-10 shadow-xl shadow-zinc-200/50 border border-zinc-100"
      >
        <div className="relative shrink-0 mx-auto md:mx-0">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center rotate-6 relative z-10 shadow-xl shadow-emerald-100">
            <Trophy size={40} />
          </div>
          <div className="absolute inset-0 bg-emerald-200 blur-2xl opacity-30 -z-10" />
        </div>

        <div className="flex-1 space-y-1 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Bien joué ! 🎉
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Vous avez terminé la leçon <span className="text-indigo-600 font-black italic">"{lesson.title}"</span>
          </p>
        </div>

        <div className="w-full md:w-64 shrink-0 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Parcours {lesson.level}</span>
            <span className="text-lg font-black text-indigo-600">{progress.completed}/{progress.total}</span>
          </div>
          <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
              className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
            />
          </div>
        </div>
      </motion.div>

      {/* Leçon suivante / fin de parcours */}
      {nextLesson ? (
        <Link href={`/tef-irn/lessons/${nextLesson.slug}`}>
          <Button
            size="lg"
            className="w-full h-16 text-xl font-black rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            Leçon suivante <ArrowRight className="ml-2" size={22} />
          </Button>
        </Link>
      ) : (
        <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 text-center">
          <p className="text-2xl font-black text-emerald-600">🎉 Parcours terminé</p>
          <p className="text-emerald-500 font-medium mb-6">Félicitations ! Vous avez complété toutes les leçons de ce parcours.</p>
          <Link href="/tef-irn/parcours">
            <Button size="lg" className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg">
              Voir mon parcours
            </Button>
          </Link>
        </div>
      )}

      {/* PRATIQUER MAINTENANT : pleine largeur */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-8"
      >
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pratiquer maintenant</h2>
          <div className="h-px bg-zinc-100 flex-1" />
        </div>

        {heroExercise ? (
          <div className="space-y-6">
            <ExerciseCard exercise={heroExercise} parcoursId={parcoursId ?? undefined} variant="hero" />

            {restExercises.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {restExercises.map((exercise) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} parcoursId={parcoursId ?? undefined} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-12 text-center space-y-4 shadow-xl shadow-slate-200/20 border-4 border-dashed border-slate-50">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto">
              <BookText size={32} className="text-slate-200" />
            </div>
            <p className="text-lg font-bold text-slate-400">Pas encore d'exercice recommandé pour cette leçon.</p>
          </div>
        )}
      </motion.section>
    </div>
  );
}
