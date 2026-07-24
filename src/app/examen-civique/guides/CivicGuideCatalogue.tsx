"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCivicContext } from "@/components/features/examen-civique/useCivicContext";
import { CIVIC_GENERAL_GUIDE_CATEGORY, guideCategoryForMention } from "@/lib/civic-guide-categories";
import { MENTIONS } from "@/lib/civic-constants";
import { ExerciseLayout } from "@/components/shared/ExerciseLayout";
import { ArrowUpRight, Clock, Loader2 } from "lucide-react";
import type { Guide } from "@/types/guides";

const FILTERS = [{ value: "all", label: "Tous" }, ...MENTIONS.map((m) => ({ value: m.value, label: m.label }))];

function CivicGuideCatalogueContent({ guides }: { guides: Guide[] }) {
  const router = useRouter();
  const { mention } = useCivicContext();
  const [activeFilter, setActiveFilter] = useState<string>(mention || "all");

  const filteredGuides = useMemo(() => {
    if (activeFilter === "all") return guides;
    const wantedCategory = guideCategoryForMention(activeFilter);
    return guides.filter((g) => g.category === CIVIC_GENERAL_GUIDE_CATEGORY || g.category === wantedCategory);
  }, [guides, activeFilter]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-4xl mx-auto px-6 py-8 lg:px-10">
        <ExerciseLayout
          variant="compact"
          title="Guides examen civique"
          badge={`${guides.length} guide${guides.length > 1 ? "s" : ""}`}
          badgeColor="indigo"
          onBack={() => router.push("/examen-civique")}
        />

        <div className="flex flex-wrap gap-1.5 mt-6 mb-6">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-3 h-7 rounded-xl font-black text-[10px] transition-all ${activeFilter === f.value ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredGuides.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-[2.5rem] text-zinc-400 font-bold text-sm">
            Aucun guide pour ce filtre pour l'instant.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredGuides.map((g) => (
              <Link
                key={g.slug}
                href={`/examen-civique/guides/${g.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 hover:border-indigo-200 hover:shadow-md transition-all block group"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-zinc-900 leading-tight">{g.title}</p>
                  <ArrowUpRight size={14} className="text-zinc-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
                </div>
                {g.description && <p className="text-xs text-zinc-500 font-medium mt-1.5 line-clamp-3 leading-relaxed">{g.description}</p>}
                {g.reading_time && (
                  <p className="text-[10px] font-bold text-zinc-400 mt-3 flex items-center gap-1">
                    <Clock size={10} /> {g.reading_time} min de lecture
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CivicGuideCatalogue({ guides }: { guides: Guide[] }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-zinc-50"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>
      <CivicGuideCatalogueContent guides={guides} />
    </Suspense>
  );
}
