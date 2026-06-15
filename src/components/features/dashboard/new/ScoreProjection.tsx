"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface ScoreProjectionProps {
  currentLevel: string;
  goalLevel: string;
  estimatedScore: number;
}

export function ScoreProjection({ currentLevel, goalLevel, estimatedScore }: ScoreProjectionProps) {
  // Logic to map score to level string
  let levelDisplay = "A2+";
  if (estimatedScore >= 500) levelDisplay = "B2+";
  else if (estimatedScore >= 400) levelDisplay = "B1+";
  else if (estimatedScore >= 300) levelDisplay = "B1";
  else if (estimatedScore >= 200) levelDisplay = "A2";

  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-200/50 rounded-[2.5rem] relative">
      <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <CardContent className="p-8">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-6">
          <TrendingUp size={14} /> Projection de Score TEF
        </div>

        <div className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-black">{estimatedScore}<span className="text-lg opacity-60 ml-1">pts</span></p>
              <p className="text-sm font-bold text-indigo-100 italic">Estimation actuelle</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                Niveau {levelDisplay}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-100">
              <span>Niveau actuel: {currentLevel}</span>
              <span>Objectif: {goalLevel}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
               <motion.div
                 initial={{ width: 0 }}
                 animate={{ width: "65%" }}
                 className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
               />
            </div>
          </div>

          <button className="flex w-full items-center justify-between rounded-2xl bg-white/10 p-4 transition-all hover:bg-white/20 group">
             <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
                   <Target size={16} />
                </div>
                <span className="text-xs font-black uppercase tracking-wider">Passer un examen blanc</span>
             </div>
             <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
