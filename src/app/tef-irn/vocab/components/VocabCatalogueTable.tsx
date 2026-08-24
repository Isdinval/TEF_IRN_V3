"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

export type VocabStatus = "new" | "learning" | "mastered";

interface VocabItem {
  id: string;
  word: string;
  definition: string;
  category: string;
  status: VocabStatus;
}

// Même convention que STATUS_CONFIG dans CivicCatalogue.tsx (Examen Civique),
// pour garder un langage de statut cohérent entre les 2 verticales LlamaKusi.
const STATUS_CONFIG: Record<VocabStatus, { label: string; className: string }> = {
  new: { label: "Pas appris", className: "bg-zinc-100 text-zinc-500" },
  learning: { label: "En cours", className: "bg-amber-50 text-amber-600" },
  mastered: { label: "Appris", className: "bg-emerald-50 text-emerald-600" },
};

interface VocabCatalogueTableProps {
  /** Mots d'une seule thématique — le regroupement par catégorie et l'accordéon
   * qui l'affiche vivent dans page.tsx, ce composant ne rend que la grille. */
  items: VocabItem[];
}

export default function VocabCatalogueTable({ items }: VocabCatalogueTableProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/tef-irn/vocab/${item.id}`}
          className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors group rounded-2xl border border-zinc-50"
        >
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-zinc-900 group-hover:text-emerald-600 transition-colors truncate">
              {item.word}
            </h4>
            <p className="text-xs text-zinc-400 font-medium line-clamp-1 mt-0.5">
              {item.definition}
            </p>
          </div>
          <Badge className={`shrink-0 border-none rounded-full px-3 py-1 text-[9px] font-black uppercase ${STATUS_CONFIG[item.status].className}`}>
            {STATUS_CONFIG[item.status].label}
          </Badge>
          <ChevronRight size={16} className="shrink-0 text-zinc-300 group-hover:text-emerald-600 transition-colors" />
        </Link>
      ))}
    </div>
  );
}
