"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { InfoTooltip } from "./InfoTooltip";

interface CurrentLesson {
  title: string;
  slug: string;
  qcm_remaining: number;
  trous_remaining: number;
}

interface InProgressParcours {
  id: string;
  slug: string;
  level: string;
  category: string;
  progress: { percent: number; total: number; completed: number };
  current_lesson: CurrentLesson | null;
}

interface ParcoursOverviewCardProps {
  overview: { total: number; completed: number; in_progress: number; not_started: number } | null;
  inProgressParcours: InProgressParcours[];
}

const OVERVIEW_TOOLTIP =
  "Vue d'ensemble de tous les parcours du catalogue (tous niveaux confondus) : combien vous avez terminés, combien sont en cours, et combien restent à découvrir.";

export function ParcoursOverviewCard({ overview, inProgressParcours }: ParcoursOverviewCardProps) {
  const router = useRouter();

  if (!overview || overview.total === 0) return null;

  // "Restants" = pas encore terminés (en cours + jamais commencés), la
  // lecture la plus directe de la remontée initiale ("nombre de parcours
  // restant").
  const remaining = overview.in_progress + overview.not_started;

  return (
    <Card className="overflow-hidden border-none bg-white shadow-xl shadow-zinc-200/50 rounded-[2.5rem]">
      <CardContent className="p-8">
        <div className="mb-6 space-y-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500 flex items-center gap-2">
            <Compass size={14} /> Parcours
          </h3>
          <p className="flex items-center gap-2 text-xl font-black text-zinc-900 tracking-tight">
            {remaining} parcours restant{remaining > 1 ? "s" : ""} sur {overview.total}
            <InfoTooltip text={OVERVIEW_TOOLTIP} />
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-2">
          <div className="text-center p-3 rounded-2xl bg-emerald-50">
            <p className="text-lg font-black text-emerald-600">{overview.completed}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Terminés</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-violet-50">
            <p className="text-lg font-black text-violet-600">{overview.in_progress}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-violet-500">En cours</p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-zinc-50">
            <p className="text-lg font-black text-zinc-500">{overview.not_started}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">À découvrir</p>
          </div>
        </div>

        {inProgressParcours.length > 0 && (
          <div className="mt-6 space-y-3 border-t border-zinc-100 pt-6">
            {inProgressParcours.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-zinc-50 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {p.category} {p.level} — {p.progress.completed}/{p.progress.total} leçons
                  </p>
                </div>
                {p.current_lesson ? (
                  <>
                    <div className="flex items-start gap-2">
                      <BookOpen size={14} className="text-violet-500 mt-0.5 shrink-0" />
                      <p className="text-sm font-bold text-zinc-800 leading-snug line-clamp-2">
                        {p.current_lesson.title}
                      </p>
                    </div>
                    <p className="text-xs font-medium text-zinc-500">
                      {p.current_lesson.qcm_remaining + p.current_lesson.trous_remaining > 0
                        ? `${p.current_lesson.qcm_remaining} QCM et ${p.current_lesson.trous_remaining} Trous restants`
                        : "Tous les exercices débloqués sont faits, bravo !"}
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-medium text-zinc-400 italic">Toutes les leçons sont complétées.</p>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={() => router.push("/tef-irn/parcours")}
          variant="outline"
          className="mt-6 h-12 w-full rounded-2xl border-2 border-zinc-100 font-black text-sm text-zinc-600 hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
        >
          Voir tous les parcours <ArrowRight size={16} />
        </Button>
      </CardContent>
    </Card>
  );
}
