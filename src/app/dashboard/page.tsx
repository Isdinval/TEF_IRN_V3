"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import { PageTransition } from "@/components/shared/Animations";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { DashboardHeader } from "@/components/features/dashboard/new/DashboardHeader";
import { StatsOverview } from "@/components/features/dashboard/new/StatsOverview";
import { PerformanceRadar } from "@/components/features/dashboard/new/PerformanceRadar";
import { ScoreProjection } from "@/components/features/dashboard/new/ScoreProjection";
import { QuickAccess } from "@/components/features/dashboard/new/QuickAccess";
import { ParcoursCard } from "@/components/features/dashboard/new/ParcoursCard";
import { RecommendationCard } from "@/components/features/dashboard/new/RecommendationCard";
import { RecentCorrectionsList } from "@/components/features/dashboard/new/RecentCorrectionsList";
import { XPChart } from "@/components/features/dashboard/new/XPChart";
import { SubSkillHeatmap } from "@/components/features/dashboard/new/SubSkillHeatmap";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: dashboardData, error } = await supabase.rpc("get_dashboard_data");

      if (error) throw error;
      return dashboardData;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50/30">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-indigo-500/20" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Préparation du cockpit...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center bg-slate-50/30">
        <div className="mb-6 h-20 w-20 rounded-[2rem] bg-red-50 flex items-center justify-center text-red-500">
          <Sparkles size={40} />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Oups ! Connexion interrompue</h2>
        <p className="text-zinc-500 mb-8 italic max-w-xs">Nous n'avons pas pu charger vos données. Vérifiez votre connexion.</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-2xl bg-zinc-900 px-8 py-4 font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-zinc-200 transition-all hover:scale-105 active:scale-95"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const {
    profile,
    xp_today,
    study_time_today,
    recent_corrections,
    reviews_count,
    competency_radar,
    sub_competencies,
    vocab_stats,
    in_progress_parcours,
    recommendations
  } = data;

  // Projection simple
  const avgScore = competency_radar.length > 0
    ? Math.round(competency_radar.reduce((acc: number, curr: any) => acc + curr.A, 0) / competency_radar.length)
    : 0;
  const estimatedScore = avgScore > 0 ? Math.min(Math.round(avgScore * 6.9), 699) : 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50/30 pb-20">
        <div className="mx-auto max-w-7xl p-4 md:p-10 lg:p-12">

          <DashboardHeader
            fullName={profile.full_name}
            streak={profile.streak_count}
            xpToday={xp_today}
            xpGoal={50}
            level={profile.current_level || 'A1'}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

            {/* Colonne Gauche */}
            <div className="space-y-12 lg:col-span-8">

              <section className="space-y-6">
                 <div className="flex items-center justify-between px-1">
                    <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-zinc-900">
                      <TrendingUp size={20} className="text-indigo-600" />
                      Aujourd'hui
                    </h2>
                 </div>
                 <StatsOverview
                   studyTime={study_time_today}
                   completedExercises={recent_corrections.length}
                   avgScore={avgScore}
                   pendingCorrections={0}
                 />
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-zinc-900">
                    <Badge className="rounded-full bg-indigo-600 px-3 py-1 border-none text-[10px]">IA Coach</Badge>
                    <span className="text-zinc-300">•</span>
                    Recommandations personnalisées
                  </h2>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {recommendations.length > 0 ? recommendations.map((reco: any) => (
                    <RecommendationCard
                      key={reco.id}
                      type={reco.type}
                      reason={reco.reason}
                      referenceId={reco.reference_id}
                    />
                  )) : (
                    <div className="col-span-2 rounded-[2.5rem] border-2 border-dashed border-zinc-200 bg-white/50 p-12 text-center">
                       <Sparkles size={32} className="mx-auto text-zinc-200 mb-4" />
                       <p className="text-sm font-bold text-zinc-400 italic">Continuez à pratiquer pour recevoir des conseils de l'IA !</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-6">
                 <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Accès Rapide</h2>
                 </div>
                 <QuickAccess />
              </section>

              <section className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-zinc-900">
                    <Badge className="rounded-full bg-violet-600 px-3 py-1 border-none text-[10px]">Feedbacks</Badge>
                    <span className="text-zinc-300">•</span>
                    Dernières corrections
                  </h2>
                  <Link href="/correction" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">
                    Historique complet
                  </Link>
                </div>
                <RecentCorrectionsList corrections={recent_corrections} />
              </section>
            </div>

            {/* Colonne Droite (Sidebar Dashboard) */}
            <aside className="space-y-8 lg:col-span-4">

              <ScoreProjection
                currentLevel={profile.current_level || 'A1'}
                goalLevel={profile.goal_level || 'B2'}
                estimatedScore={estimatedScore}
              />

              <PerformanceRadar data={competency_radar} />

              <XPChart />

              <SubSkillHeatmap data={sub_competencies} />

              <section className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Parcours en cours</h2>
                  <span className="h-5 rounded-full bg-zinc-900 px-2 flex items-center text-[10px] font-black text-white">
                    {in_progress_parcours.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {in_progress_parcours.map((p: any) => (
                    <ParcoursCard
                      key={p.id}
                      id={p.id}
                      level={p.level}
                      category={p.category}
                      progress={p.progress}
                    />
                  ))}
                  {in_progress_parcours.length === 0 && (
                    <div className="rounded-[2.5rem] border-2 border-dashed border-zinc-100 bg-white p-12 text-center transition-colors hover:border-indigo-100 group">
                       <p className="text-xs font-bold text-zinc-400 italic">Aucun parcours commencé</p>
                       <Link href="/parcours" className="mt-4 block text-[10px] font-black uppercase tracking-widest text-indigo-600 group-hover:underline">
                          Choisir un parcours
                       </Link>
                    </div>
                  )}
                </div>
              </section>

              <div className="rounded-[2.5rem] border-none bg-zinc-900 p-10 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                    <Sparkles size={100} />
                 </div>
                 <div className="relative space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                         <Loader2 size={20} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Révisez vos notions</h3>
                   </div>
                   <p className="text-xs font-medium text-zinc-400 italic leading-relaxed">
                      Vous avez <span className="text-white font-bold">{reviews_count} notions</span> en attente de révision. Boostez votre mémoire à long terme.
                   </p>
                   <button
                    onClick={() => router.push('/practice')}
                    className="w-full h-14 rounded-2xl bg-white text-zinc-900 font-black text-xs uppercase tracking-widest hover:bg-zinc-100 transition-all active:scale-95 shadow-xl"
                   >
                      Pratiquer maintenant
                   </button>
                 </div>
              </div>

            </aside>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
