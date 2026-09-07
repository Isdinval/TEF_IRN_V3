"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "./InfoTooltip";

interface WeakestCriterion {
  label: string;
  score: number;
}

interface OralStatsCardProps {
  total: number;
  levels: { A2: number; B1: number; B2: number };
  successRate: number | null;
  lastScore: number | null;
  weakestCriterion: WeakestCriterion | null;
}

const VOLUME_TOOLTIP =
  "Contrairement au QCM ou aux Trous, l'oral n'a pas de catalogue fini à terminer : ce chiffre compte toutes vos sessions pratiquées (entraînement libre et examens blancs confondus).";

const WEAKEST_TOOLTIP =
  "Le critère du barème officiel du TEF IRN sur lequel votre score moyen est le plus bas, toutes sessions confondues. Le détail des 5 critères reste disponible dans l'onglet Analyse.";

export function OralStatsCard({ total, levels, successRate, lastScore, weakestCriterion }: OralStatsCardProps) {
  const router = useRouter();

  if (!total || total === 0) {
    return (
      <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
        <CardContent className="p-8">
          <div className="mb-6 space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
              <Mic size={14} /> Oral
            </h3>
            <p className="text-xl font-black text-zinc-900 tracking-tight">0 session pratiquée</p>
          </div>

          <div className="flex flex-col items-center justify-center p-8 text-center rounded-[2rem] border-2 border-dashed border-zinc-100">
            <Mic size={40} className="text-zinc-200 mb-3" />
            <p className="text-sm font-bold text-zinc-400">Aucune session orale pour l'instant.</p>
            <p className="text-xs text-zinc-300 mt-1">L'oral se travaille par la pratique régulière, pas par QCM.</p>
          </div>

          <Button
            onClick={() => router.push("/tef-irn/oral")}
            variant="outline"
            className="mt-6 h-12 w-full rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
          >
            Commencer une session <ArrowRight size={16} />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const delta = lastScore != null && successRate != null ? lastScore - successRate : null;

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
              <Mic size={14} /> Oral
            </h3>
            <p className="flex items-center gap-2 text-xl font-black text-zinc-900 tracking-tight">
              {total} session{total > 1 ? "s" : ""} pratiquée{total > 1 ? "s" : ""}
              <InfoTooltip text={VOLUME_TOOLTIP} />
            </p>
          </div>
          {successRate != null && (
            <div className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-600">
              Score moyen : {successRate}%
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6">
          {(["A2", "B1", "B2"] as const).map((lvl) => (
            <span key={lvl} className="rounded-full bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-500">
              {lvl} <span className="text-zinc-900 font-black">×{levels?.[lvl] || 0}</span>
            </span>
          ))}
        </div>

        {delta != null && (
          <div className="flex items-center gap-2 mb-4 text-xs font-bold text-zinc-500">
            {delta > 0 ? (
              <TrendingUp size={14} className="text-emerald-500" />
            ) : delta < 0 ? (
              <TrendingDown size={14} className="text-amber-500" />
            ) : (
              <Minus size={14} className="text-zinc-400" />
            )}
            Dernière session : {lastScore}% ({delta > 0 ? "+" : ""}{delta} vs moyenne)
          </div>
        )}

        {weakestCriterion && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50/60 px-4 py-3 mb-6">
            <p className="text-xs font-bold text-rose-600">
              Point à travailler : {weakestCriterion.label} ({weakestCriterion.score}%)
            </p>
            <InfoTooltip text={WEAKEST_TOOLTIP} />
          </div>
        )}

        <Button
          onClick={() => router.push("/tef-irn/oral")}
          variant="outline"
          className="h-12 w-full rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
        >
          Continuer à l'oral <ArrowRight size={16} />
        </Button>
      </CardContent>
    </Card>
  );
}
