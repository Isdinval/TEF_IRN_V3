"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "./InfoTooltip";
import { cn } from "@/lib/utils";

interface ExamReadinessCardProps {
  lessonsRemaining: number | null;
  lessonsPerWeek: number | null;
  targetExamDate: string | null;
  goalLevel: string | null;
}

const READINESS_TOOLTIP =
  "Estimation basée sur le nombre de leçons qu'il vous reste jusqu'à votre niveau visé, et sur votre rythme des 4 dernières semaines. Purement indicatif : accélérez ou ralentissez et la projection s'ajustera.";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export function ExamReadinessCard({ lessonsRemaining, lessonsPerWeek, targetExamDate, goalLevel }: ExamReadinessCardProps) {
  const router = useRouter();

  if (lessonsRemaining == null) return null;

  // Pas de date d'examen renseignée : ExamCountdownCard (en haut de page)
  // porte déjà le formulaire de saisie -- pas de duplication ici, on
  // redirige juste l'attention vers lui.
  if (!targetExamDate) {
    return (
      <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
        <CardContent className="p-8 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
            <CalendarCheck2 size={14} /> Cap examen
          </h3>
          <p className="text-sm font-bold text-zinc-400">
            Renseignez votre date d'examen (en haut de page) pour activer cette projection.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (lessonsRemaining === 0) {
    return (
      <Card className="overflow-hidden border-none bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-xl shadow-emerald-100/50 rounded-[2.5rem]">
        <CardContent className="p-8 flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-lg font-black text-zinc-900 tracking-tight">
              Parcours terminé jusqu'au niveau {goalLevel || "visé"} !
            </p>
            <p className="text-xs font-bold text-zinc-500 mt-1">Il ne vous reste plus qu'à passer un examen blanc pour vérifier votre niveau.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPace = lessonsPerWeek != null && lessonsPerWeek > 0;
  const weeksNeeded = hasPace ? Math.ceil(lessonsRemaining / (lessonsPerWeek as number)) : null;
  const projectedDate = weeksNeeded != null ? addDays(new Date(), weeksNeeded * 7) : null;
  const examDate = new Date(targetExamDate);
  const onTrack = projectedDate != null ? projectedDate.getTime() <= examDate.getTime() : null;

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
            <CalendarCheck2 size={14} /> Cap examen
            <InfoTooltip text={READINESS_TOOLTIP} />
          </h3>
        </div>

        <p className="text-sm font-bold text-zinc-500">
          Il vous reste <span className="text-zinc-900 font-black">{lessonsRemaining} leçon{lessonsRemaining > 1 ? "s" : ""}</span> jusqu'au niveau {goalLevel || "visé"}.
        </p>

        {!hasPace ? (
          <p className="text-xs font-medium text-zinc-400 italic">
            Pas encore assez d'activité récente pour estimer une date -- reprenez une leçon pour activer la projection.
          </p>
        ) : (
          <div className={cn(
            "rounded-2xl px-4 py-3 text-sm font-bold",
            onTrack ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          )}>
            {onTrack
              ? `À ce rythme (${lessonsPerWeek}/sem.), vous serez prêt vers le ${formatDate(projectedDate as Date)} -- avant votre examen.`
              : `À ce rythme (${lessonsPerWeek}/sem.), vous seriez prêt vers le ${formatDate(projectedDate as Date)} -- après votre examen. Un petit coup d'accélérateur aiderait.`}
          </div>
        )}

        <Button
          onClick={() => router.push("/tef-irn/parcours")}
          variant="outline"
          className="h-12 w-full rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
        >
          Continuer le parcours <ArrowRight size={16} />
        </Button>
      </CardContent>
    </Card>
  );
}
