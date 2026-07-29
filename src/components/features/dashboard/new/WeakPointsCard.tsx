"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, ArrowRight, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "./InfoTooltip";

interface WeakPoint {
  category: string;
  sub_category: string | null;
  frequency: number;
  last_seen_at: string;
}

export function WeakPointsCard({ weakPoints }: { weakPoints: WeakPoint[] }) {
  const router = useRouter();

  if (!weakPoints || weakPoints.length === 0) return null;

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8">
        <div className="mb-6 space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
            <AlertCircle size={14} /> À travailler
          </h3>
          <p className="flex items-center gap-2 text-xl font-black text-zinc-900 tracking-tight">
            Vos points faibles
            <InfoTooltip text="Catégories où des erreurs ont été détectées le plus souvent, tous exercices et examens confondus. Le ×N compte le nombre de fois où une erreur de ce type a été relevée." />
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {weakPoints.map((wp, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl bg-rose-50/50 px-4 py-3">
              <div>
                <p className="text-sm font-black text-zinc-900 capitalize">{wp.category}</p>
                {wp.sub_category && (
                  <p className="text-xs text-zinc-500">{wp.sub_category}</p>
                )}
              </div>
              <span className="text-xs font-black text-rose-500">×{wp.frequency}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={() => {
            const details = weakPoints
              .map((wp) => `${wp.category}${wp.sub_category ? ` (${wp.sub_category})` : ""} — ${wp.frequency} erreurs`)
              .join(", ");
            const prompt = `J'ai des difficultés sur : ${details}. Peux-tu m'expliquer ces erreurs et me proposer un exercice ciblé ?`;
            router.push(`/tef-irn/coach?prompt=${encodeURIComponent(prompt)}`);
          }}
          className="h-14 w-full rounded-2xl bg-zinc-900 font-black text-sm text-white hover:bg-black transition-all flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} /> En discuter avec le Coach IA <ArrowRight size={18} />
        </Button>
      </CardContent>
    </Card>
  );
}
