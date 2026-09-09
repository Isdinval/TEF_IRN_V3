/**
 * Source de vérité unique pour "qui a accès à quoi" selon le palier
 * d'abonnement (voir src/components/landing/sections/Pricing.tsx pour la
 * matrice commerciale affichée aux utilisateurs).
 *
 * Objectif : remplacer les comparaisons `subscription_tier !== 'gratuit'`
 * dupliquées dans chaque route/composant par un seul endroit à modifier
 * quand un droit change de palier.
 *
 * Périmètre actuel (chantier "fondations abonnements", 2026-09) :
 * - hasOralCoach : verrou dur, identique en pratique libre (page /oral) et
 *   dans l'examen blanc (section EO), car les deux passent par les mêmes
 *   routes /api/oral/session et /api/oral/analyze.
 * - hasExamWritingCorrection : verrou dur, mais UNIQUEMENT dans le contexte
 *   "examen blanc" de /api/writing/correct (paramètre `context: 'exam'`
 *   envoyé par ExamContext.tsx). La pratique libre EE (page /writing,
 *   même endpoint sans ce paramètre) n'est PAS concernée par ce chantier :
 *   elle reste sur son quota existant (voir ai-rate-limit.ts, écart connu
 *   avec la pricing page déjà documenté séparément, hors scope ici).
 * - oralDailyMinutes : fondation pour un futur quota en minutes (40 vs 75
 *   min/jour promis par la pricing page). Pas encore branché nulle part :
 *   ai-rate-limit.ts compte des appels, pas des minutes. À exploiter dans
 *   un item dédié.
 */

export type SubscriptionTier = "gratuit" | "essentiel" | "premium" | "super_premium";

export interface Entitlements {
  hasOralCoach: boolean;
  hasExamWritingCorrection: boolean;
  oralDailyMinutes: number;
}

const ENTITLEMENTS: Record<SubscriptionTier, Entitlements> = {
  gratuit: { hasOralCoach: false, hasExamWritingCorrection: false, oralDailyMinutes: 0 },
  essentiel: { hasOralCoach: false, hasExamWritingCorrection: true, oralDailyMinutes: 0 },
  premium: { hasOralCoach: true, hasExamWritingCorrection: true, oralDailyMinutes: 40 },
  super_premium: { hasOralCoach: true, hasExamWritingCorrection: true, oralDailyMinutes: 75 },
};

const VALID_TIERS = new Set<string>(Object.keys(ENTITLEMENTS));

/**
 * Normalise n'importe quelle valeur en un palier valide. Tout ce qui n'est
 * pas reconnu (null, undefined, valeur corrompue) retombe sur 'gratuit' --
 * échec fermé plutôt qu'ouvert, cohérent avec le comportement déjà en place
 * dans coach/chat/route.ts (`!profile?.subscription_tier || ...`).
 * Exportée pour être réutilisée par tout autre module ayant besoin de la
 * même règle de repli (ex. ai-rate-limit.ts), au lieu de la dupliquer.
 */
export function normalizeTier(tier: string | null | undefined): SubscriptionTier {
  if (tier && VALID_TIERS.has(tier)) {
    return tier as SubscriptionTier;
  }
  return "gratuit";
}

/** Retourne les droits du palier donné (voir normalizeTier pour la règle de repli). */
export function getEntitlements(tier: string | null | undefined): Entitlements {
  return ENTITLEMENTS[normalizeTier(tier)];
}
