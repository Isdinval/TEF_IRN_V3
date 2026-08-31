"use client";

import React, { useEffect, useRef, useState } from "react";
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
  History,
  ClipboardCheck,
  PenTool,
  Mic,
  Compass
} from "lucide-react";
import { DashboardHeader } from "@/components/features/dashboard/new/DashboardHeader";
import { StatsOverview } from "@/components/features/dashboard/new/StatsOverview";
import { ExamCountdownCard } from "@/components/features/dashboard/new/ExamCountdownCard";
import { ActionPlanCard } from "@/components/features/dashboard/new/ActionPlanCard";
import { ParcoursCard } from "@/components/features/dashboard/new/ParcoursCard";
import { ScoreProjection } from "@/components/features/dashboard/new/ScoreProjection";
import { LeagueCard } from "@/components/features/dashboard/new/LeagueCard";
import { RecentCorrectionsList } from "@/components/features/dashboard/new/RecentCorrectionsList";
import { VocabStatsCard } from "@/components/features/dashboard/new/VocabStatsCard";
import { QcmStatsCard } from "@/components/features/dashboard/new/QcmStatsCard";
import { TrousStatsCard } from "@/components/features/dashboard/new/TrousStatsCard";
import { InfoTooltip } from "@/components/features/dashboard/new/InfoTooltip";
import { DashboardSectionNav, type DashboardSectionId } from "@/components/features/dashboard/new/DashboardSectionNav";
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
  const [activeSection, setActiveSection] = useState<DashboardSectionId>("today");
  const sectionsTopRef = useRef<HTMLDivElement>(null);

  const handleSectionChange = (id: DashboardSectionId) => {
    setActiveSection(id);
    sectionsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  // RPC dédiées (plan "Key metrics QCM/Trous"), séparées de get_dashboard_data
  // par choix -- même convention enabled: isMounted, chargées en tâche de fond
  // dès l'arrivée sur le dashboard comme le reste des données (pas seulement
  // à l'ouverture de l'onglet "progress"), pour un affichage instantané au clic.
  const { data: qcmStats } = useQuery({
    queryKey: ["qcm-stats"],
    queryFn: async () => {
      const { data: stats, error: rpcError } = await supabase.rpc("get_qcm_stats");
      if (rpcError) throw rpcError;
      return stats;
    },
    enabled: isMounted,
  });

  const { data: trousStats } = useQuery({
    queryKey: ["trous-stats"],
    queryFn: async () => {
      const { data: stats, error: rpcError } = await supabase.rpc("get_trous_stats");
      if (rpcError) throw rpcError;
      return stats;
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
  const target_exam_date = profile.target_exam_date || null;
  const league_stats = data.league_stats || null;

  // recent_corrections remonte désormais jusqu'à 5 éléments par branche
  // (migrations 20260731000002/000003), et depuis 20260805000003 le bloc
  // "Examen blanc" agrège à la fois des EE et des EO (context='exam'), soit
  // jusqu'à 10 lignes avant tri -- on les fusionne, trie par date décroissante
  // et re-limite à 5 ici. Le QCM (types 'qcm', 'trous', 'qcm_centre_entrainement')
  // est explicitement exclu -- il n'est plus fetché du tout côté RPC depuis
  // 20260731000003, ce filtre est donc surtout une garde de sécurité côté client.
  const examCorrections = recent_corrections
    .filter((c: any) => c.exercise?.type === 'examen_blanc')
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const oralCorrections = recent_corrections.filter((c: any) => c.exercise?.type === 'entretien_oral');
  const writtenCorrections = recent_corrections.filter((c: any) => c.exercise?.type === 'ecrit');

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

        <div className="mt-8">
          <StatsOverview studyTime={study_time_today} completedExercises={recent_corrections.length} avgScore={avgScore} pendingCorrections={pending_corrections}>
            <ExamCountdownCard targetExamDate={target_exam_date} onUpdated={() => refetch()} />
          </StatsOverview>
        </div>

        <div className="mt-4 flex justify-end">
          <Link
            href="/tef-irn/exam"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-indigo-600 transition-all hover:bg-indigo-100"
          >
            <Target size={14} /> Passer un examen blanc
          </Link>
        </div>

        <DashboardSectionNav activeSection={activeSection} onChange={handleSectionChange} />

        <div ref={sectionsTopRef} className="scroll-mt-24" />

        {activeSection === "today" && (
        <section className="mt-12 space-y-8 rounded-[2.5rem] border-l-8 border-amber-400 bg-amber-50/40 p-6 md:p-10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-3">
            <Badge className="bg-amber-500 text-white rounded-full">Aujourd'hui</Badge>
            Aujourd'hui
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black uppercase tracking-tight text-zinc-700 flex items-center gap-2">
                <Badge className="bg-violet-600 text-white rounded-full">En cours</Badge>
                Mes parcours
                <InfoTooltip text="Vos parcours de leçons en cours, classés par dernière activité. Un parcours regroupe les leçons d'un même niveau et d'une même catégorie." />
              </h3>
              <Link href="/tef-irn/parcours" className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:underline">
                Tout voir
              </Link>
            </div>
            {in_progress_parcours.length > 0 ? (
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
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] border-2 border-dashed border-zinc-200 bg-white">
                <Compass size={48} className="text-zinc-200 mb-4" />
                <p className="text-sm font-bold text-zinc-400">Aucun parcours en cours pour l'instant.</p>
                <p className="text-xs text-zinc-300 mt-1 mb-4">Choisissez un parcours pour démarrer votre préparation.</p>
                <Link
                  href="/tef-irn/parcours"
                  className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-black transition-all"
                >
                  Découvrir les parcours
                </Link>
              </div>
            )}
          </div>

          <ActionPlanCard
            weakPoints={weak_points}
            recommendations={recommendations}
            vocabReviewsDue={vocab_reviews_due}
            exerciseReviewsDue={exercise_reviews_due}
            onDismissed={() => refetch()}
          />
        </section>
        )}

        {activeSection === "progress" && (
        <section className="mt-12 space-y-8 rounded-[2.5rem] border-l-8 border-violet-500 bg-violet-50/40 p-6 md:p-10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-3">
            <Badge className="bg-violet-600 text-white rounded-full">Progression</Badge>
            Ma progression
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
            <div className="space-y-6">
              <ScoreProjection currentLevel={profile.current_level || 'A1'} goalLevel={profile.goal_level || 'B2'} skills={competency_radar} />
              {league_stats && <LeagueCard leagueName={league_stats.league_name} rank={league_stats.rank} totalMembers={league_stats.total_members} />}
            </div>
            <div className="space-y-6">
              {vocab_stats && (
                <VocabStatsCard
                  total={vocab_stats.total}
                  totalAvailable={vocab_stats.total_available}
                  levels={vocab_stats.levels}
                  levelsAvailable={vocab_stats.levels_available}
                  topLevel={vocab_stats.topLevel}
                />
              )}
              {qcmStats && (
                <QcmStatsCard
                  total={qcmStats.total}
                  totalAvailable={qcmStats.total_available}
                  levels={qcmStats.levels}
                  levelsAvailable={qcmStats.levels_available}
                  successRate={qcmStats.success_rate}
                />
              )}
              {trousStats && (
                <TrousStatsCard
                  total={trousStats.total}
                  totalAvailable={trousStats.total_available}
                  levels={trousStats.levels}
                  levelsAvailable={trousStats.levels_available}
                  successRate={trousStats.success_rate}
                />
              )}
            </div>
          </div>
        </section>
        )}

        {activeSection === "analysis" && (
        <section className="mt-12 space-y-8 rounded-[2.5rem] border-l-8 border-zinc-800 bg-zinc-100/60 p-6 md:p-10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900 flex items-center gap-3">
            <Badge className="bg-zinc-900 text-white rounded-full">Analyse</Badge>
            Analyse détaillée
            <InfoTooltip text="Vue approfondie de votre progression : radar de compétences, maîtrise par thématique, historique XP et corrections récentes." />
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PerformanceRadar data={competency_radar} />
            <SubSkillHeatmap data={sub_competencies} />
          </div>
          <XPChart data={xp_last_7_days} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <RecentCorrectionsList
              corrections={examCorrections}
              title="Examen blanc"
              icon={ClipboardCheck}
              tooltip="Vos 5 derniers examens blancs passés."
              emptyMessage="Aucun examen blanc passé pour l'instant."
            />
            <RecentCorrectionsList
              corrections={writtenCorrections}
              title="Écrit"
              icon={PenTool}
              tooltip="Vos 5 derniers exercices d'expression écrite (QCM exclus)."
              emptyMessage="Aucun exercice écrit récent."
            />
            <RecentCorrectionsList
              corrections={oralCorrections}
              title="Oral"
              icon={Mic}
              tooltip="Vos 5 dernières sessions d'entretien oral."
              emptyMessage="Aucune session orale récente."
            />
          </div>
        </section>
        )}
      </div>
    </div>
  );
}
