"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "./InfoTooltip";

interface EEStatsCardProps {
  total: number;
  successRate: number | null;
  lastScore: number | null;
}

const VOLUME_TOOLTIP =
  "Ce chiffre compte toutes vos sessions d'expression écrite pratiquées (exercices de rédaction et scénarios d'examen confondus, entraînement libre comme examens blancs).";

export function EEStatsCard({ total, successRate, lastScore }: EEStatsCardProps) {
  const router = useRouter();

  if (!total || total === 0) {
    return (
      <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
        <CardContent className="p-8">
          <div className="mb-6 space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 flex items-center gap-2">
              <PenTool size={14} /> Écrit (EE)
            </h3>
            <p className="text-xl font-black text-zinc-900 tracking-tight">0 session pratiquée</p>
          </div>

          <div className="flex flex-col items-center justify-center p-8 text-center rounded-[2rem] border-2 border-dashed border-zinc-100">
            <PenTool size={40} className="text-zinc-200 mb-3" />
            <p className="text-sm font-bold text-zinc-400">Aucune session d'expression écrite pour l'instant.</p>
            <p className="text-xs text-zinc-300 mt-1">Rédigez un texte pour voir votre progression ici.</p>
          </div>

          <Button
            onClick={() => router.push("/tef-irn/writing")}
            variant="outline"
            className="mt-6 h-12 w-full rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
          >
            Commencer une rédaction <ArrowRight size={16} />
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
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 flex items-center gap-2">
              <PenTool size={14} /> Écrit (EE)
            </h3>
            <p className="flex items-center gap-2 text-xl font-black text-zinc-900 tracking-tight">
              {total} session{total > 1 ? "s" : ""} pratiquée{total > 1 ? "s" : ""}
              <InfoTooltip text={VOLUME_TOOLTIP} />
            </p>
          </div>
          {successRate != null && (
            <div className="flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-600">
              Score moyen : {successRate}%
            </div>
          )}
        </div>

        {delta != null && (
          <div className="flex items-center gap-2 mb-6 text-xs font-bold text-zinc-500">
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

        <Button
          onClick={() => router.push("/tef-irn/writing")}
          variant="outline"
          className="h-12 w-full rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
        >
          Continuer à l'écrit <ArrowRight size={16} />
        </Button>
      </CardContent>
    </Card>
  );
}
