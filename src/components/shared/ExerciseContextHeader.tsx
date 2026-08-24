"use client";

import Link from "next/link";
import { Target, ChevronRight, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExerciseContextHeaderProps {
  category?: string;
  level?: string;
  difficulty?: string;
  instructions?: string;
  pointCle?: string | null;
  /** Libellé du parcours d'origine, ex. "Grammaire A2" — 1er maillon du fil
   *  d'Ariane pédagogique affiché au-dessus des badges. */
  parcoursLabel?: string | null;
  /** Lien vers la page du parcours (/tef-irn/parcours/[slug]). Sans lien
   *  fourni, le libellé reste affiché mais non cliquable. */
  parcoursHref?: string | null;
  /** Titre de la leçon d'origine de l'exercice — 2e maillon du fil d'Ariane. */
  lessonTitle?: string | null;
  /** Lien vers la page de la leçon (/tef-irn/lessons/[slug]). Sans lien
   *  fourni, le titre reste affiché mais non cliquable. */
  lessonHref?: string | null;
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

/**
 * Bandeau de contexte pédagogique affiché en tête d'un exercice en cours
 * (grammar-check "training" / practice "practice") : fil d'Ariane
 * parcours > leçon, catégorie, niveau, difficulté, instructions et point clé
 * de la leçon associée.
 */
export function ExerciseContextHeader({
  category,
  level,
  difficulty,
  instructions,
  pointCle,
  parcoursLabel,
  parcoursHref,
  lessonTitle,
  lessonHref,
  accentColor = "indigo",
}: ExerciseContextHeaderProps) {
  const hasMeta = category || level || difficulty;
  const hasBreadcrumb = !!(parcoursLabel || lessonTitle);
  if (!hasMeta && !instructions && !pointCle && !hasBreadcrumb) return null;

  return (
    <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm px-5 py-4 space-y-2">
      {hasBreadcrumb && (
        <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          <BookOpen size={12} className="shrink-0" />
          {parcoursLabel && (
            parcoursHref ? (
              <Link href={parcoursHref} className="hover:text-zinc-700 hover:underline transition-colors">
                {parcoursLabel}
              </Link>
            ) : (
              <span>{parcoursLabel}</span>
            )
          )}
          {parcoursLabel && lessonTitle && <ChevronRight size={11} className="shrink-0 text-zinc-300" />}
          {lessonTitle && (
            lessonHref ? (
              <Link
                href={lessonHref}
                className="text-zinc-600 normal-case tracking-normal font-bold hover:text-indigo-600 hover:underline transition-colors"
              >
                {lessonTitle}
              </Link>
            ) : (
              <span className="text-zinc-600 normal-case tracking-normal font-bold">{lessonTitle}</span>
            )
          )}
        </div>
      )}

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
          <span>{pointCle}</span>
        </div>
      )}
    </div>
  );
}
