"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";

interface LeagueCardProps {
  leagueName: string;
  rank: number;
  totalMembers: number;
}

export function LeagueCard({ leagueName, rank, totalMembers }: LeagueCardProps) {
  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8 space-y-4">
        <div className="space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
            <Trophy size={14} /> Classement
          </h3>
          <p className="flex items-center gap-2 text-xl font-black text-zinc-900 tracking-tight">
            Ligue {leagueName}
            <InfoTooltip text="Votre classement parmi les utilisateurs de votre ligue actuelle, basé sur le total de points XP cumulés." />
          </p>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/50">
          <div className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-amber-100 text-amber-600 font-black text-sm">
            #{rank}
          </div>
          <p className="text-xs font-black text-zinc-900">
            sur {totalMembers} participant{totalMembers > 1 ? "s" : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
