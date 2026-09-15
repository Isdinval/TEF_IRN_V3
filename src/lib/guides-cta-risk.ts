// Detecte le motif exact du bug corrige le 2026-09-14 : un CTA decrit une fonctionnalite
// verrouillee (src/lib/entitlements.ts) comme gratuite/sans engagement. A l'epoque, 45 guides
// publies affirmaient a tort "Coach IA Oral gratuitement/sans engagement" via un template de CTA
// reutilise partout - corrige a la main, mais rien n'empechait qu'un futur guide (ou une future
// regeneration via un skill) reintroduise la meme erreur silencieusement. Cette detection
// cherche la co-occurrence, dans un meme paragraphe, d'une reference a une fonctionnalite
// verrouillee ET d'un mot laissant croire qu'elle est gratuite.

export interface PaidFeatureSignal {
  code: string;
  label: string;
  referencePatterns: RegExp[];
}

const FREE_CLAIM_PATTERNS: RegExp[] = [
  /\bgratuit(e|s|es)?\b/i,
  /\bgratuitement\b/i,
  /\bsans engagement\b/i,
  /\bsans abonnement\b/i,
  /\bessai gratuit\b/i,
  /\bacc[eè]s gratuit\b/i,
  /\b0\s?€/i,
  /\boffert(e|s|es)?\b/i,
];

// Fonctionnalites verrouillees en base (entitlements.ts) avec une page/un lien identifiable dans
// le contenu. hasExamWritingCorrection n'est volontairement pas inclus : verrou contextuel
// (examen blanc uniquement), pas de page dediee a reperer par motif texte - hors scope ici.
const PAID_FEATURE_SIGNALS: PaidFeatureSignal[] = [
  {
    code: "oral_coach",
    label: "Coach IA Oral (jamais gratuit, entitlements.hasOralCoach)",
    referencePatterns: [/\/tef-irn\/oral\b/i, /coach\s+ia\s+oral/i],
  },
];

export interface CtaRiskFinding {
  featureCode: string;
  featureLabel: string;
  excerpt: string;
}

function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Paragraphe par paragraphe, cherche la co-occurrence d'une reference a une fonctionnalite
 * verrouillee ET d'un mot laissant croire qu'elle est gratuite. */
export function detectCtaRisk(content: string | null): CtaRiskFinding[] {
  if (!content) return [];
  const findings: CtaRiskFinding[] = [];
  for (const paragraph of splitParagraphs(content)) {
    if (!FREE_CLAIM_PATTERNS.some((p) => p.test(paragraph))) continue;
    for (const signal of PAID_FEATURE_SIGNALS) {
      if (signal.referencePatterns.some((p) => p.test(paragraph))) {
        findings.push({
          featureCode: signal.code,
          featureLabel: signal.label,
          excerpt: paragraph.length > 220 ? paragraph.slice(0, 220) + "…" : paragraph,
        });
      }
    }
  }
  return findings;
}
