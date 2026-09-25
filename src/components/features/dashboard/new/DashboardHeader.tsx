"use client";

import Link from "next/link";
import { Sparkles, Zap, Trophy, Play } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

interface DashboardHeaderProps {
  fullName?: string | null;
  streak: number;
  xpToday: number;
  xpGoal: number;
  level: string;
}

// En-tête du tableau de bord : PageHeader standard (design system §5) + série, XP et objectif du jour.
export function DashboardHeader({ fullName, streak, xpToday, xpGoal, level }: DashboardHeaderProps) {
  const firstName = fullName?.split(" ")[0] || "Aventurier";
  const progress = Math.min((xpToday / xpGoal) * 100, 100);

  return (
    <div className="mb-6 flex flex-col gap-8">
      <PageHeader
        badge="Tableau de bord"
        title="Bonjour,"
        highlight={`${firstName} 👋`}
        description="Prêt pour une nouvelle session ? Vos objectifs d'aujourd'hui vous attendent."
        aside={
          <div className="flex w-full flex-col gap-4 md:w-auto">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-1 items-center gap-3 rounded-3xl border border-zinc-100 bg-white p-4 px-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <Zap size={20} fill="currentColor" aria-hidden />
                </div>
                <div>
                  <div className="text-xl font-black text-zinc-900">{streak}</div>
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Jours</div>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-3 rounded-3xl border border-zinc-100 bg-white p-4 px-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Trophy size={20} aria-hidden />
                </div>
                <div>
                  <div className="text-xl font-black text-zinc-900">{xpToday}</div>
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-500">XP du jour</div>
                </div>
              </div>
            </div>
            <Link
              href="/tef-irn/parcours"
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-indigo-600 px-8 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition-colors hover:bg-indigo-700 md:w-auto"
            >
              Commencer une session <Play size={16} fill="currentColor" className="ml-2" aria-hidden />
            </Link>
          </div>
        }
      >
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-zinc-500">Niveau {level}</p>
      </PageHeader>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs font-black uppercase tracking-widest text-zinc-500">
          <span className="flex items-center gap-2">
            <Sparkles size={12} className="text-indigo-600" aria-hidden /> Objectif quotidien
          </span>
          <span>{xpToday} / {xpGoal} XP</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-indigo-100"
          role="progressbar"
          aria-label="Objectif quotidien"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? "bg-emerald-600" : "bg-indigo-600"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
