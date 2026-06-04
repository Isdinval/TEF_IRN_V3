"use client";

import { Award, Star, Zap, ChevronRight, LayoutGrid } from "lucide-react";
import { Profile } from "@/types/database";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
}

interface GamificationStatsProps {
  profile: Profile | null;
}

export function GamificationStats({ profile }: GamificationStatsProps) {
  const xp = profile?.total_xp || 0;

  const achievements: Achievement[] = [
    { id: "1", title: "Lève-tôt", description: "Faire un exercice avant 8h", icon: Zap, unlocked: true },
    { id: "2", title: "Plume d'Or", description: "Rédiger 1000 mots", icon: Award, unlocked: false },
    { id: "3", title: "Sans Faute", description: "10 QCM réussis d'affilée", icon: Star, unlocked: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
          <LayoutGrid size={14} className="text-zinc-400" /> Galerie de Succès
        </h3>
        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 cursor-pointer hover:underline">
          Voir tout <ChevronRight size={10} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
              ach.unlocked
              ? 'bg-white border-zinc-100 shadow-sm'
              : 'bg-zinc-50 border-transparent opacity-40 grayscale'
            }`}
          >
            <div className={`p-2 rounded-xl ${ach.unlocked ? 'bg-amber-100 text-amber-600' : 'bg-zinc-200 text-zinc-400'}`}>
              <ach.icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-zinc-900 tracking-tight">{ach.title}</div>
              <div className="text-[10px] text-zinc-500 font-medium truncate italic">{ach.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-zinc-900 rounded-[1.5rem] text-white flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Progression XP</div>
          <div className="text-xl font-black">{xp} <span className="text-xs opacity-60">XP</span></div>
        </div>
        <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center font-black text-xs">
          14
        </div>
      </div>
    </div>
  );
}
