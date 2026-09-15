import { siteUrl } from "@/lib/site";
import type { GuideProduct, GuideSiloRole } from "@/types/guides";

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

// --- Item 2 : graphe complet + écarts structure voulue (silo_role) vs structure réelle (liens parsés) ---
//
// `silo_role` (hub/pilier/satellite, colonne guides) encode l'intention éditoriale, mais rien en base
// ne dit QUEL pilier est le parent d'un satellite : ça ne peut se déduire que des liens réellement
// présents dans `content`. Ce bloc croise les deux pour retrouver ce que `content-moscow-plan` liste
// aujourd'hui à la main (guides orphelins, piliers non reliés au hub, etc.).

export interface GuideForGraph {
  id: string;
  slug: string;
  product: GuideProduct;
  silo_role: GuideSiloRole;
  content: string | null;
  /** Rattachement voulu, edite dans l'admin (colonne guides.parent_guide_id, migration 20260915000001). */
  parent_guide_id?: string | null;
}

export interface ResolvedGuideLink extends GuideLinkRef {
  /** false si aucun guide de la liste fournie ne correspond à ce slug/produit (lien mort ou guide non publiée/dépubliée). */
  exists: boolean;
  siloRole?: GuideSiloRole;
}

export interface InboundGuideLink extends GuideLinkRef {
  siloRole: GuideSiloRole;
}

export interface GuideGraphNode {
  id: string;
  slug: string;
  product: GuideProduct;
  siloRole: GuideSiloRole;
  /** Rattachement voulu (parent_guide_id) - null pour le hub ou un guide non rattache. */
  parentGuideId: string | null;
  outboundGuideLinks: ResolvedGuideLink[];
  productLinks: string[];
  externalLinks: GuideExternalLinkRef[];
  inboundGuideLinks: InboundGuideLink[];
}

export type GuideGraphIssueType =
  | "orphan"
  | "satellite_without_pilier_link"
  | "pilier_without_hub_link"
  | "pilier_without_satellites"
  | "hub_without_piliers"
  | "broken_internal_link"
  | "declared_parent_not_linked";

export interface GuideGraphIssue {
  slug: string;
  product: GuideProduct;
  type: GuideGraphIssueType;
  /** Pour `broken_internal_link` : la cible `<product>/<slug>` visée par le lien mort. */
  detail?: string;
}

export interface GuideLinkGraph {
  nodes: GuideGraphNode[];
  issues: GuideGraphIssue[];
}

function guideKey(product: GuideProduct, slug: string): string {
  return `${product}/${slug}`;
}

