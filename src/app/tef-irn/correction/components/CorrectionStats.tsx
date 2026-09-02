"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Target,
  BarChart3,
  TrendingUp,
  History,
  GraduationCap
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { motion } from "framer-motion";
import { ExerciseAttempt } from "@/types/writing";
import { InfoTooltip } from "@/components/features/dashboard/new/InfoTooltip";
import { estimateCurrentLevel } from "../lib/estimate-level";

interface CorrectionStatsProps {
  attempts: ExerciseAttempt[];
  // Dataset dédié au graphique (item 3) : toujours EE+EO mélangés, jamais filtré
  // par type -- voir commentaire dans page.tsx sur pourquoi ce dataset est séparé
  // de `attempts` (qui, lui, réagit au filtre Type de la liste en dessous).
  chartAttempts: ExerciseAttempt[];
}

const MAX_POINTS_PER_SKILL = 15;

// "Type" affiché en tooltip : distingue examen blanc de pratique libre, et précise
// la page d'origine pour la pratique libre (demande explicite d'Olivier -- "EE via
// page writing", "EO via page oral").
const typeLabel = (skill: "EE" | "EO", context?: string) => {
  if (context === "exam") return "Examen blanc";
  return skill === "EE" ? "Pratique — Rédaction (writing)" : "Pratique — Oral (oral)";
};

interface ChartPoint {
  index: number;
  ee_score?: number;
  ee_date?: string;
  ee_type?: string;
  ee_level?: string | null;
  eo_score?: number;
  eo_date?: string;
  eo_type?: string;
  eo_level?: string | null;
}

const buildChartData = (chartAttempts: ExerciseAttempt[]): ChartPoint[] => {
  const bySkill = (skill: "EE" | "EO") =>
    [...chartAttempts]
      .filter(a => a.skill === skill)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-MAX_POINTS_PER_SKILL);

  const eePoints = bySkill("EE");
  const eoPoints = bySkill("EO");
  const length = Math.max(eePoints.length, eoPoints.length);

  return Array.from({ length }, (_, i) => {
    const ee = eePoints[i];
    const eo = eoPoints[i];
    return {
      index: i + 1,
      ee_score: ee?.score ?? undefined,
      ee_date: ee ? new Date(ee.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : undefined,
      ee_type: ee ? typeLabel("EE", ee.context) : undefined,
      ee_level: ee?.estimated_level ?? null,
      eo_score: eo?.score ?? undefined,
      eo_date: eo ? new Date(eo.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : undefined,
      eo_type: eo ? typeLabel("EO", eo.context) : undefined,
      eo_level: eo?.estimated_level ?? null,
    };
  });
};

// Tooltip custom (au lieu du Tooltip par défaut de Recharts) : nécessaire pour
// afficher, par point, le type de tentative (examen blanc / pratique + page
// d'origine) et le niveau CECRL estimé -- deux infos absentes du payload par
// défaut, demandées explicitement par Olivier.
// Props minimales et locales plutôt que le générique TooltipProps de recharts
// (signature qui varie entre versions majeures de la lib) -- on n'utilise que
// active/payload[].payload, donc autant typer exactement ce qu'on lit.
interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
}

const ChartTooltip = ({ active, payload }: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as ChartPoint;

  const rows = [
    point.ee_score !== undefined && {
      key: "ee",
      color: "#4f46e5",
      label: "EE",
      score: point.ee_score,
      date: point.ee_date,
      type: point.ee_type,
      level: point.ee_level,
    },
    point.eo_score !== undefined && {
      key: "eo",
      color: "#7c3aed",
      label: "EO",
      score: point.eo_score,
      date: point.eo_date,
      type: point.eo_type,
      level: point.eo_level,
    },
  ].filter(Boolean) as { key: string; color: string; label: string; score: number; date?: string; type?: string; level?: string | null }[];

  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-xl shadow-zinc-200/60 border border-zinc-100 space-y-2 min-w-[200px]">
      {rows.map(row => (
        <div key={row.key} className="space-y-0.5">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest" style={{ color: row.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
              {row.label}
            </span>
            <span className="text-sm font-black text-zinc-900">{row.score}%</span>
          </div>
          <p className="text-[11px] font-bold text-zinc-400">{row.date} · {row.type}</p>
          {row.level && (
            <p className="text-[11px] font-bold text-zinc-500">Niveau CECRL estimé : <span className="text-zinc-700">{row.level}</span></p>
          )}
        </div>
      ))}
    </div>
  );
};

