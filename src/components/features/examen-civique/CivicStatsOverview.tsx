"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Flame, Trophy, Brain, CheckCircle2 } from "lucide-react";

interface CivicStatsOverviewProps {
  streak: number;
  bestScore: number | null;
  questionCount: number;
  dueCount: number;
  masteredPercent: number | null;
}

export function CivicStatsOverview({ streak, bestScore, questionCount, dueCount, masteredPercent }: CivicStatsOverviewProps) {
  const stats = [
    {
      label: "Jours de suite",
      value: streak,
      icon: Flame,
      color: "bg-orange-50 text-orange-600",
      detail: "Régularité",
    },
    {
      label: "Meilleur score",
      value: bestScore !== null ? `${bestScore}/${questionCount}` : "—",
      icon: Trophy,
      color: "bg-blue-50 text-blue-600",
      detail: bestScore !== null ? "Examen blanc" : "Pas encore tenté",
    },
    {
      label: "À réviser",
      value: dueCount,
      icon: Brain,
      color: "bg-indigo-50 text-indigo-600",
      detail: dueCount > 0 ? "Aujourd'hui" : "Rien en attente",
    },
    {
      label: "Maîtrisées",
      value: masteredPercent !== null ? `${masteredPercent}%` : "—",
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
      detail: "Questions",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <Card key={i} className="overflow-hidden border-none bg-white shadow-lg shadow-zinc-100 rounded-3xl">
          <CardContent className="p-5">
            <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${stat.color} mb-3`}>
              <stat.icon size={18} />
            </div>
            <p className="text-xl font-black text-zinc-900">{stat.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">{stat.label}</p>
            <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-tighter mt-0.5">{stat.detail}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
