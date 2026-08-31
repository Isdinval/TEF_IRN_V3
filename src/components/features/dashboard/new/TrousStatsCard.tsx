"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpellCheck, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "./InfoTooltip";

interface TrousStatsCardProps {
  total: number;
  totalAvailable: number;
  levels: { A1: number; A2: number; B1: number; B2: number };
  levelsAvailable: { A1: number; A2: number; B1: number; B2: number };
  successRate: number | null;
}

const MASTERY_TOOLTIP =
  "Un exercice à trous est marqué « maîtrisé » quand vous l'avez réussi plusieurs fois de suite. Après chaque succès, l'intervalle avant la prochaine révision s'allonge automatiquement — c'est cette répétition espacée qui ancre durablement la règle en mémoire, plutôt que de la revoir tous les jours.";

// Mêmes couleurs que VocabStatsCard/QcmStatsCard (LEVEL_COLORS) -- un niveau
// CECRL garde toujours la même couleur peu importe la verticale affichée.
const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-emerald-400",
  A2: "bg-emerald-600",
  B1: "bg-indigo-500",
  B2: "bg-violet-600",
};

export function TrousStatsCard({ total, totalAvailable, levels, levelsAvailable, successRate }: TrousStatsCardProps) {
  const router = useRouter();

  // Même convention que VocabStatsCard/QcmStatsCard : total=0 est un cas
  // normal (compte neuf ou reset) à afficher explicitement plutôt qu'à masquer.
  if (!total || total === 0) {
    return (
      <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
        <CardContent className="p-8">
          <div className="mb-6 space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
              <SpellCheck size={14} /> Trous
            </h3>
            <p className="flex items-center gap-2 text-xl font-black text-zinc-900 tracking-tight">
              0{totalAvailable > 0 ? ` / ${totalAvailable}` : ""} exercice maîtrisé
              <InfoTooltip text={MASTERY_TOOLTIP} />
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-8 text-center rounded-[2rem] border-2 border-dashed border-zinc-100">
            <SpellCheck size={40} className="text-zinc-200 mb-3" />
            <p className="text-sm font-bold text-zinc-400">Aucun exercice à trous maîtrisé pour l'instant.</p>
            <p className="text-xs text-zinc-300 mt-1">Entraînez-vous pour voir votre progression ici.</p>
          </div>

          <Button
            onClick={() => router.push("/tef-irn/grammar-check")}
            variant="outline"
            className="mt-6 h-12 w-full rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
          >
            Commencer les Trous <ArrowRight size={16} />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
              <SpellCheck size={14} /> Trous
            </h3>
            <p className="flex items-center gap-2 text-xl font-black text-zinc-900 tracking-tight">
              {total}{totalAvailable > 0 ? ` / ${totalAvailable}` : ""} exercice{total > 1 ? "s" : ""} maîtrisé{total > 1 ? "s" : ""}
              <InfoTooltip text={MASTERY_TOOLTIP} />
            </p>
          </div>
          {successRate != null && (
            <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
              Score moyen : {successRate}%
              <InfoTooltip text="Moyenne de vos scores sur les exercices à trous que vous avez terminés (sur 100)." />
            </div>
          )}
        </div>

        <div className="space-y-3">
          {(["A1", "A2", "B1", "B2"] as const).map((lvl) => {
            const count = levels?.[lvl] || 0;
            const available = levelsAvailable?.[lvl] || 0;
            const percent = available > 0 ? Math.round((count / available) * 100) : 0;
            return (
              <div key={lvl} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-zinc-500">
                  <span>{lvl}</span>
                  <span>{count}{available > 0 ? ` / ${available}` : ""}</span>
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
          onClick={() => router.push("/tef-irn/grammar-check")}
          variant="outline"
          className="mt-6 h-12 w-full rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
        >
          Continuer les Trous <ArrowRight size={16} />
        </Button>
      </CardContent>
    </Card>
  );
}
