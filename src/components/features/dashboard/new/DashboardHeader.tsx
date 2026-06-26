"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, Trophy, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface DashboardHeaderProps {
  fullName?: string | null;
  streak: number;
  xpToday: number;
  xpGoal: number;
  level: string;
}

export function DashboardHeader({ fullName, streak, xpToday, xpGoal, level }: DashboardHeaderProps) {
  const router = useRouter();
  const firstName = fullName?.split(" ")[0] || "Aventurier";
  const progress = Math.min((xpToday / xpGoal) * 100, 100);

  return (
    <div className="relative mb-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 shadow-2xl md:p-12">
      {/* Decorative Elements */}
      <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/4 -translate-y-1/4 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/4 translate-y-1/4 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/30">
              Tableau de bord
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-700" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Niveau {level}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black tracking-tight text-white md:text-5xl"
          >
            Bonjour, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{firstName}</span> 👋
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md text-sm font-medium leading-relaxed text-zinc-400 italic"
          >
            Prêt pour une nouvelle session ? Vos objectifs d'aujourd'hui vous attendent.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-4 w-full md:w-auto"
        >
          <div className="flex flex-wrap gap-4">
            {/* Streak Card */}
            <div className="flex items-center gap-3 rounded-3xl bg-white/5 border border-white/10 p-4 px-6 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-500">
                <Zap size={20} fill="currentColor" />
              </div>
              <div>
                <div className="text-xl font-black text-white">{streak}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Jours</div>
              </div>
            </div>

            {/* XP Card */}
            <div className="flex items-center gap-3 rounded-3xl bg-white/5 border border-white/10 p-4 px-6 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
                <Trophy size={20} />
              </div>
              <div>
                <div className="text-xl font-black text-white">{xpToday}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">XP du jour</div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => router.push('/TEF_IRN/TEF_IRN/parcours')}
            className="h-16 w-full rounded-[2rem] bg-indigo-600 px-8 text-base font-black text-white shadow-xl shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-600/40 md:w-auto"
          >
            Commencer une session <Play size={18} fill="currentColor" className="ml-2" />
          </Button>
        </motion.div>
      </div>

      {/* Daily Progress Bar */}
      <div className="mt-12 space-y-3">
        <div className="flex items-center justify-between px-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <span className="flex items-center gap-2"><Sparkles size={12} className="text-indigo-400" /> Objectif quotidien</span>
          <span>{xpToday} / {xpGoal} XP</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800/50 border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
          />
        </div>
      </div>
    </div>
  );
}
