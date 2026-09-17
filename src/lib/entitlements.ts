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
 *   même endpoint sans ce paramètre) est plafonnée séparément à 1 essai
 *   À VIE pour Gratuit via profiles.free_ee_correction_used (validé avec
 *   Olivier, voir migration 20260909000002) -- le quota quotidien de
 *   ai-rate-limit.ts (writing_correct) ne s'applique donc jamais en
 *   pratique à ce palier, le verrou à vie intervient avant.
 * - oralDailyMinutes : quota réel en minutes (item 10, 2026-09), vérifié par
 *   /api/oral/session (refuse un nouveau token si le quota du jour est déjà
 *   atteint) et alimenté par /api/oral/analyze (durée déclarée par le
 *   client, cumulée dans ai_usage_daily.seconds_used -- voir la migration
 *   20260909000003_oral_seconds_tracking.sql pour le détail et les
 *   limites de cette approche).
 */

export type SubscriptionTier = "gratuit" | "essentiel" | "premium" | "super_premium";

/**
 * Libellé affichable de chaque palier, à utiliser partout où l'UI montre le
 * nom du palier (Sidebar, Settings...) -- évite que chaque composant décide
 * lui-même comment nommer un palier (source du bug "Pro"/"Free" qui écrasait
 * les 4 vrais paliers en 2 mots génériques).
 */
export const TIER_LABELS: Record<SubscriptionTier, string> = {
  gratuit: "Gratuit",
  essentiel: "Essentiel",
  premium: "Premium",
  super_premium: "Super Premium",
};

/**
 * Liste complète (pas en delta) des droits de chaque palier, reprise des
 * bullets de la pricing page (Pricing.tsx) -- utilisée par
 * Settings > Abonnement pour afficher les VRAIS droits du palier de
 * l'utilisateur, au lieu d'une liste binaire "Gratuit vs Premium" inventée
 * qui promettait par exemple le coach oral à un abonné Essentiel qui n'y a
 * pas accès (chantier abonnements, item 4, 2026-09).
 */
export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  gratuit: [
    "Test de positionnement A1 → B2",
    "1 correction d'Expression Écrite (à vie)",
    "Accès libre aux fiches de vocabulaire",
    "3 exercices par jour (vocabulaire, QCM, chasse aux erreurs)",
    "Entraînement Examen Civique illimité",
  ],
  essentiel: [
    "Coach Expression Écrite illimité",
    "Compréhension Écrite & Orale : parcours adaptatif A1 → B2",
    "Tableau de bord de progression complet",
    "Simulateur d'examen complet",
    "Entraînement Examen Civique illimité",
  ],
  premium: [
    "Coach Expression Écrite illimité",
    "Compréhension Écrite & Orale : parcours adaptatif A1 → B2",
    "Tableau de bord de progression complet",
    "Simulateur d'examen complet",
    "Coach Expression Orale : 40 min / jour",
    "Entraînement Examen Civique illimité",
  ],
  super_premium: [
    "Coach Expression Écrite illimité",
    "Compréhension Écrite & Orale : parcours adaptatif A1 → B2",
    "Tableau de bord de progression complet",
    "Simulateur d'examen complet",
    "Coach Expression Orale : 75 min / jour",
    "Entraînement Examen Civique illimité",
  ],
};

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
