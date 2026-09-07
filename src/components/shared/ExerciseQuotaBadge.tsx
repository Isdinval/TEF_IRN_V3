"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseQuotaBadgeProps {
  done: number;
  required: number;
  /** Nom affiché après le compteur, ex. "exercices", "QCM", "chasse aux erreurs". */
  label?: string;
  className?: string;
}

/**
 * Badge de progression "X/N réalisés" du quota d'exercices d'une leçon en
 * mode académique -- même rendu visuel que lessons/[slug]/complete/page.tsx
 * (Bloc D, item 4), désormais partagé avec practice/[id] et grammar-check/[id]
 * pour que le quota reste visible peu importe la page d'où l'exercice a été
 * lancé (catalogue de la leçon ou boutons de la TopBar).
 *
 * `required === 0` : leçon sans exercice qcm/trous (ex. leçon Vocabulaire) --
 * rien à afficher, le quota ne s'applique pas.
 */
export function ExerciseQuotaBadge({ done, required, label = "exercices", className }: ExerciseQuotaBadgeProps) {
  if (required === 0) return null;

  const isComplete = done >= required;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: required }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2.5 w-14 rounded-full transition-colors",
              i < done ? (isComplete ? "bg-emerald-500" : "bg-amber-500") : "bg-zinc-100"
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-xs font-black uppercase tracking-widest flex items-center gap-1",
          isComplete ? "text-emerald-600" : "text-amber-500"
        )}
      >
        {isComplete && <CheckCircle2 size={12} />}
        {done}/{required} {label} {isComplete ? "complétés" : "réalisés"}
      </p>
    </div>
  );
}
