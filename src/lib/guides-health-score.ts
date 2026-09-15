import type { GuideGraphIssue, GuideGraphIssueType } from "@/lib/guides-link-graph";
import { detectCtaRisk } from "@/lib/guides-cta-risk";
import type { GuideProduct } from "@/types/guides";

// Score de sante par guide (0-100, part de 100 et deduit des points). Trois familles de
// signaux, toutes calculables sans rien connecter de nouveau (pas de Search Console, pas de
// Stripe) :
// - Maillage : ecarts deja detectes par buildGuideLinkGraph (src/lib/guides-link-graph.ts).
// - Completude editoriale : champs vides qui degradent le rendu public ou le SEO.
// - Fraicheur : updated_at ancien.
//
// Les poids ci-dessous sont des choix qualitatifs (pas mesures), assumes comme tels - a
// ajuster si Olivier constate qu'un signal compte trop ou pas assez a l'usage.

const LINK_ISSUE_POINTS: Record<GuideGraphIssueType, number> = {
  orphan: 20,
  broken_internal_link: 15,
  declared_parent_not_linked: 12,
  satellite_without_pilier_link: 10,
  pilier_without_hub_link: 10,
  pilier_without_satellites: 10,
  hub_without_piliers: 10,
};

const LINK_ISSUE_LABELS: Record<GuideGraphIssueType, string> = {
  orphan: "Orphelin (aucun lien entrant)",
  broken_internal_link: "Lien interne mort",
  declared_parent_not_linked: "Rattaché en base mais pas linké dans le contenu",
  satellite_without_pilier_link: "Aucun lien depuis un pilier/hub",
  pilier_without_hub_link: "Pas de lien avec le hub",
  pilier_without_satellites: "Aucun satellite en aval",
  hub_without_piliers: "Aucun pilier en aval",
};

const MIN_WORD_COUNT = 150;
const STALE_DAYS_WARNING = 180;
const STALE_DAYS_SEVERE = 365;

const COMPLETENESS_POINTS = {
  missingImage: 5,
  missingKeyPoints: 5,
  missingMotCle: 5,
  missingReadingTime: 3,
  contentTooShort: 15,
} as const;

const FRESHNESS_POINTS = {
  staleWarning: 5,
  staleSevere: 10,
} as const;

const CTA_RISK_POINTS = 25;

export type HealthCategory = "maillage" | "complétude" | "fraîcheur" | "cta à risque";

export interface HealthLegendEntry {
  code: string;
  label: string;
  points: number;
  category: HealthCategory;
}

// Source unique pour le barème (utilisée par computeGuideHealth ci-dessous ET par la légende
// affichée dans l'onglet Santé) : si les poids changent un jour, la légende reste juste sans
// édition manuelle a faire a deux endroits.
export const HEALTH_SCORE_LEGEND: HealthLegendEntry[] = [
  ...(Object.keys(LINK_ISSUE_POINTS) as GuideGraphIssueType[]).map((type) => ({
    code: type,
    label: LINK_ISSUE_LABELS[type],
    points: LINK_ISSUE_POINTS[type],
    category: "maillage" as const,
  })),
  { code: "missing_image", label: "Pas d'image", points: COMPLETENESS_POINTS.missingImage, category: "complétude" },
  {
    code: "missing_key_points",
    label: "Pas de points clés",
    points: COMPLETENESS_POINTS.missingKeyPoints,
    category: "complétude",
  },
  {
    code: "missing_mot_cle",
    label: "Pas de mot-clé principal (anti-cannibalisation)",
    points: COMPLETENESS_POINTS.missingMotCle,
    category: "complétude",
  },
  {
    code: "missing_reading_time",
    label: "Pas de temps de lecture",
    points: COMPLETENESS_POINTS.missingReadingTime,
    category: "complétude",
  },
  {
    code: "content_too_short",
    label: `Contenu très court (< ${MIN_WORD_COUNT} mots)`,
    points: COMPLETENESS_POINTS.contentTooShort,
    category: "complétude",
  },
  {
    code: "stale_warning",
    label: `Pas mis à jour depuis plus de ${Math.round(STALE_DAYS_WARNING / 30)} mois`,
    points: FRESHNESS_POINTS.staleWarning,
    category: "fraîcheur",
  },
  {
    code: "stale_severe",
    label: `Pas mis à jour depuis plus de ${Math.round(STALE_DAYS_SEVERE / 30)} mois (cumulatif avec le seuil 6 mois)`,
    points: FRESHNESS_POINTS.staleSevere,
    category: "fraîcheur",
  },
  {
    code: "cta_risk",
    label: "Fonctionnalité payante décrite comme gratuite dans un CTA (ex. Coach IA Oral)",
    points: CTA_RISK_POINTS,
    category: "cta à risque",
  },
];

