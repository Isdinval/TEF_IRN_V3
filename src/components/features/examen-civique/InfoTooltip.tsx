"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// Icône (i) discrète à poser à côté d'un titre/métrique ambiguë pour l'expliquer.
// Copie du composant identique utilisé côté dashboard TEF IRN
// (src/components/features/dashboard/new/InfoTooltip.tsx) -- même comportement,
// dupliqué ici pour ne pas faire dépendre ce module d'un import cross-feature.
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
