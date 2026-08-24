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

function VocabRow({ item }: { item: VocabItem }) {
  return (
    <Link
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
  );
}

interface VocabCatalogueTableProps {
  /** Groupes déjà paginés (2 catégories/page) et dans l'ordre VOCAB_CATEGORIES. */
  groups: { category: string; items: VocabItem[] }[];
  /** false quand une seule catégorie est sélectionnée : l'en-tête de groupe
   * est alors redondante avec le résumé "Niveau X • Catégorie" au-dessus. */
  showCategoryHeaders: boolean;
}

export default function VocabCatalogueTable({ groups, showCategoryHeaders }: VocabCatalogueTableProps) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.category}>
          {showCategoryHeaders && (
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900">{group.category}</h3>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {group.items.length} mot{group.items.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {group.items.map((item) => (
              <VocabRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
