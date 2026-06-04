"use client";

import { Trophy, Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export function LeagueStats({ xp }: { xp: number }) {
  const leagues = [
    { name: 'Bronze', min: 0, color: 'bg-orange-400', iconColor: 'text-orange-500' },
    { name: 'Argent', min: 500, color: 'bg-zinc-300', iconColor: 'text-zinc-400' },
    { name: 'Or', min: 1500, color: 'bg-amber-400', iconColor: 'text-amber-500' },
    { name: 'Platine', min: 5000, color: 'bg-indigo-400', iconColor: 'text-indigo-500' },
    { name: 'Diamant', min: 10000, color: 'bg-cyan-400', iconColor: 'text-cyan-500' },
  ];

  const currentLeague = [...leagues].reverse().find(l => xp >= l.min) || leagues[0];
  const nextLeague = leagues[leagues.indexOf(currentLeague) + 1];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
          <Trophy size={14} className={currentLeague.iconColor} /> Statut de la Ligue
        </h3>
        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 cursor-pointer hover:underline">
          Classement <ChevronRight size={10} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl ${currentLeague.color} flex items-center justify-center text-white shadow-xl shadow-inner`}>
           <Star size={24} fill="currentColor" />
        </div>
        <div>
           <h4 className="text-xl font-black text-zinc-900 tracking-tight">Ligue {currentLeague.name}</h4>
           <p className="text-xs text-zinc-500 font-medium italic">Dans le top 15% des élèves.</p>
        </div>
      </div>

      {nextLeague && (
        <div className="space-y-3">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <span>Vers {nextLeague.name}</span>
            <span>{xp} / {nextLeague.min} XP</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((xp / nextLeague.min) * 100, 100)}%` }}
              className={`h-full ${nextLeague.color}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
