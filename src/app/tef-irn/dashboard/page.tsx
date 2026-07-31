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
import { ActionPlanCard } from "@/components/features/dashboard/new/ActionPlanCard";
import { ParcoursCard } from "@/components/features/dashboard/new/ParcoursCard";
import { ScoreProjection } from "@/components/features/dashboard/new/ScoreProjection";
import { QuickAccess } from "@/components/features/dashboard/new/QuickAccess";
import { RecentCorrectionsList } from "@/components/features/dashboard/new/RecentCorrectionsList";
import { SrsReviewBanner } from "@/components/features/dashboard/new/SrsReviewBanner";
import { VocabStatsCard } from "@/components/features/dashboard/new/VocabStatsCard";
import { CivicExamCard } from "@/components/features/dashboard/new/CivicExamCard";
import { InfoTooltip } from "@/components/features/dashboard/new/InfoTooltip";
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

  const { data, isLoading, error, refetch } = useQuery({
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

  useEffect(() => {
    if (data?.profile && data.profile.onboarding_completed === false) {
      router.replace("/tef-irn/onboarding");
    }
  }, [data, router]);

  if (!isMounted || isLoading || data?.profile?.onboarding_completed === false) {
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
  const xp_last_7_days = Array.isArray(data.xp_last_7_days) ? data.xp_last_7_days : [];
  const pending_corrections = data.pending_corrections || 0;
  const vocab_reviews_due = data.vocab_reviews_due || 0;
  const exercise_reviews_due = data.exercise_reviews_due || 0;
  const vocab_stats = data.vocab_stats || null;
  const weak_points = Array.isArray(data.weak_points) ? data.weak_points : [];

  const radarLen = competency_radar.length;
  const avgScore = radarLen > 0
    ? Math.round(competency_radar.reduce((acc: number, curr: any) => acc + (curr?.A || 0), 0) / radarLen)
    : 0;

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

        <SrsReviewBanner vocabReviewsDue={vocab_reviews_due} exerciseReviewsDue={exercise_reviews_due} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-12 lg:col-span-8">
            <StatsOverview studyTime={study_time_today} completedExercises={recent_corrections.length} avgScore={avgScore} pendingCorrections={pending_corrections} />
            {in_progress_parcours.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                    <Badge className="bg-violet-600 text-white rounded-full">En cours</Badge>
                    Mes parcours
                    <InfoTooltip text="Vos parcours de leçons en cours, classés par dernière activité. Un parcours regroupe les leçons d'un même niveau et d'une même catégorie." />
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
            <ActionPlanCard weakPoints={weak_points} recommendations={recommendations} onDismissed={() => refetch()} />
            <QuickAccess lastCorrection={recent_corrections[0] || null} />
          </div>

          <aside className="space-y-8 lg:col-span-4">
            <ScoreProjection currentLevel={profile.current_level || 'A1'} goalLevel={profile.goal_level || 'B2'} skills={competency_radar} />
            {vocab_stats && <VocabStatsCard total={vocab_stats.total} levels={vocab_stats.levels} topLevel={vocab_stats.topLevel} />}
            <CivicExamCard />
          </aside>
        </div>

        <section className="mt-16 space-y-8">
          <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
            <Badge className="bg-zinc-900 text-white rounded-full">Analyse</Badge>
            Analyse détaillée
            <InfoTooltip text="Vue approfondie de votre progression : radar de compétences, maîtrise par thématique, historique XP et corrections récentes." />
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PerformanceRadar data={competency_radar} />
            <SubSkillHeatmap data={sub_competencies} />
          </div>
          <XPChart data={xp_last_7_days} />
          <RecentCorrectionsList corrections={recent_corrections} />
        </section>
      </div>
    </div>
  );
}
