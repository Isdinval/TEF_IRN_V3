"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { buildGuideLinkGraph, type GuideForGraph } from "@/lib/guides-link-graph";
import type { GuideProduct, GuideSiloRole } from "@/types/guides";

// Onglet "Liens externes" de l'admin des guides : verifie le statut HTTP des URLs externes
// citees dans le contenu des guides publies (sources officielles, comparatifs concurrents...).
// A la demande uniquement (bouton) : ce sont de vraies requetes reseau vers des sites tiers, pas
// un calcul instantane comme les autres onglets - inutile de le refaire a chaque visite. Verifie
// cote serveur (src/app/api/admin/check-external-links/route.ts) pour eviter le CORS, par lots
// pour rester sous la limite de duree d'une fonction Vercel.

interface GuideRowForLinkRot {
  id: string;
  slug: string;
  title: string;
  product: GuideProduct;
  silo_role: GuideSiloRole;
  content: string | null;
  is_published: boolean;
}

interface ExternalLinkEntry {
  url: string;
  domain: string;
  referencedBy: { slug: string; title: string; product: GuideProduct }[];
}

interface CheckResult {
  ok: boolean;
  status: number | null;
  error: string | null;
}

const CHUNK_SIZE = 20;

export default function GuidesLinkRotView() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GuideRowForLinkRot[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(0);
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [productFilter, setProductFilter] = useState<"Tous" | GuideProduct>("Tous");
  const [search, setSearch] = useState("");
  const [onlyErrors, setOnlyErrors] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("guides")
      .select("id, slug, title, product, silo_role, content, is_published")
      .eq("is_published", true)
      .then(({ data, error }: { data: GuideRowForLinkRot[] | null; error: { message: string } | null }) => {
        if (!active) return;
        if (error) setErrorMsg(error.message);
        else setRows(data || []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  const externalLinks: ExternalLinkEntry[] = useMemo(() => {
    const forGraph: GuideForGraph[] = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      product: r.product,
      silo_role: r.silo_role,
      content: r.content,
    }));
    const { nodes } = buildGuideLinkGraph(forGraph);
    const byUrl = new Map<string, ExternalLinkEntry>();
    for (const node of nodes) {
      const row = rows.find((r) => r.id === node.id);
      if (!row) continue;
      for (const link of node.externalLinks) {
        const entry = byUrl.get(link.url) ?? { url: link.url, domain: link.domain, referencedBy: [] };
        entry.referencedBy.push({ slug: node.slug, title: row.title, product: node.product });
        byUrl.set(link.url, entry);
      }
    }
    return [...byUrl.values()].sort((a, b) => a.domain.localeCompare(b.domain));
  }, [rows]);

  const filteredLinks = useMemo(() => {
    const term = search.trim().toLowerCase();
    return externalLinks
      .filter((e) => productFilter === "Tous" || e.referencedBy.some((g) => g.product === productFilter))
      .filter((e) => !term || e.url.toLowerCase().includes(term) || e.domain.toLowerCase().includes(term))
      .filter((e) => !onlyErrors || (results[e.url] && !results[e.url].ok));
  }, [externalLinks, productFilter, search, onlyErrors, results]);

  const runCheck = async () => {
    setChecking(true);
    setChecked(0);
    const nextResults: Record<string, CheckResult> = {};
    const urls = externalLinks.map((e) => e.url);
    for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
      const chunk = urls.slice(i, i + CHUNK_SIZE);
      try {
        const res = await fetch("/api/admin/check-external-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: chunk }),
        });
        const data = await res.json();
        if (Array.isArray(data.results)) {
          for (const r of data.results as { url: string; ok: boolean; status: number | null; error: string | null }[]) {
            nextResults[r.url] = { ok: r.ok, status: r.status, error: r.error };
          }
        }
      } catch {
        for (const url of chunk) nextResults[url] = { ok: false, status: null, error: "Requête échouée" };
      }
      setChecked(i + chunk.length);
      setResults({ ...nextResults });
    }
    setChecking(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-400">
        <Loader2 className="animate-spin mr-2" size={20} /> Chargement des guides...
      </div>
    );
  }
  if (errorMsg) {
    return <p className="text-red-600 text-sm p-6">{errorMsg}</p>;
  }

  const brokenCount = Object.values(results).filter((r) => !r.ok).length;
  const checkedCount = Object.keys(results).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-white rounded-2xl border border-zinc-200 p-4">
        <button
          onClick={runCheck}
          disabled={checking || externalLinks.length === 0}
          className="h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-black flex items-center gap-2 disabled:opacity-40"
        >
          {checking ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          {checking ? `Vérification... (${checked}/${externalLinks.length})` : "Lancer la vérification"}
        </button>
        <p className="text-xs text-zinc-400">
          {externalLinks.length} URL{externalLinks.length > 1 ? "s" : ""} externe{externalLinks.length > 1 ? "s" : ""}{" "}
          citée{externalLinks.length > 1 ? "s" : ""} dans les guides publiés.
          {checkedCount > 0 && !checking && (
            <>
              {" "}
              {checkedCount} vérifiée{checkedCount > 1 ? "s" : ""}, {brokenCount} en erreur.
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value as "Tous" | GuideProduct)}
          className="h-9 px-3 rounded-xl border border-zinc-200 text-xs font-bold"
        >
          <option value="Tous">Tous les produits</option>
          <option value="tef-irn">TEF IRN</option>
          <option value="examen-civique">Examen civique</option>
        </select>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par domaine ou URL..."
          className="h-9 max-w-xs text-xs"
        />
        <label className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
          <input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} />
          Afficher seulement les erreurs
        </label>
      </div>

      <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
        ⚠️ 403 et « fetch failed » ne sont pas des preuves fiables de lien mort — beaucoup de sites bloquent les
        requêtes automatisées sans navigateur alors qu&apos;un humain voit la page normalement. Vérifie
        manuellement avant de remplacer un lien sur ce seul signal. 404 et 500+ persistants sont plus fiables.
      </p>

      <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm divide-y divide-zinc-50">
        {filteredLinks.length === 0 && <p className="p-8 text-center text-zinc-400">Aucun lien externe ne correspond.</p>}
        {filteredLinks.map((entry) => {
          const result = results[entry.url];
          return (
            <div key={entry.url} className="p-4 flex items-center gap-4">
              <span
                className={`shrink-0 w-16 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                  !result
                    ? "bg-zinc-100 text-zinc-400"
                    : result.ok
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                }`}
              >
                {!result ? "—" : result.status ?? "✕"}
              </span>
              <div className="min-w-0 flex-1">
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1 truncate"
                >
                  {entry.url} <ExternalLink size={12} className="shrink-0" />
                </a>
                <p className="text-xs text-zinc-400 truncate">
                  cité par : {entry.referencedBy.map((g) => g.slug).join(", ")}
                </p>
                {result?.error && <p className="text-xs text-red-500">{result.error}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
