"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface Overview {
  lessons: { total: number };
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

interface SiteContext {
  sitemapPaths: string[];
  robotsTxt: string;
}

/** Charge sitemap.xml et robots.txt une seule fois (réutilisé par l'audit global). */
async function loadSiteContext(): Promise<SiteContext> {
  const [sitemapRes, robotsRes] = await Promise.all([fetch("/sitemap.xml"), fetch("/robots.txt")]);
  const sitemapDoc = new DOMParser().parseFromString(await sitemapRes.text(), "application/xml");
  const sitemapPaths = Array.from(sitemapDoc.querySelectorAll("url > loc")).map((el) => toPathname(el.textContent || ""));
  return { sitemapPaths, robotsTxt: await robotsRes.text() };
}

async function inspectPath(path: string, ctx?: SiteContext): Promise<InspectionResult> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const { sitemapPaths, robotsTxt } = ctx ?? (await loadSiteContext());

  // credentials: "omit" = vue d'un crawler anonyme (sans session admin ni redirections de leçons verrouillées)
  const pageRes = await fetch(normalizedPath, { credentials: "omit" });
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

  const inSitemap = sitemapPaths.includes(toPathname(normalizedPath));
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

const DESCRIPTION_MIN = 70;
const DESCRIPTION_MAX = 160;
const TITLE_MIN = 20;

/** Anomalies d'une page du sitemap : champs manquants, puis qualité des valeurs. */
function getIssues(r: InspectionResult): string[] {
  const issues: string[] = [];
  if (r.error) return [`erreur : ${r.error}`];
  if (r.httpStatus !== 200) issues.push(`HTTP ${r.httpStatus}`);
  if (!r.title) issues.push("title");
  if (!r.metaDescription) issues.push("meta description");
  if (!r.canonical) issues.push("canonical");
  if (!r.ogTitle) issues.push("og:title");
  if (!r.ogDescription) issues.push("og:description");
  if (!r.ogImage) issues.push("og:image");
  if (r.jsonLd.length === 0) issues.push("JSON-LD");
  if (r.jsonLd.some((j) => j.type.startsWith("invalide"))) issues.push("JSON-LD invalide");
  if (r.visibleTextLength < 200) issues.push("contenu SSR < 200 car.");
  if (!r.robots.allowed) issues.push("bloquée par robots.txt");
  if (r.metaRobots && /noindex/i.test(r.metaRobots)) issues.push("noindex (mais dans le sitemap)");

  // Qualité des valeurs présentes
  if (r.title && r.title.length < TITLE_MIN) issues.push(`title trop court (${r.title.length} car.)`);
  if (r.metaDescription && r.metaDescription.length < DESCRIPTION_MIN) {
    issues.push(`description trop courte (${r.metaDescription.length} car., min ${DESCRIPTION_MIN})`);
  }
  if (r.metaDescription && r.metaDescription.length > DESCRIPTION_MAX) {
    issues.push(`description trop longue (${r.metaDescription.length} car., max ${DESCRIPTION_MAX})`);
  }
  if (r.canonical && toPathname(r.canonical) !== toPathname(r.path)) issues.push("canonical ≠ URL de la page");
  if (r.ogImage && !/^https?:\/\//i.test(r.ogImage)) issues.push("og:image non absolue");
  return issues;
}

function csvCell(v: string | number): string {
  return `"${String(v).replace(/"/g, '""')}"`;
}

interface PublishedSlugs {
  tefIrn: string[];
  civic: string[];
}

/** Contrôle permanent : tout guide publié doit figurer dans le sitemap. */
function SitemapGuidesCheck({ publishedSlugs }: { publishedSlugs: PublishedSlugs }) {
  const [sitemapPaths, setSitemapPaths] = useState<string[] | null>(null);

  useEffect(() => {
    loadSiteContext()
      .then((ctx) => setSitemapPaths(ctx.sitemapPaths))
      .catch(() => setSitemapPaths([]));
  }, []);

  if (!sitemapPaths) return <p className="text-xs text-zinc-400">Contrôle des guides dans le sitemap…</p>;

  const rows = [
    { label: "Guides TEF IRN", prefix: "/tef-irn/guides/", slugs: publishedSlugs.tefIrn },
    { label: "Guides examen civique", prefix: "/examen-civique/guides/", slugs: publishedSlugs.civic },
  ].map((r) => {
    const inSitemap = new Set(sitemapPaths.filter((p) => p.startsWith(r.prefix)).map((p) => p.slice(r.prefix.length)));
    return { ...r, missing: r.slugs.filter((slug) => !inSitemap.has(slug)) };
  });

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Guides publiés présents dans le sitemap</p>
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-center gap-2 text-sm">
            {r.missing.length === 0 ? (
              <CheckCircle2 className="text-emerald-500" size={16} />
            ) : (
              <XCircle className="text-rose-500" size={16} />
            )}
            <span className="font-bold text-zinc-800">
              {r.label} : {r.slugs.length - r.missing.length} / {r.slugs.length}
            </span>
          </div>
          {r.missing.length > 0 && (
            <p className="text-[11px] text-rose-500 font-bold ml-6 break-all">Manquants : {r.missing.join(", ")}</p>
          )}
        </div>
      ))}
    </div>
  );
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

