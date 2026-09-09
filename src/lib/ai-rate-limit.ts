import { createAdminClient } from "@/lib/supabase-admin";
import { normalizeTier, type SubscriptionTier } from "@/lib/entitlements";

export type AiRoute = "coach_chat" | "writing_correct" | "oral_analyze" | "oral_session";

// Audit sécurité item 7 (2026-08) : seul endroit à modifier pour ajuster les
// quotas. Chiffres de départ volontairement conservateurs pour le plan
// Gratuit, choisis sans donnée d'usage réel -- à recalibrer une fois qu'on a
// du recul (item séparé du chantier abonnements, voir growth tracking).
// "premium"/"super_premium" sont un plafond anti-abus (script, bug, compte
// compromis), pas une vraie limite -- settings/page.tsx promet "Accès
// illimité à l'IA" pour ces paliers.
//
// Chantier abonnements, item 5 (2026-09) : passage de 2 paliers (free/
// premium) aux 4 paliers réels. Essentiel et Super Premium récupèrent
// exactement les mêmes chiffres que Premium pour coach_chat/writing_correct
// (les 3 paliers payants promettent un accès "illimité" à l'écrit, sans
// nuance entre eux sur la pricing page) -- aucun des 6 chiffres d'origine
// n'a été recalculé, seulement reporté sur les bonnes colonnes.
//
// oral_analyze/oral_session : Essentiel garde le seuil le plus bas
// (techniquement sans effet, le verrou dur de entitlements.ts bloque déjà
// Essentiel en amont -- 403 avant même d'atteindre ce quota -- gardé
// cohérent plutôt qu'à 0, en filet de sécurité si ce verrou changeait).
// Premium et Super Premium partagent le même plafond d'APPELS : ce compteur
// ne mesure pas la durée des sessions, donc il ne peut pas refléter
// fidèlement la vraie différence commerciale (40 vs 75 min/jour, voir
// entitlements.ts `oralDailyMinutes`). Un vrai quota en minutes est un
// chantier séparé (item 10) -- pas approximé ici par un chiffre d'appels
// arbitraire, pour ne pas donner une fausse impression de précision.
const DAILY_LIMITS: Record<AiRoute, Record<SubscriptionTier, number>> = {
  // coach_chat.gratuit = 0 : le Coach IA n'est pas inclus dans le plan
  // Gratuit (voir landing /tef-irn/pricing). Le vrai verrou est un 403
  // explicite dans api/coach/chat/route.ts avant même d'atteindre ce quota
  // -- 0 ici est une seconde ligne de défense, pas le mécanisme principal.
  coach_chat: { gratuit: 0, essentiel: 300, premium: 300, super_premium: 300 },
  writing_correct: { gratuit: 3, essentiel: 100, premium: 100, super_premium: 100 },
  oral_analyze: { gratuit: 3, essentiel: 3, premium: 100, super_premium: 100 },
  oral_session: { gratuit: 2, essentiel: 2, premium: 50, super_premium: 50 },
};

export interface AiRateLimitResult {
  allowed: boolean;
  limit: number;
}

/**
 * Vérifie et incrémente (atomique côté Postgres, voir
 * check_and_increment_ai_usage) le quota IA quotidien de l'utilisateur pour
 * une route donnée, avant d'appeler OpenAI.
 */
export async function checkAiRateLimit(
  userId: string,
  route: AiRoute,
  subscriptionTier: string | null | undefined
): Promise<AiRateLimitResult> {
  const limit = DAILY_LIMITS[route][normalizeTier(subscriptionTier)];

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("check_and_increment_ai_usage", {
    p_user_id: userId,
    p_route: route,
    p_limit: limit,
  });

  if (error) {
    // Best-effort : un souci technique sur cette table annexe ne doit pas
    // bloquer tout le monde -- on laisse passer plutôt que de casser une
    // fonctionnalité principale à cause du garde-fou lui-même.
    console.error(`AI rate limit check failed for ${route}:`, error);
    return { allowed: true, limit };
  }

  return { allowed: data === true, limit };
}
