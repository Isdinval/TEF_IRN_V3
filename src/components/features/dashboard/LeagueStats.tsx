"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export function LeagueStats({ xp }: { xp: number }) {
  const leagues = [
    { name: 'Bronze', min: 0, color: 'bg-orange-400' },
    { name: 'Argent', min: 500, color: 'bg-slate-300' },
    { name: 'Or', min: 1500, color: 'bg-yellow-400' },
    { name: 'Platine', min: 5000, color: 'bg-indigo-300' },
    { name: 'Diamant', min: 10000, color: 'bg-cyan-300' },
  ];

  const currentLeague = [...leagues].reverse().find(l => xp >= l.min) || leagues[0];
  const nextLeague = leagues[leagues.indexOf(currentLeague) + 1];

  return (
    <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
      <CardHeader className="bg-slate-50 border-b p-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" /> Ligue Actuelle
          </CardTitle>
          <Badge className={`${currentLeague.color} text-white border-none`}>{currentLeague.name}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 rounded-2xl ${currentLeague.color} flex items-center justify-center text-white shadow-lg`}>
             <Star size={32} fill="currentColor" />
          </div>
          <div className="flex-1">
             <h3 className="text-2xl font-black text-slate-800">Ligue {currentLeague.name}</h3>
             <p className="text-sm text-muted-foreground font-medium">Vous faites partie du top 15% des élèves.</p>
          </div>
        </div>

        {nextLeague && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
              <span>Vers la ligue {nextLeague.name}</span>
              <span>{xp} / {nextLeague.min} XP</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(xp / nextLeague.min) * 100}%` }}
                className={`h-full ${nextLeague.color}`}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
