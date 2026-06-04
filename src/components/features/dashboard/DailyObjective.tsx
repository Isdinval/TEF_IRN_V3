"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export function DailyObjective({ xpToday, goal = 50 }: { xpToday: number, goal?: number }) {
  const percentage = Math.min((xpToday / goal) * 100, 100);

  return (
    <Card className="border-none shadow-xl shadow-indigo-100/50 bg-gradient-to-br from-indigo-600 to-indigo-700 overflow-hidden relative">
      <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-100 text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={12} /> Objectif Quotidien
            </div>
            <h3 className="text-2xl font-black text-white">Continuer sur votre lancée</h3>
          </div>
          <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-white">
            <Trophy size={20} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end text-white">
            <div className="text-3xl font-black">{percentage.toFixed(0)}<span className="text-lg opacity-60">%</span></div>
            <div className="text-xs font-bold opacity-80">{xpToday} / {goal} XP</div>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
            />
          </div>
          <p className="text-[11px] text-indigo-100 font-medium italic">
            Plus que {Math.max(goal - xpToday, 0)} XP pour atteindre votre objectif du jour !
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