export const CorrectionStats = ({ attempts, chartAttempts }: CorrectionStatsProps) => {
  const total = attempts.length;
  const avgScore = total > 0
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / total)
    : 0;

  const bestScore = total > 0
    ? Math.max(...attempts.map(a => a.score || 0))
    : 0;

  const latestScore = total > 0 ? attempts[0].score || 0 : 0;

  const chartData = buildChartData(chartAttempts);
  const estimatedLevel = estimateCurrentLevel(chartAttempts);

  const cardStats = [
    {
      label: "Corrections",
      value: total,
      icon: History,
      color: "text-blue-600",
      bg: "bg-blue-50",
      tooltip: "Nombre de tentatives correspondant au filtre Type actuellement sélectionné ci-dessous (Tous / Examen blanc / EE / EO)."
    },
    {
      label: "Score Moyen",
      value: `${avgScore}%`,
      icon: BarChart3,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      tooltip: "Moyenne des scores sur les tentatives affichées. EE et EO ont chacune leur propre grille de notation officielle TEF IRN -- ce chiffre n'est vraiment comparable dans le temps que si vous filtrez sur un seul type à la fois."
    },
    {
      label: "Record",
      value: `${bestScore}%`,
      icon: Trophy,
      color: "text-amber-600",
      bg: "bg-amber-50",
      tooltip: "Votre meilleur score parmi les tentatives actuellement affichées (filtre Type + Niveau appliqués)."
    },
    {
      label: "Dernier",
      value: `${latestScore}%`,
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      tooltip: "Score de votre tentative la plus récente parmi celles affichées -- pas forcément votre toute dernière activité si un filtre Type est actif."
    },
  ];

  return (
    <div className="space-y-6">
      {estimatedLevel.level && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden rounded-[2rem] border-none bg-slate-950 shadow-2xl shadow-indigo-100">
            <CardContent className="flex flex-col items-center gap-2 p-8 text-center relative">
              <div className="absolute top-5 right-5">
                <InfoTooltip
                  className="text-slate-500 hover:text-slate-300"
                  text={`Estimation basée sur le niveau CECRL démontré (indépendant du niveau visé par chaque sujet) de vos ${estimatedLevel.sampleSize} dernières tentatives EE+EO les plus récentes, pondérées par récence. Ce n'est pas un score officiel TEF IRN.`}
                />
              </div>
              <div className="flex items-center gap-2 text-indigo-400">
                <GraduationCap size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Niveau CECRL estimé actuel</span>
              </div>
              <h2 className="text-5xl font-black tracking-tighter text-white">{estimatedLevel.level}</h2>
              <p className="text-xs font-medium text-slate-400">
                Basé sur vos {estimatedLevel.sampleSize} dernières tentatives EE+EO
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cardStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-xl shadow-zinc-100 overflow-hidden rounded-3xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <InfoTooltip text={stat.tooltip} />
                </div>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                <h4 className="text-3xl font-black text-zinc-900 tracking-tighter">{stat.value}</h4>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-none shadow-xl shadow-zinc-100 rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="text-indigo-600" size={24} />
                    Évolution de vos scores
                  </h3>
                  <p className="text-sm font-medium text-zinc-400">
                    Expression Écrite et Expression Orale, {MAX_POINTS_PER_SKILL} dernières tentatives de chaque — toutes provenances confondues (pratique libre et examen blanc)
                  </p>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="index"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                      dy={10}
                      label={{ value: "Tentative n°", position: "insideBottom", offset: -5, fontSize: 10, fill: '#94a3b8' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      formatter={(value) => <span className="text-xs font-black text-zinc-500">{value}</span>}
                      wrapperStyle={{ paddingTop: 16 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ee_score"
                      name="EE"
                      stroke="#4f46e5"
                      strokeWidth={4}
                      connectNulls
                      dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="eo_score"
                      name="EO"
                      stroke="#7c3aed"
                      strokeWidth={4}
                      connectNulls
                      dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#7c3aed', strokeWidth: 3, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
