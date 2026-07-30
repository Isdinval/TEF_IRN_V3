"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Languages, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "./InfoTooltip";

interface VocabStatsCardProps {
  total: number;
  levels: { A1: number; A2: number; B1: number; B2: number };
  topLevel: string;
}

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-400",
  A2: "bg-emerald-600",
  B1: "bg-indigo-500",
  B2: "bg-violet-600",
};

export function VocabStatsCard({ total, levels, topLevel }: VocabStatsCardProps) {
  const router = useRouter();

  if (!total || total === 0) return null;

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
              <Languages size={14} /> Vocabulaire
            </h3>
            <p className="flex items-center gap-2 text-xl font-black text-zinc-900 tracking-tight">
              {total} mots maîtrisés
              <InfoTooltip text="Un mot est « maîtrisé » après plusieurs révisions consécutives réussies en répétition espacée (SRS). Le niveau associé est celui du mot en base, pas votre propre niveau." />
            </p>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
            Niveau {topLevel}
          </div>
        </div>

        <div className="space-y-3">
          {(["A1", "A2", "B1", "B2"] as const).map((lvl) => {
            const count = levels?.[lvl] || 0;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={lvl} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-zinc-500">
                  <span>{lvl}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full ${LEVEL_COLORS[lvl]} transition-all duration-1000`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => router.push("/tef-irn/vocab")}
          variant="outline"
          className="mt-6 h-12 w-full rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
        >
          Continuer le vocabulaire <ArrowRight size={16} />
        </Button>
      </CardContent>
    </Card>
  );
}
