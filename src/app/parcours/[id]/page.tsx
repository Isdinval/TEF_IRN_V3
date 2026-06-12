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

  const parcours = await getParcoursById(id, supabase);
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

  const progress = await getParcoursProgress(user.id, parcours.level, parcours.category, supabase);
  const allLessons = await getLessonsForParcours(parcours.level, parcours.category, supabase);

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
  const recommendedExercises = await getRecommendedExercises(user.id, parcours.level, parcours.category, supabase);

  const getLessonUrl = (lessonId: string) => {
    return `/lessons/${lessonId}?parcoursId=${parcours.id}`;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] pb-24">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-6 py-10 md:py-16">
            <Link href="/parcours" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 mb-8 transition-colors">
              <ArrowLeft size={14} /> Retour aux parcours
            </Link>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge className="bg-indigo-600 rounded-full px-5 py-1.5 text-[11px] font-black uppercase tracking-widest border-none shadow-lg shadow-indigo-100">
                    {parcours.level}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-5 py-1.5 text-[11px] font-black uppercase tracking-widest border-slate-200 text-slate-500 capitalize bg-white">
                    {parcours.category}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter capitalize leading-[0.9]">
                    {parcours.category} <br />
                    <span className="text-indigo-600">{parcours.level}</span>
                  </h1>
                </div>
                <p className="text-xl font-medium text-slate-500 max-w-2xl leading-relaxed italic">
                  "{parcours.objective}"
                </p>
              </div>

              {firstUncompletedLesson && (
                <div className="shrink-0">
                  <Link href={getLessonUrl(firstUncompletedLesson.id)}>
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
            {/* Lessons List - Full Width */}
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
                    isNext={firstUncompletedLesson?.id === lesson.id}
                    category={parcours.category}
                    parcoursId={parcours.id}
                  />
                ))}
              </div>
            </section>

            {/* Recommended Exercises Section - Now Full Width Below Lessons */}
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
              <Card className="rounded-[4rem] border-none bg-zinc-900 p-12 md:p-24 text-white overflow-hidden relative">
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
                    <Link href="/guides" className="block w-fit">
                      <Button variant="outline" className="h-20 px-12 border-zinc-700 text-white hover:bg-white hover:text-black rounded-[2rem] font-black text-lg transition-all group shadow-2xl">
                        VOIR LE GUIDE COMPLET
                        <ArrowLeft className="ml-3 rotate-180 transition-transform group-hover:translate-x-2" size={24} />
                      </Button>
                    </Link>
                  </div>
                  <div className="hidden lg:flex justify-center relative">
                     <div className="w-80 h-80 rounded-[3.5rem] bg-indigo-600 flex items-center justify-center rotate-6 shadow-2xl shadow-indigo-500/40 relative z-10 group-hover:rotate-3 transition-transform duration-500">
                        <BookText size={140} className="-rotate-6 group-hover:-rotate-3 transition-transform duration-500" />
                     </div>
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
                  </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full -mr-[250px] -mt-[250px] blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full -ml-[250px] -mb-[250px] blur-[120px]" />
              </Card>
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
