"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "./InfoTooltip";
import { cn } from "@/lib/utils";

interface HeatmapDay {
  date: string;
  minutes: number;
}

interface RegularityHeatmapCardProps {
  days: HeatmapDay[] | null | undefined;
}

// Seuils d'intensité arbitraires (assumption posée faute de référence
// produit existante) -- à ajuster si besoin, purement visuel, aucun impact
// sur une autre card.
function intensityClass(minutes: number): string {
  if (minutes <= 0) return "bg-zinc-100";
  if (minutes < 15) return "bg-emerald-200";
  if (minutes < 30) return "bg-emerald-400";
  return "bg-emerald-600";
}

// Découpage séquentiel en semaines de 7 jours en partant du jour le plus
// ancien -- pas d'alignement calendaire réel sur les lundis (assumption :
// le projet n'a aucune lib de dates, on reste simple plutôt que d'en
// ajouter une pour un alignement parfait).
function toWeeks(days: HeatmapDay[]): HeatmapDay[][] {
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function RegularityHeatmapCard({ days }: RegularityHeatmapCardProps) {
  if (!days || days.length === 0) return null;

  const activeDaysCount = days.filter((d) => d.minutes > 0).length;
  const weeks = toWeeks(days);

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black uppercase tracking-tight text-zinc-700 flex items-center gap-2">
            <Badge className="bg-orange-500 text-white rounded-full">Régularité</Badge>
            <InfoTooltip text="Vos jours d'activité sur les 12 dernières semaines. La régularité compte plus que le volume : mieux vaut 15 minutes chaque jour qu'une longue session isolée." />
          </h3>
          <span className="text-xs font-black text-zinc-400">{activeDaysCount}/{days.length} jours actifs</span>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  title={`${new Date(day.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} — ${day.minutes} min`}
                  className={cn("h-3 w-3 rounded-sm", intensityClass(day.minutes))}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
          Moins
          <div className="h-3 w-3 rounded-sm bg-zinc-100" />
          <div className="h-3 w-3 rounded-sm bg-emerald-200" />
          <div className="h-3 w-3 rounded-sm bg-emerald-400" />
          <div className="h-3 w-3 rounded-sm bg-emerald-600" />
          Plus
        </div>
      </CardContent>
    </Card>
  );
}