function SitemapAudit() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [rows, setRows] = useState<{ result: InspectionResult; issues: string[] }[]>([]);
  const [onlyIssues, setOnlyIssues] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runAudit = async () => {
    setRunning(true);
    setError(null);
    setRows([]);
    try {
      const ctx = await loadSiteContext();
      const paths = Array.from(new Set(ctx.sitemapPaths));
      setProgress({ done: 0, total: paths.length });
      const out: { result: InspectionResult; issues: string[] }[] = [];
      let next = 0;
      const worker = async () => {
        while (next < paths.length) {
          const path = paths[next++];
          let result: InspectionResult;
          try {
            result = await inspectPath(path, ctx);
          } catch (err: any) {
            result = {
              path, httpStatus: 0, title: null, metaDescription: null, canonical: null, metaRobots: null,
              ogTitle: null, ogDescription: null, ogImage: null, jsonLd: [], visibleTextLength: 0,
              inSitemap: true, robots: { allowed: true, matchedRule: null }, error: err?.message || "fetch échoué",
            };
          }
          out.push({ result, issues: getIssues(result) });
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      };
      await Promise.all(Array.from({ length: 4 }, worker));
      // Doublons : un même title ou une même description sur plusieurs pages.
      const countBy = (pick: (r: InspectionResult) => string | null) => {
        const counts = new Map<string, number>();
        out.forEach(({ result }) => {
          const v = pick(result);
          if (v) counts.set(v, (counts.get(v) || 0) + 1);
        });
        return counts;
      };
      const titles = countBy((r) => r.title);
      const descriptions = countBy((r) => r.metaDescription);
      out.forEach((row) => {
        if (row.result.title && (titles.get(row.result.title) || 0) > 1) row.issues.push("title en doublon");
        if (row.result.metaDescription && (descriptions.get(row.result.metaDescription) || 0) > 1) {
          row.issues.push("description en doublon");
        }
      });
      out.sort((a, b) => b.issues.length - a.issues.length || a.result.path.localeCompare(b.result.path));
      setRows(out);
    } catch (err: any) {
      setError(err?.message || "Erreur pendant l'audit.");
    } finally {
      setRunning(false);
    }
  };

  const exportCsv = () => {
    const header = ["path", "http", "title", "meta_description", "canonical", "og_title", "og_description", "og_image", "json_ld", "ssr_chars", "anomalies"];
    const lines = rows.map(({ result: r, issues }) =>
      [r.path, r.httpStatus, r.title ?? "", r.metaDescription ?? "", r.canonical ?? "", r.ogTitle ?? "", r.ogDescription ?? "", r.ogImage ?? "", r.jsonLd.map((j) => j.type).join("|"), r.visibleTextLength, issues.join("; ")]
        .map(csvCell)
        .join(","),
    );
    const blob = new Blob(["\uFEFF" + [header.map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "audit-sitemap.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const withIssues = rows.filter((r) => r.issues.length > 0).length;
  const shown = onlyIssues ? rows.filter((r) => r.issues.length > 0) : rows;

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Audit global du sitemap</h2>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={runAudit}
          disabled={running}
          className="h-11 px-5 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {running ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
          {running ? `Audit… ${progress.done} / ${progress.total}` : "Auditer toutes les pages du sitemap"}
        </button>
        {rows.length > 0 && (
          <>
            <button onClick={exportCsv} className="h-11 px-5 rounded-xl border border-zinc-200 bg-white text-zinc-700 font-black text-sm">
              Exporter en CSV
            </button>
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-500">
              <input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} />
              Anomalies uniquement
            </label>
          </>
        )}
      </div>
      <p className="text-[11px] text-zinc-400">
        Contrôles : champs présents, puis description de {DESCRIPTION_MIN} à {DESCRIPTION_MAX} caractères, canonical égale à
        l'URL, og:image absolue, pas de doublon de title ni de description. La longueur des titles n'est pas contrôlée
        (Google les tronque selon leur largeur en pixels).
      </p>
      {error && <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm font-bold">{error}</div>}
      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 p-4 space-y-2">
          <p className="text-sm font-bold text-zinc-800">
            {rows.length - withIssues} page(s) complètes sur {rows.length} — {withIssues} avec anomalie(s).
          </p>
          <ul className="divide-y divide-zinc-50">
            {shown.map(({ result, issues }) => (
              <li key={result.path} className="py-2">
                <div className="flex items-center gap-2">
                  {issues.length === 0 ? (
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={14} />
                  ) : (
                    <XCircle className="text-rose-500 shrink-0" size={14} />
                  )}
                  <span className="font-mono text-xs text-zinc-800 break-all">{result.path}</span>
                </div>
                {issues.length > 0 && <p className="text-[11px] text-rose-500 font-bold ml-6">Manque : {issues.join(", ")}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function SitemapDebugClient({
  overview,
  queryErrors,
  publishedSlugs,
}: {
  overview: Overview;
  queryErrors: string[];
  publishedSlugs: PublishedSlugs;
}) {
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

        {queryErrors.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
            <p className="text-xs font-black text-rose-700 uppercase tracking-widest">
              ⚠️ Erreur(s) sur la vue d'ensemble — les chiffres ci-dessous peuvent être faux
            </p>
            {queryErrors.map((err, i) => (
              <p key={i} className="text-xs text-rose-600 font-mono">{err}</p>
            ))}
          </div>
        )}

        {/* Vue d'ensemble */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Vue d'ensemble</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Leçons TEF IRN" total={overview.lessons.total} />
            <StatCard label="Guides TEF IRN" total={overview.tefIrnGuides.total} published={overview.tefIrnGuides.published} />
            <StatCard label="Guides examen civique" total={overview.civicGuides.total} published={overview.civicGuides.published} />
            <StatCard label="Questions examen civique" total={overview.civicQuestions.total} published={overview.civicQuestions.published} />
            <StatCard label="Parcours" total={overview.parcours.total} />
          </div>
          <SitemapGuidesCheck publishedSlugs={publishedSlugs} />
        </section>

        <SitemapAudit />

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
            Le fetch se fait en anonyme (sans cookie), comme un crawler. Pour valider un rendu
            enrichi, utilisez aussi le{" "}
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