/** Construit le graphe de maillage réel + la liste des écarts, à partir de tous les guides (typiquement les publiés). */
export function buildGuideLinkGraph(guides: GuideForGraph[]): GuideLinkGraph {
  const guideByKey = new Map<string, GuideForGraph>();
  const guideById = new Map<string, GuideForGraph>();
  for (const guide of guides) {
    guideByKey.set(guideKey(guide.product, guide.slug), guide);
    guideById.set(guide.id, guide);
  }

  // Première passe : liens sortants résolus (guide cible trouvée ou non) par guide.
  const outboundByKey = new Map<
    string,
    { summary: GuideLinkSummary; resolvedGuideLinks: ResolvedGuideLink[] }
  >();
  for (const guide of guides) {
    const summary = summarizeGuideLinks(guide.content);
    const resolvedGuideLinks: ResolvedGuideLink[] = summary.guideLinks.map((ref) => {
      const target = guideByKey.get(guideKey(ref.product, ref.slug));
      return { ...ref, exists: !!target, siloRole: target?.silo_role };
    });
    outboundByKey.set(guideKey(guide.product, guide.slug), { summary, resolvedGuideLinks });
  }

  // Deuxième passe : liens entrants, déduits des liens sortants résolus qui existent réellement.
  const inboundByKey = new Map<string, InboundGuideLink[]>();
  for (const guide of guides) {
    const key = guideKey(guide.product, guide.slug);
    const { resolvedGuideLinks } = outboundByKey.get(key)!;
    for (const link of resolvedGuideLinks) {
      if (!link.exists) continue;
      const targetKey = guideKey(link.product, link.slug);
      const bucket = inboundByKey.get(targetKey) ?? [];
      bucket.push({ product: guide.product, slug: guide.slug, siloRole: guide.silo_role });
      inboundByKey.set(targetKey, bucket);
    }
  }

  const nodes: GuideGraphNode[] = guides.map((guide) => {
    const key = guideKey(guide.product, guide.slug);
    const { summary, resolvedGuideLinks } = outboundByKey.get(key)!;
    return {
      id: guide.id,
      slug: guide.slug,
      product: guide.product,
      siloRole: guide.silo_role,
      parentGuideId: guide.parent_guide_id ?? null,
      outboundGuideLinks: resolvedGuideLinks,
      productLinks: summary.productLinks,
      externalLinks: summary.externalLinks,
      inboundGuideLinks: inboundByKey.get(key) ?? [],
    };
  });

  const issues: GuideGraphIssue[] = [];
  for (const node of nodes) {
    // Lien(s) mort(s) : cible absente de la liste fournie (typo, guide dépubliée/supprimée).
    for (const link of node.outboundGuideLinks) {
      if (!link.exists) {
        issues.push({
          slug: node.slug,
          product: node.product,
          type: "broken_internal_link",
          detail: guideKey(link.product, link.slug),
        });
      }
    }

    if (node.siloRole !== "hub" && node.inboundGuideLinks.length === 0) {
      issues.push({ slug: node.slug, product: node.product, type: "orphan" });
    }

    if (node.siloRole === "satellite") {
      const linkedFromAbove = node.inboundGuideLinks.some(
        (l) => l.siloRole === "pilier" || l.siloRole === "hub"
      );
      if (!linkedFromAbove) {
        issues.push({ slug: node.slug, product: node.product, type: "satellite_without_pilier_link" });
      }
    }

    if (node.siloRole === "pilier") {
      const connectedToHub =
        node.outboundGuideLinks.some((l) => l.exists && l.siloRole === "hub") ||
        node.inboundGuideLinks.some((l) => l.siloRole === "hub");
      if (!connectedToHub) {
        issues.push({ slug: node.slug, product: node.product, type: "pilier_without_hub_link" });
      }

      const hasSatelliteBelow = node.outboundGuideLinks.some((l) => l.exists && l.siloRole === "satellite");
      if (!hasSatelliteBelow) {
        issues.push({ slug: node.slug, product: node.product, type: "pilier_without_satellites" });
      }
    }

    if (node.siloRole === "hub") {
      const hasPilierBelow = node.outboundGuideLinks.some((l) => l.exists && l.siloRole === "pilier");
      if (!hasPilierBelow) {
        issues.push({ slug: node.slug, product: node.product, type: "hub_without_piliers" });
      }
    }

    // Rattachement voulu (parent_guide_id) vs liens reels : le cas le plus actionnable, plus
    // precis que orphan/satellite_without_pilier_link/pilier_without_hub_link qui acceptent
    // n'importe quel pilier/hub - ici on verifie le lien vers LE parent explicitement declare.
    if (node.parentGuideId) {
      const parentGuide = guideById.get(node.parentGuideId);
      if (parentGuide) {
        const parentKey = guideKey(parentGuide.product, parentGuide.slug);
        const linkedToDeclaredParent =
          node.outboundGuideLinks.some((l) => l.exists && guideKey(l.product, l.slug) === parentKey) ||
          node.inboundGuideLinks.some((l) => guideKey(l.product, l.slug) === parentKey);
        if (!linkedToDeclaredParent) {
          issues.push({
            slug: node.slug,
            product: node.product,
            type: "declared_parent_not_linked",
            detail: parentKey,
          });
        }
      }
    }
  }

  return { nodes, issues };
}
