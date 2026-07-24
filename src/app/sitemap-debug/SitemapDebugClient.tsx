"use client";

import { useState } from "react";
import { Loader2, Search, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface Overview {
  lessons: { total: number; published: number };
  tefIrnGuides: { total: number; published: number };
  civicGuides: { total: number; published: number };
  civicQuestions: { total: number; published: number };
  parcours: { total: number };
}

interface JsonLdEntry {
  type: string;
  raw: any;
}

interface InspectionResult {
  path: string;
  httpStatus: number;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  metaRobots: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  jsonLd: JsonLdEntry[];
  visibleTextLength: number;
  inSitemap: boolean;
  robots: { allowed: boolean; matchedRule: string | null };
  error?: string;
}

/** Extrait le pathname d'une URL absolue ou relative, sans query/hash. */
function toPathname(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname.replace(/\/$/, "") || "/";
  } catch {
    return url;
  }
}

/** Convertit un motif robots.txt (wildcard `*` compris, où qu'il soit) en RegExp d'ancrage de début. */
function ruleToRegex(value: string): RegExp {
  const escaped = value.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}`);
}

/**
 * Parse un fichier robots.txt et détermine si `path` est autorisé pour le user-agent "*".
 * Heuristique simple (pas un parseur robots.txt complet à 100 % de la RFC 9309), mais gère
 * les wildcards `*` où qu'ils soient dans le motif — la règle correspondante la plus longue
 * l'emporte, comme le font la plupart des crawlers en pratique.
 */
function checkRobots(robotsTxt: string, path: string): { allowed: boolean; matchedRule: string | null } {
  const lines = robotsTxt.split("\n").map((l) => l.trim());
  let currentAgents: string[] = [];
  let inWildcardGroup = false;
  const rules: { type: "allow" | "disallow"; value: string }[] = [];

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (key === "user-agent") {
      currentAgents.push(value);
      inWildcardGroup = currentAgents.includes("*");
      continue;
    }
    if (key === "allow" || key === "disallow") {
      if (inWildcardGroup && value !== undefined) rules.push({ type: key, value });
      currentAgents = []; // le prochain "User-agent:" démarre un nouveau groupe
    }
  }

  const matches = rules
    .filter((r) => r.value !== "" && ruleToRegex(r.value).test(path))
    .sort((a, b) => b.value.length - a.value.length);

  if (matches.length === 0) return { allowed: true, matchedRule: null };
  const best = matches[0];
  return { allowed: best.type === "allow", matchedRule: `${best.type === "allow" ? "Allow" : "Disallow"}: ${best.value}` };
}

async function inspectPath(path: string): Promise<InspectionResult> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const [pageRes, sitemapRes, robotsRes] = await Promise.all([
    fetch(normalizedPath),
    fetch("/sitemap.xml"),
    fetch("/robots.txt"),
  ]);

  const html = await pageRes.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  const jsonLd: JsonLdEntry[] = Array.from(doc.querySelectorAll('script[type="application/ld+json"]')).map((el) => {
    try {
      const raw = JSON.parse(el.textContent || "{}");
      return { type: raw["@type"] || "?", raw };
    } catch {
      return { type: "invalide (JSON non parsable)", raw: el.textContent };
    }
  });

  const sitemapXml = await sitemapRes.text();
  const sitemapDoc = new DOMParser().parseFromString(sitemapXml, "application/xml");
  const sitemapPaths = Array.from(sitemapDoc.querySelectorAll("loc")).map((el) => toPathname(el.textContent || ""));
  const inSitemap = sitemapPaths.includes(toPathname(normalizedPath));

  const robotsTxt = await robotsRes.text();
  const robots = checkRobots(robotsTxt, normalizedPath.replace(/\/$/, "") || "/");

  return {
    path: normalizedPath,
    httpStatus: pageRes.status,
    title: doc.querySelector("title")?.textContent || null,
    metaDescription: doc.querySelector('meta[name="description"]')?.getAttribute("content") || null,
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href") || null,
    metaRobots: doc.querySelector('meta[name="robots"]')?.getAttribute("content") || null,
    ogTitle: doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || null,
    ogDescription: doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || null,
    ogImage: doc.querySelector('meta[property="og:image"]')?.getAttribute("content") || null,
    jsonLd,
    visibleTextLength: (doc.body?.textContent || "").replace(/\s+/g, " ").trim().length,
    inSitemap,
    robots,
  };
}

function StatCard({ label, total, published }: { label: string; total: number; published?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="text-2xl font-black text-zinc-900 mt-1">
        {published !== undefined ? published : total}
        {published !== undefined && <span className="text-sm text-zinc-400 font-bold"> / {total}</span>}
      </p>
      {published !== undefined && <p className="text-[10px] text-zinc-400 font-bold">publié / total</p>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="py-2 border-b border-zinc-50 last:border-none">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</p>
      <p className={`text-sm mt-0.5 ${value ? "text-zinc-800" : "text-rose-500 font-bold"}`}>{value || "— absent"}</p>
    </div>
  );
}

export function SitemapDebugClient({ overview }: { overview: Overview }) {
  const [path, setPath] = useState("/examen-civique/parcourir");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInspect = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await inspectPath(path);
      setResult(r);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'inspection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl font-black text-zinc-900">🔍 SEO/GEO Debug</h1>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            Réservé aux administrateurs — jamais indexée (robots: noindex + disallow).
          </p>
        </div>

        {/* Vue d'ensemble */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Vue d'ensemble</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Leçons TEF IRN" total={overview.lessons.total} published={overview.lessons.published} />
            <StatCard label="Guides TEF IRN" total={overview.tefIrnGuides.total} published={overview.tefIrnGuides.published} />
            <StatCard label="Guides examen civique" total={overview.civicGuides.total} published={overview.civicGuides.published} />
            <StatCard label="Questions examen civique" total={overview.civicQuestions.total} published={overview.civicQuestions.published} />
            <StatCard label="Parcours" total={overview.parcours.total} />
          </div>
        </section>

        {/* Inspecteur de page */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Inspecter une page</h2>
          <div className="flex gap-2">
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInspect()}
              placeholder="/examen-civique/parcourir"
              className="flex-1 h-11 px-4 rounded-xl border border-zinc-200 text-sm font-mono"
            />
            <button
              onClick={handleInspect}
              disabled={loading}
              className="h-11 px-5 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              Inspecter
            </button>
          </div>
          <p className="text-[11px] text-zinc-400">
            Le fetch se fait depuis votre navigateur (avec votre session actuelle) — pour un test
            100 % équivalent à un crawler anonyme, testez aussi en navigation privée ou via le{" "}
            <a href="https://search.google.com/test/rich-results" target="_blank" rel="noopener noreferrer" className="underline">
              Rich Results Test
            </a>
            .
          </p>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm font-bold">{error}</div>
          )}

          {result && (
            <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-5">
              <div className="flex items-center gap-2">
                {result.httpStatus === 200 ? (
                  <CheckCircle2 className="text-emerald-500" size={18} />
                ) : (
                  <XCircle className="text-rose-500" size={18} />
                )}
                <span className="font-mono text-sm font-bold">{result.path}</span>
                <span className="text-xs text-zinc-400 font-bold">HTTP {result.httpStatus}</span>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Meta</p>
                <Field label="Title" value={result.title} />
                <Field label="Meta description" value={result.metaDescription} />
                <Field label="Canonical" value={result.canonical} />
                <Field label="Meta robots" value={result.metaRobots} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Open Graph</p>
                <Field label="og:title" value={result.ogTitle} />
                <Field label="og:description" value={result.ogDescription} />
                <Field label="og:image" value={result.ogImage} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  JSON-LD détecté dans le HTML brut ({result.jsonLd.length})
                </p>
                {result.jsonLd.length === 0 ? (
                  <p className="text-sm text-rose-500 font-bold">Aucun — vérifier si un schema est attendu sur cette page.</p>
                ) : (
                  <div className="space-y-2">
                    {result.jsonLd.map((entry, i) => (
                      <details key={i} className="bg-zinc-50 rounded-xl p-3">
                        <summary className="text-xs font-black cursor-pointer">{entry.type}</summary>
                        <pre className="text-[10px] mt-2 overflow-auto max-h-64">{JSON.stringify(entry.raw, null, 2)}</pre>
                      </details>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Contenu SSR</p>
                <p className="text-sm text-zinc-800">
                  {result.visibleTextLength} caractères de texte dans le HTML brut (body).
                  {result.visibleTextLength < 200 && (
                    <span className="flex items-center gap-1 text-amber-600 font-bold mt-1">
                      <AlertTriangle size={14} /> Très peu de texte — le contenu dépend peut-être d'un fetch client (invisible pour les crawlers non-JS).
                    </span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Sitemap & Robots</p>
                <div className="flex items-center gap-2 text-sm">
                  {result.inSitemap ? <CheckCircle2 className="text-emerald-500" size={16} /> : <XCircle className="text-zinc-300" size={16} />}
                  <span>{result.inSitemap ? "Présente dans sitemap.xml" : "Absente de sitemap.xml"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  {result.robots.allowed ? <CheckCircle2 className="text-emerald-500" size={16} /> : <XCircle className="text-rose-500" size={16} />}
                  <span>
                    {result.robots.allowed ? "Autorisée" : "Bloquée"} par robots.txt pour user-agent *
                    {result.robots.matchedRule && ` (${result.robots.matchedRule})`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
