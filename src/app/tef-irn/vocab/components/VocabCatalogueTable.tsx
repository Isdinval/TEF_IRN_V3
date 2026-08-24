"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

export type VocabStatus = "new" | "learning" | "mastered";

// Même convention que STATUS_CONFIG dans CivicCatalogue.tsx (Examen Civique),
// pour garder un langage de statut cohérent entre les 2 verticales LlamaKusi.
const STATUS_CONFIG: Record<VocabStatus, { label: string; className: string }> = {
  new: { label: "Pas appris", className: "bg-zinc-100 text-zinc-500" },
  learning: { label: "En cours", className: "bg-amber-50 text-amber-600" },
  mastered: { label: "Appris", className: "bg-emerald-50 text-emerald-600" },
};

interface VocabCatalogueTableProps {
  items: {
    id: string;
    word: string;
    definition: string;
    category: string;
    status: VocabStatus;
  }[];
}

export default function VocabCatalogueTable({ items }: VocabCatalogueTableProps) {
  return (
    <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50 overflow-hidden">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/tef-irn/vocab/${item.id}`}
          className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-black text-zinc-900 group-hover:text-emerald-600 transition-colors truncate">
                {item.word}
              </h4>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300 shrink-0">
                {item.category}
              </span>
            </div>
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
