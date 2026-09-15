import { siteUrl } from "@/lib/site";
import type { GuideProduct } from "@/types/guides";

// Parse le champ `content` (markdown) d'un guide pour en extraire les liens sortants,
// classés en 3 catégories :
// - guide->guide (lien interne vers /<product>/guides/<slug>)
// - guide->produit (lien interne vers une autre page de l'app, ex. /tef-irn/entrainement)
// - guide->externe (tout le reste : domaine tiers)
//
// Il n'existe aucune table de liaison en base (voir migration 20260729000008_guides_product_and_silo_role.sql
// qui n'ajoute que `silo_role`/`product`, pas de relation) : le seul graphe de liens réel est celui
// écrit en clair dans `content`, rendu par ReactMarkdown côté public (GuideContent.tsx). Ce module
// recalcule donc le graphe à la volée à partir du contenu déjà chargé, sans nouvelle colonne ni job de sync.

const GUIDE_PATH_PATTERN = /^\/(tef-irn|examen-civique)\/guides\/([a-z0-9-]+)\/?$/;

export interface GuideLinkRef {
  product: GuideProduct;
  slug: string;
}

export interface GuideExternalLinkRef {
  url: string;
  domain: string;
}

export interface GuideLinkSummary {
  /** Liens internes vers d'autres guides (hub/pilier/satellite). */
  guideLinks: GuideLinkRef[];
  /** Liens internes vers une page produit (entrainement, examen blanc, éligibilité...), pas un guide. */
  productLinks: string[];
  /** Liens externes (domaine tiers). */
  externalLinks: GuideExternalLinkRef[];
}

/** Extrait les URLs brutes des liens markdown `[texte](url)` d'un contenu. Ignore les liens en style référence. */
export function extractMarkdownLinkUrls(content: string | null | undefined): string[] {
  if (!content) return [];
  const urls: string[] = [];
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(content)) !== null) {
    // Ignore un éventuel titre `"..."` accolé à l'URL : on ne garde que le premier token non-espace.
    const rawUrl = match[1].trim().split(/\s+/)[0];
    if (rawUrl) urls.push(rawUrl);
  }
  return urls;
}

function normalizeDomain(hostname: string): string {
  return hostname.replace(/^www\./, "").toLowerCase();
}

function stripSiteOrigin(rawUrl: string): string | null {
  if (rawUrl.startsWith("/")) return rawUrl;
  if (rawUrl.startsWith(siteUrl)) {
    const rest = rawUrl.slice(siteUrl.length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return null;
}

/** Classe une URL brute (issue d'un lien markdown) en lien guide / lien produit interne / lien externe. */
export function classifyGuideLinkUrl(
  rawUrl: string
): { kind: "guide"; ref: GuideLinkRef } | { kind: "product"; path: string } | { kind: "external"; ref: GuideExternalLinkRef } | { kind: "ignored" } {
  const trimmed = rawUrl.trim();

  // Ancres et mailto : ni un guide, ni un produit, ni vraiment un lien externe exploitable.
  if (trimmed.startsWith("#") || trimmed.startsWith("mailto:") || trimmed === "") {
    return { kind: "ignored" };
  }

  const internalPath = stripSiteOrigin(trimmed);
  if (internalPath !== null) {
    const guideMatch = internalPath.match(GUIDE_PATH_PATTERN);
    if (guideMatch) {
      return { kind: "guide", ref: { product: guideMatch[1] as GuideProduct, slug: guideMatch[2] } };
    }
    return { kind: "product", path: internalPath };
  }

  try {
    const parsed = new URL(trimmed);
    return { kind: "external", ref: { url: trimmed, domain: normalizeDomain(parsed.hostname) } };
  } catch {
    // URL relative non préfixée par "/" (rare dans ce contenu) : on l'ignore plutôt que de la
    // classer à tort comme externe.
    return { kind: "ignored" };
  }
}

/** Résume tous les liens sortants d'un guide à partir de son `content` brut. Dédoublonne chaque catégorie. */
export function summarizeGuideLinks(content: string | null | undefined): GuideLinkSummary {
  const summary: GuideLinkSummary = { guideLinks: [], productLinks: [], externalLinks: [] };

  const seenGuides = new Set<string>();
  const seenProducts = new Set<string>();
  const seenExternal = new Set<string>();

  for (const rawUrl of extractMarkdownLinkUrls(content)) {
    const classified = classifyGuideLinkUrl(rawUrl);
    if (classified.kind === "guide") {
      const key = `${classified.ref.product}/${classified.ref.slug}`;
      if (!seenGuides.has(key)) {
        seenGuides.add(key);
        summary.guideLinks.push(classified.ref);
      }
    } else if (classified.kind === "product") {
      if (!seenProducts.has(classified.path)) {
        seenProducts.add(classified.path);
        summary.productLinks.push(classified.path);
      }
    } else if (classified.kind === "external") {
      if (!seenExternal.has(classified.ref.url)) {
        seenExternal.add(classified.ref.url);
        summary.externalLinks.push(classified.ref);
      }
    }
  }

  return summary;
}
