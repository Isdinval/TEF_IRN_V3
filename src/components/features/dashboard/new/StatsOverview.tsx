"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Timer, CheckCircle2, History, MessageSquareText } from "lucide-react";

interface StatsOverviewProps {
  studyTime: number;
  completedExercises: number;
  avgScore: number;
  pendingCorrections: number;
}

export function StatsOverview({ studyTime, completedExercises, avgScore, pendingCorrections }: StatsOverviewProps) {
  const displayScore = avgScore > 0 ? `${avgScore}%` : "-";

  const stats = [
    {
      label: "Temps d'étude",
      value: `${studyTime}m`,
      icon: Timer,
      color: "bg-amber-50 text-amber-600",
      detail: "Aujourd'hui"
    },
    {
      label: "Exercices",
      value: completedExercises,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600",
      detail: "Total session"
    },
    {
      label: "Score Moyen",
      value: displayScore,
      icon: History,
      color: "bg-blue-50 text-blue-600",
      detail: avgScore > 0 ? "Estimation TEF" : "Commencez à pratiquer"
    },
    {
      label: "En attente",
      value: pendingCorrections,
      icon: MessageSquareText,
      color: "bg-violet-50 text-violet-600",
      detail: "Feedback IA"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat, i) => (
        <Card key={i} className="overflow-hidden border-none bg-white shadow-lg shadow-zinc-100 rounded-3xl transition-all hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${stat.color}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-zinc-900">{stat.value}</p>
              <div className="flex flex-col">
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.label}</p>
                 <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-tighter mt-0.5">{stat.detail}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
