"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import {
  Loader2,
  TrendingUp,
  Sparkles,
  Zap,
  Target,
  Trophy,
  Activity,
  History
} from "lucide-react";
import { DashboardHeader } from "@/components/features/dashboard/new/DashboardHeader";
import { StatsOverview } from "@/components/features/dashboard/new/StatsOverview";
import { RecommendationCard } from "@/components/features/dashboard/new/RecommendationCard";
import { ParcoursCard } from "@/components/features/dashboard/new/ParcoursCard";
import { ScoreProjection } from "@/components/features/dashboard/new/ScoreProjection";
import { QuickAccess } from "@/components/features/dashboard/new/QuickAccess";
import { RecentCorrectionsList } from "@/components/features/dashboard/new/RecentCorrectionsList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Dynamic imports with SSR disabled
const PerformanceRadar = dynamic(() => import("@/components/features/dashboard/new/PerformanceRadar").then(mod => mod.PerformanceRadar), { ssr: false });
const XPChart = dynamic(() => import("@/components/features/dashboard/new/XPChart").then(mod => mod.XPChart), { ssr: false });
const SubSkillHeatmap = dynamic(() => import("@/components/features/dashboard/new/SubSkillHeatmap").then(mod => mod.SubSkillHeatmap), { ssr: false });

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error("Non authentifié");

      const { data: dashboardData, error: rpcError } = await supabase.rpc("get_dashboard_data");
      if (rpcError) throw rpcError;
      return dashboardData || {};
    },
    enabled: isMounted,
  });

  if (!isMounted || isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50/30">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Chargement...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center bg-slate-50/30">
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Oups !</h2>
        <p className="text-zinc-500 mb-8 italic">Impossible de charger vos données.</p>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  // Safety extraction
  const profile = data.profile || {};
  const xp_today = data.xp_today || 0;
  const study_time_today = data.study_time_today || 0;
  const recent_corrections = Array.isArray(data.recent_corrections) ? data.recent_corrections : [];
  const competency_radar = Array.isArray(data.competency_radar) ? data.competency_radar : [];
  const sub_competencies = Array.isArray(data.sub_competencies) ? data.sub_competencies : [];
  const in_progress_parcours = Array.isArray(data.in_progress_parcours) ? data.in_progress_parcours : [];
  const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
  const reviews_count = data.reviews_count || 0;

  const radarLen = competency_radar.length;
  const avgScore = radarLen > 0
    ? Math.round(competency_radar.reduce((acc: number, curr: any) => acc + (curr?.A || 0), 0) / radarLen)
    : 0;
  const estimatedScore = avgScore > 0 ? Math.min(Math.round(avgScore * 6.9), 699) : 0;

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20">
      <div className="mx-auto max-w-7xl p-4 md:p-10 lg:p-12">
        <DashboardHeader
          fullName={profile.full_name || "Aventurier"}
          streak={profile.streak_count || 0}
          xpToday={xp_today}
          xpGoal={50}
          level={profile.current_level || 'A1'}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-8">
            <StatsOverview studyTime={study_time_today} completedExercises={recent_corrections.length} avgScore={avgScore} pendingCorrections={0} />
            {in_progress_parcours.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                    <Badge className="bg-violet-600 text-white rounded-full">En cours</Badge>
                    Mes parcours
                  </h2>
                  <Link href="/tef-irn/parcours" className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:underline">
                    Tout voir
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {in_progress_parcours.map((p: any) => (
                    <ParcoursCard
                      key={p.id}
                      id={p.id}
                      slug={p.slug || p.id}
                      level={p.level}
                      category={p.category}
                      progress={p.progress}
                    />
                  ))}
                </div>
              </section>
            )}
            <section className="space-y-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                <Badge className="bg-indigo-600 text-white rounded-full">IA Coach</Badge>
                Recommandations
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {recommendations.length > 0 ? recommendations.map((reco: any) => (
                  <RecommendationCard key={reco.id} type={reco.type} reason={reco.reason} referenceId={reco.reference_id} slug={reco.slug} />
                )) : <div className="col-span-2 p-12 text-center border-2 border-dashed rounded-[2.5rem] text-zinc-400">Continuez à pratiquer !</div>}
              </div>
            </section>
            <QuickAccess />
            <RecentCorrectionsList corrections={recent_corrections} />
          </div>

          <aside className="space-y-8 lg:col-span-4">
            <ScoreProjection currentLevel={profile.current_level || 'A1'} goalLevel={profile.goal_level || 'B2'} estimatedScore={estimatedScore} />
            <PerformanceRadar data={competency_radar} />
            <XPChart />
            <SubSkillHeatmap data={sub_competencies} />
          </aside>
        </div>
      </div>
    </div>
  );
}
