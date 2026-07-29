"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// Icône (i) discrète à poser à côté d'un titre de carte pour expliquer une métrique
// ambiguë (%, points, fréquence...). N'affiche jamais rien par défaut -- purement
// informatif, ne doit jamais remplacer une explication déjà visible dans la carte
// (ex: StatsOverview a déjà un sous-texte "detail", donc le tooltip complète, il ne répète pas).
export function InfoTooltip({ text, className = "" }: { text: string; className?: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          aria-label="Plus d'informations"
          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-zinc-300 transition-colors hover:text-zinc-500 ${className}`}
        >
          <Info size={13} />
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