export interface GuideHealthInput {
  id: string;
  slug: string;
  title: string;
  product: GuideProduct;
  image_url: string | null;
  key_points: string[] | null;
  mot_cle_principal: string | null;
  reading_time: number | null;
  content: string | null;
  updated_at: string;
}

export interface GuideHealthIssue {
  code: string;
  label: string;
  points: number;
}

export interface GuideHealthResult {
  id: string;
  slug: string;
  title: string;
  product: GuideProduct;
  score: number;
  issues: GuideHealthIssue[];
}

function wordCount(content: string | null): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function daysSince(dateIso: string, now: Date): number {
  const then = new Date(dateIso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.floor((now.getTime() - then) / (1000 * 60 * 60 * 24));
}

/** Calcule le score de sante d'un guide. `linkIssuesForGuide` = sous-ensemble de
 * buildGuideLinkGraph(...).issues deja filtre sur ce guide (par slug+product). */
export function computeGuideHealth(
  guide: GuideHealthInput,
  linkIssuesForGuide: GuideGraphIssue[],
  now: Date = new Date()
): GuideHealthResult {
  const issues: GuideHealthIssue[] = [];

  for (const linkIssue of linkIssuesForGuide) {
    issues.push({
      code: linkIssue.type,
      label: LINK_ISSUE_LABELS[linkIssue.type] + (linkIssue.detail ? ` (${linkIssue.detail})` : ""),
      points: LINK_ISSUE_POINTS[linkIssue.type],
    });
  }

  if (!guide.image_url) issues.push({ code: "missing_image", label: "Pas d'image", points: COMPLETENESS_POINTS.missingImage });
  if (!guide.key_points || guide.key_points.length === 0)
    issues.push({ code: "missing_key_points", label: "Pas de points clés", points: COMPLETENESS_POINTS.missingKeyPoints });
  if (!guide.mot_cle_principal)
    issues.push({
      code: "missing_mot_cle",
      label: "Pas de mot-clé principal (anti-cannibalisation)",
      points: COMPLETENESS_POINTS.missingMotCle,
    });
  if (!guide.reading_time)
    issues.push({ code: "missing_reading_time", label: "Pas de temps de lecture", points: COMPLETENESS_POINTS.missingReadingTime });

  const words = wordCount(guide.content);
  if (words < MIN_WORD_COUNT) {
    issues.push({
      code: "content_too_short",
      label: `Contenu très court (${words} mots)`,
      points: COMPLETENESS_POINTS.contentTooShort,
    });
  }

  const staleDays = daysSince(guide.updated_at, now);
  if (staleDays > STALE_DAYS_SEVERE) {
    issues.push({
      code: "stale_severe",
      label: `Pas mis à jour depuis ${Math.floor(staleDays / 30)} mois`,
      points: FRESHNESS_POINTS.staleSevere,
    });
  } else if (staleDays > STALE_DAYS_WARNING) {
    issues.push({
      code: "stale_warning",
      label: `Pas mis à jour depuis ${Math.floor(staleDays / 30)} mois`,
      points: FRESHNESS_POINTS.staleWarning,
    });
  }

  for (const finding of detectCtaRisk(guide.content)) {
    issues.push({
      code: "cta_risk",
      label: `CTA à risque (${finding.featureLabel}) : « ${finding.excerpt} »`,
      points: CTA_RISK_POINTS,
    });
  }

  const score = Math.max(0, 100 - issues.reduce((sum, i) => sum + i.points, 0));

  return { id: guide.id, slug: guide.slug, title: guide.title, product: guide.product, score, issues };
}
