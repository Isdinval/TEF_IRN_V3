"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getParcoursById, getParcoursProgress, getLessonsForParcours } from "@/lib/parcours";
import { Parcours, ParcoursProgress, Lesson } from "@/types/parcours";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Target, CheckCircle2, Lock, ArrowLeft, Play, ArrowRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { PageTransition } from "@/components/shared/Animations";
import { useParcours } from "@/contexts/ParcoursContext";
import { BreadcrumbParcours } from "@/components/parcours/BreadcrumbParcours";

export default function ParcoursDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [parcours, setParcours] = useState<Parcours | null>(null);
  const [progress, setProgress] = useState<ParcoursProgress | null>(null);
  const [lessons, setLessons] = useState<(Lesson & { isCompleted: boolean })[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { setActiveParcoursById, activeParcours } = useParcours();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const p = await getParcoursById(id);
      if (!p) {
        setLoadingLocal(false);
        return;
      }

      if (!activeParcours || activeParcours.id !== id) {
        await setActiveParcoursById(id);
      }

      const prog = await getParcoursProgress(user.id, p.level, p.category);
      const allLessons = await getLessonsForParcours(p.level, p.category);

      const { data: completedData } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .in('lesson_id', allLessons.map((l: Lesson) => l.id));

      const completedIds = new Set(completedData?.map((c: { lesson_id: string }) => c.lesson_id) || []);

      const lessonsWithStatus = allLessons.map((l: Lesson) => ({
        ...l,
        isCompleted: completedIds.has(l.id)
      }));

      setParcours(p);
      setProgress(prog);
      setLessons(lessonsWithStatus);
      setLoadingLocal(false);
    }
    loadData();
  }, [id, supabase, router, setActiveParcoursById, activeParcours]);

  if (loadingLocal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  if (!parcours) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-black">Parcours non trouvé</h1>
        <Button onClick={() => router.push("/parcours")}>Retour aux parcours</Button>
      </div>
    );
  }

  const firstUncompletedLesson = lessons.find(l => !l.isCompleted);

  return (
    <PageTransition>
      <div className="min-h-screen bg-zinc-50/50 p-6 pt-16 lg:p-16">
        <div className="max-w-4xl mx-auto">
          <BreadcrumbParcours />

          <header className="mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest border-none">
                    {parcours.level}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest border-zinc-200 capitalize">
                    {parcours.category}
                  </Badge>
                </div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter capitalize">
                  {parcours.category} {parcours.level}
                </h1>
              </div>

              {firstUncompletedLesson && (
                <Button
                  onClick={() => router.push(`/lessons/${firstUncompletedLesson.id}?parcoursId=${id}`)}
                  size="lg"
                  className="h-16 px-8 rounded-2xl bg-zinc-900 text-white font-black text-lg hover:bg-black shadow-xl shadow-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="mr-2" size={20} fill="currentColor" />
                  {progress?.completed === 0 ? "Commencer le parcours" : "Reprendre la leçon"}
                </Button>
              )}
            </div>

            <Card className="rounded-[2.5rem] border-none bg-white p-8 shadow-xl shadow-zinc-200/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Target size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Objectif du parcours</span>
                  </div>
                  <p className="text-lg font-medium text-slate-600 leading-relaxed italic">
                    "{parcours.objective}"
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Progression globale</span>
                    <span className="text-3xl font-black text-indigo-600">{progress?.percent}%</span>
                  </div>
                  <div className="h-4 w-full overflow-hidden rounded-full bg-zinc-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress?.percent}%` }}
                      className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                    />
                  </div>
                  <p className="text-xs font-bold text-zinc-400 text-right">
                    {progress?.completed} sur {progress?.total} leçons complétées
                  </p>
                </div>
              </div>
            </Card>
          </header>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 px-1 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" />
              Programme du parcours
            </h2>

            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <Link key={lesson.id} href={`/lessons/${lesson.id}?parcoursId=${id}`}>
                  <Card className={`group border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden mb-4 ${lesson.isCompleted ? 'bg-emerald-50/30' : 'bg-white'}`}>
                    <CardContent className="p-6 flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-black text-lg
                        ${lesson.isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <h3 className={`font-black text-lg ${lesson.isCompleted ? 'text-slate-600' : 'text-slate-900'}`}>
                          {lesson.title}
                        </h3>
                      </div>

                      <div className="shrink-0">
                        {lesson.isCompleted ? (
                          <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                            <CheckCircle2 size={20} />
                            <span className="hidden sm:inline">Complété</span>
                          </div>
                        ) : (
                          <div className="text-zinc-300 group-hover:text-indigo-600 transition-colors">
                            <ArrowRight size={20} />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
