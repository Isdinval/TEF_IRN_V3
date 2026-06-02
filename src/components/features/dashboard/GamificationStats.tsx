"use client";

import { Award, Star, Zap } from "lucide-react";
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

  const getRank = (xp: number) => {
    if (xp < 500) return "Débutant";
    if (xp < 2000) return "Apprenti";
    if (xp < 5000) return "Initié";
    return "Expert";
  };

  const rank = getRank(xp);

  const achievements: Achievement[] = [
    { id: "1", title: "Lève-tôt", description: "Faire un exercice avant 8h", icon: Zap, unlocked: true },
    { id: "2", title: "Plume d'Or", description: "Rédiger 1000 mots", icon: Award, unlocked: false },
    { id: "3", title: "Sans Faute", description: "10 QCM réussis d'affilée", icon: Star, unlocked: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <div className="text-xs text-muted-foreground font-semibold uppercase">Rang</div>
          <div className="text-xl font-bold text-indigo-600">{rank}</div>
        </div>
        <div className="p-4 bg-white border rounded-xl shadow-sm">
          <div className="text-xs text-muted-foreground font-semibold uppercase">Points</div>
          <div className="text-xl font-bold text-orange-600">{xp} XP</div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Award size={16} className="text-amber-500" /> Succès Récents
        </h3>
        <div className="space-y-2">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3 border rounded-lg flex items-center gap-3 transition-opacity ${ach.unlocked ? 'opacity-100' : 'opacity-40 grayscale'}`}
            >
              <div className={`p-2 rounded-full ${ach.unlocked ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                <ach.icon size={16} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{ach.title}</div>
                <div className="text-xs text-muted-foreground">{ach.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
