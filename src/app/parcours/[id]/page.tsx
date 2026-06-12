import { createClient } from "@/lib/supabase-server";
import { getParcoursById, getParcoursProgress, getLessonsForParcours, getRecommendedExercises } from "@/lib/parcours";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, ArrowLeft, Play, Sparkles, BookText } from "lucide-react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/Animations";
import LessonCard from "./components/LessonCard";
import ExerciseCard from "./components/ExerciseCard";
import { redirect } from "next/navigation";

export default async function ParcoursDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const parcours = await getParcoursById(id);
  if (!parcours) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-black">Parcours non trouvé</h1>
        <Link href="/parcours">
          <Button>Retour aux parcours</Button>
        </Link>
      </div>
    );
  }

  const progress = await getParcoursProgress(user.id, parcours.level, parcours.category);
  const allLessons = await getLessonsForParcours(parcours.level, parcours.category);

  // Fetch completed lessons
  const { data: completedData } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', user.id)
    .in('lesson_id', allLessons.map(l => l.id));

  const completedIds = new Set(completedData?.map(c => c.lesson_id) || []);

  const lessonsWithStatus = allLessons.map(l => ({
    ...l,
    isCompleted: completedIds.has(l.id)
  }));

  const firstUncompletedLesson = lessonsWithStatus.find(l => !l.isCompleted);
  const recommendedExercises = await getRecommendedExercises(user.id, parcours.level, parcours.category);

  const getLessonUrl = (lessonId: string) => {
    return `/lessons/${lessonId}?parcoursId=${parcours.id}`;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] pb-24">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <Link href="/parcours" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 mb-8 transition-colors">
              <ArrowLeft size={14} /> Retour aux parcours
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none">
                    {parcours.level}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-500 capitalize">
                    {parcours.category}
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight capitalize">
                  {parcours.category} {parcours.level}
                </h1>
                <p className="text-lg font-medium text-slate-500 max-w-2xl leading-relaxed italic">
                  "{parcours.objective}"
                </p>
              </div>

              {firstUncompletedLesson && (
                <Link href={getLessonUrl(firstUncompletedLesson.id)}>
                  <Button
                    size="lg"
                    className="h-16 px-8 rounded-2xl bg-zinc-900 text-white font-black text-lg hover:bg-indigo-600 shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Play className="mr-2" size={20} fill="currentColor" />
                    {progress?.completed === 0 ? "Commencer le parcours" : "Reprendre la leçon"}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 mt-12">
          {/* Progression Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="md:col-span-2 rounded-[2.5rem] border-none bg-white p-8 shadow-xl shadow-slate-200/40">
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progression globale</span>
                    <div className="text-3xl font-black text-indigo-600">{progress?.percent}%</div>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    {progress?.completed} / {progress?.total} leçons
                  </p>
                </div>
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all duration-1000"
                    style={{ width: `${progress?.percent}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none bg-indigo-600 p-8 shadow-xl shadow-indigo-200/40 flex flex-col justify-center text-white">
              <div className="flex items-center gap-3 mb-2 opacity-80">
                <Target size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Niveau visé</span>
              </div>
              <div className="text-4xl font-black">{parcours.level}</div>
              <p className="text-xs font-bold mt-2 opacity-70">
                Maîtrisez les bases du {parcours.category}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Lessons List */}
            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                  Programme
                </h2>
                <Badge variant="secondary" className="rounded-full font-black text-[10px] px-3">
                  {allLessons.length} LEÇONS
                </Badge>
              </div>

              <div className="space-y-4">
                {lessonsWithStatus.map((lesson, index) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    index={index}
                    isNext={firstUncompletedLesson?.id === lesson.id}
                    category={parcours.category}
                    parcoursId={parcours.id}
                  />
                ))}
              </div>
            </div>

            {/* Recommendations / Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <div className="flex items-center gap-2 px-2">
                <Sparkles size={20} className="text-indigo-600" />
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Entraînement
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {recommendedExercises.length > 0 ? (
                  recommendedExercises.map((exercise) => (
                    <ExerciseCard key={exercise.id} exercise={exercise} />
                  ))
                ) : (
                  <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border-2 border-dashed border-slate-100">
                    <p className="text-sm font-medium text-slate-400">
                      Terminez des leçons pour débloquer des exercices recommandés !
                    </p>
                  </div>
                )}
              </div>

              <Card className="rounded-[2rem] border-none bg-zinc-900 p-6 text-white overflow-hidden relative">
                <div className="relative z-10 space-y-4">
                  <h3 className="font-black text-lg leading-tight">Besoin d'aide ?</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Accédez à notre guide complet sur la {parcours.category} {parcours.level} pour approfondir vos connaissances.
                  </p>
                  <Button variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800 rounded-xl font-black text-xs">
                    VOIR LE GUIDE
                  </Button>
                </div>
                <div className="absolute -bottom-8 -right-8 opacity-10">
                  <BookText size={120} />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
