"use client";

import { useState } from "react";
import { Target, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExerciseContextHeaderProps {
  category?: string;
  level?: string;
  difficulty?: string;
  tags?: string[];
  instructions?: string;
  pointCle?: string | null;
  accentColor?: "indigo" | "purple";
}

const difficultyColors: Record<string, string> = {
  facile: "bg-emerald-100 text-emerald-700",
  moyen: "bg-amber-100 text-amber-700",
  difficile: "bg-rose-100 text-rose-700",
};

const accentClasses: Record<"indigo" | "purple", string> = {
  indigo: "bg-indigo-600 text-white",
  purple: "bg-purple-600 text-white",
};

const POINT_CLE_TRUNCATE_LENGTH = 100;

/**
 * Bandeau de contexte pédagogique affiché en tête d'un exercice en cours
 * (grammar-check "training" / practice "practice") : catégorie, niveau,
 * difficulté, tags, instructions et point clé de la leçon associée.
 */
export function ExerciseContextHeader({
  category,
  level,
  difficulty,
  tags,
  instructions,
  pointCle,
  accentColor = "indigo",
}: ExerciseContextHeaderProps) {
  const [pointCleExpanded, setPointCleExpanded] = useState(false);
  const hasMeta = category || level || difficulty || (tags && tags.length > 0);
  if (!hasMeta && !instructions && !pointCle) return null;

  const pointCleIsLong = !!pointCle && pointCle.length > POINT_CLE_TRUNCATE_LENGTH;
  const pointCleDisplay =
    pointCleIsLong && !pointCleExpanded
      ? `${pointCle!.slice(0, POINT_CLE_TRUNCATE_LENGTH).trimEnd()}…`
      : pointCle;

  return (
    <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm px-5 py-4 space-y-2">
      {hasMeta && (
        <div className="flex flex-wrap items-center gap-2">
          {level && (
            <Badge className={cn("rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none", accentClasses[accentColor])}>
              {level}
            </Badge>
          )}
          {category && (
            <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
              {category}
            </Badge>
          )}
          {difficulty && (
            <Badge className={cn("rounded-full px-3 py-0.5 text-[9px] font-black uppercase tracking-widest border-none", difficultyColors[difficulty] || difficultyColors.facile)}>
              {difficulty}
            </Badge>
          )}
        </div>
      )}

      {instructions && (
        <p className="text-sm font-bold text-zinc-700 leading-snug">{instructions}</p>
      )}

      {pointCle && (
        <div className="text-xs text-zinc-500 italic flex items-start gap-1.5">
          <Target size={13} className="mt-0.5 shrink-0 text-zinc-400" />
          <span>
            {pointCleDisplay}
            {pointCleIsLong && (
              <button
                type="button"
                onClick={() => setPointCleExpanded((v) => !v)}
                className="not-italic inline-flex items-center gap-0.5 ml-1.5 text-zinc-400 hover:text-zinc-700 font-bold uppercase tracking-wide text-[9px] align-middle"
              >
                {pointCleExpanded ? (
                  <>Voir moins <ChevronUp size={11} /></>
                ) : (
                  <>Voir plus <ChevronDown size={11} /></>
                )}
              </button>
            )}
          </span>
        </div>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {tags.map((tag) => (
            <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md capitalize">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
