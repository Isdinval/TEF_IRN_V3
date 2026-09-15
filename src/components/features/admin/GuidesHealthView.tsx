"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { buildGuideLinkGraph, type GuideForGraph, type GuideGraphIssue } from "@/lib/guides-link-graph";
import {
  computeGuideHealth,
  HEALTH_SCORE_LEGEND,
  type GuideHealthInput,
  type GuideHealthResult,
  type HealthCategory,
} from "@/lib/guides-health-score";
import type { GuideProduct, GuideSiloRole } from "@/types/guides";

// Onglet "Santé" de l'admin des guides : un score 0-100 par guide (complétude editoriale +
// fraîcheur + écarts de maillage deja detectes dans l'onglet Graphe), trie du pire au meilleur
// pour prioriser sans avoir a relire chaque guide a la main.

interface GuideRowForHealth extends GuideHealthInput {
  silo_role: GuideSiloRole;
  parent_guide_id: string | null;
  is_published: boolean;
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-50 text-emerald-700";
  if (score >= 50) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

const CATEGORY_LABELS: Record<HealthCategory, string> = {
  maillage: "Maillage (rejoint l'onglet Graphe)",
  complétude: "Complétude éditoriale",
  fraîcheur: "Fraîcheur",
};

function ScoreLegend() {
  const [open, setOpen] = useState(false);
  const categories: HealthCategory[] = ["maillage", "complétude", "fraîcheur"];
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 text-sm font-black text-zinc-600"
      >
        <span>Comment le score est calculé (part de 100, points déduits)</span>
        <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-black uppercase text-zinc-400 mb-1.5">{CATEGORY_LABELS[cat]}</p>
              <div className="space-y-1">
                {HEALTH_SCORE_LEGEND.filter((e) => e.category === cat).map((entry) => (
                  <div key={entry.code} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600">{entry.label}</span>
                    <span className="font-bold text-red-600 shrink-0 ml-3">-{entry.points}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-zinc-400 pt-1 border-t border-zinc-100">
            Les points cumulés sont plafonnés à 100 (score minimum : 0). Ces poids sont des choix qualitatifs,
            pas mesurés — à ajuster si un signal compte trop ou pas assez à l&apos;usage.
          </p>
        </div>
      )}
    </div>
  );
}

export default function GuidesHealthView() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GuideRowForHealth[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [productFilter, setProductFilter] = useState<"Tous" | GuideProduct>("Tous");
  const [search, setSearch] = useState("");
  const [showUnpublished, setShowUnpublished] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("guides")
      .select(
        "id, slug, title, product, silo_role, parent_guide_id, content, image_url, key_points, mot_cle_principal, reading_time, updated_at, is_published"
      )
      .then(({ data, error }: { data: GuideRowForHealth[] | null; error: { message: string } | null }) => {
        if (!active) return;
        if (error) setErrorMsg(error.message);
        else setRows(data || []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  const linkIssuesByGuideKey = useMemo(() => {
    const forGraph: GuideForGraph[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      product: r.product,
      silo_role: r.silo_role,
      content: r.content,
      parent_guide_id: r.parent_guide_id,
    }));
    const { issues } = buildGuideLinkGraph(forGraph);
    const map = new Map<string, GuideGraphIssue[]>();
    for (const issue of issues) {
      const key = `${issue.product}/${issue.slug}`;
      const bucket = map.get(key) ?? [];
      bucket.push(issue);
      map.set(key, bucket);
    }
    return map;
  }, [rows]);

  const results: (GuideHealthResult & { siloRole: GuideSiloRole; isPublished: boolean })[] = useMemo(() => {
    const now = new Date();
    return rows.map((r) => {
      const linkIssues = linkIssuesByGuideKey.get(`${r.product}/${r.slug}`) ?? [];
      const health = computeGuideHealth(r, linkIssues, now);
      return { ...health, siloRole: r.silo_role, isPublished: r.is_published };
    });
  }, [rows, linkIssuesByGuideKey]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return results
      .filter((r) => productFilter === "Tous" || r.product === productFilter)
      .filter((r) => showUnpublished || r.isPublished)
      .filter((r) => !term || r.title.toLowerCase().includes(term) || r.slug.toLowerCase().includes(term))
      .sort((a, b) => a.score - b.score);
  }, [results, productFilter, search, showUnpublished]);

  const avgScore = useMemo(
    () => (filtered.length === 0 ? 0 : Math.round(filtered.reduce((s, r) => s + r.score, 0) / filtered.length)),
    [filtered]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Calcul des scores...
      </div>
    );
  }
  if (errorMsg) {
    return <p className="text-red-600 text-sm p-6">{errorMsg}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value as "Tous" | GuideProduct)}
          className="h-10 px-3 rounded-xl border border-zinc-200 text-sm font-bold"
        >
          <option value="Tous">Tous les produits</option>
          <option value="tef-irn">TEF IRN</option>
          <option value="examen-civique">Examen civique</option>
        </select>
        <Input
          placeholder="Rechercher un titre ou un slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm font-bold text-zinc-500">
          <input type="checkbox" checked={showUnpublished} onChange={(e) => setShowUnpublished(e.target.checked)} />
          Inclure les brouillons
        </label>
        <span className={`ml-auto text-xs px-3 py-1.5 rounded-full font-black ${scoreColor(avgScore)}`}>
          Score moyen : {avgScore}/100 sur {filtered.length} guide{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      <ScoreLegend />

      <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
        {filtered.length === 0 && <p className="p-8 text-center text-zinc-400">Aucun guide ne correspond.</p>}
        {filtered.map((r) => (
          <div key={r.id} className="p-4 flex items-center gap-4">
            <span className={`shrink-0 w-14 h-10 rounded-xl flex items-center justify-center font-black text-sm ${scoreColor(r.score)}`}>
              {r.score}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-black text-sm truncate">
                {r.title} {!r.isPublished && <span className="text-amber-600 text-xs font-bold">(brouillon)</span>}
              </p>
              <p className="text-xs text-zinc-400 truncate">
                {r.product} · {r.siloRole} · {r.slug}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 max-w-md justify-end">
              {r.issues.length === 0 ? (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">Aucun écart</span>
              ) : (
                r.issues.map((issue, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-zinc-100 text-zinc-500" title={issue.label}>
                    -{issue.points}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
