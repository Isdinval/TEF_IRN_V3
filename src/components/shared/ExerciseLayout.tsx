"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

interface ExerciseLayoutProps {
  /** Début du titre (ou titre complet déjà mis en forme). Saisi normalement : la casse est gérée par le style. */
  title: React.ReactNode;
  /** Fin du titre en indigo (variante full uniquement). */
  highlight?: string;
  badge: string;
  description?: string;
  variant?: "full" | "compact";
  onBack?: () => void;
  children?: React.ReactNode;
  rightElement?: React.ReactNode;
}

// Variante "full" = en-tête de page : délègue à PageHeader (design system §5), à l'identique des autres pages.
// Variante "compact" = barre d'en-tête collante pendant un exercice.
export function ExerciseLayout({
  title,
  highlight,
  badge,
  description,
  variant = "full",
  onBack,
  children,
  rightElement,
}: ExerciseLayoutProps) {
  if (variant === "compact") {
    return (
      <header className="bg-white border-b border-zinc-100 px-6 py-3 lg:px-12 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Retour"
                className="w-11 h-11 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all group"
              >
                <ChevronLeft size={20} aria-hidden className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <Badge className="rounded-full border-none bg-indigo-600 px-2 py-0 text-xs font-black uppercase tracking-widest text-white">
                  {badge}
                </Badge>
              </div>
              <h1 className="text-lg font-black text-zinc-900 uppercase tracking-tight">
                {title}
              </h1>
            </div>
          </div>
          {rightElement && <div>{rightElement}</div>}
        </div>
      </header>
    );
  }

  return (
    <div className="w-full">
      <section className="mb-8 flex flex-col gap-8">
        <PageHeader badge={badge} title={title} highlight={highlight} description={description} aside={rightElement} />
        {children}
      </section>
    </div>
  );
}
