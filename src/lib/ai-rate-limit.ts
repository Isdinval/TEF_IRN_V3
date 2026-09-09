import { createAdminClient } from "@/lib/supabase-admin";

export type AiRoute = "coach_chat" | "writing_correct" | "oral_analyze" | "oral_session";

// Audit sécurité item 7 (2026-08) : seul endroit à modifier pour ajuster les
// quotas. Chiffres de départ volontairement conservateurs pour le plan
// Gratuit, choisis sans donnée d'usage réel -- à recalibrer une fois qu'on a
// du recul (voir conversation audit sécurité 2026-08). "premium" est un
// plafond anti-abus (script, bug, compte compromis), pas une vraie limite --
// settings/page.tsx promet "Accès illimité à l'IA" pour ce palier.
const DAILY_LIMITS: Record<AiRoute, { free: number; premium: number }> = {
  // coach_chat.free = 0 : le Coach IA n'est pas inclus dans le plan Gratuit (voir
  // landing /tef-irn/pricing). Le vrai verrou est un 403 explicite dans
  // api/coach/chat/route.ts avant même d'atteindre ce quota -- 0 ici est une
  // seconde ligne de défense, pas le mécanisme principal.
  coach_chat: { free: 0, premium: 300 },
  writing_correct: { free: 3, premium: 100 },
  oral_analyze: { free: 3, premium: 100 },
  oral_session: { free: 2, premium: 50 },
};

export interface AiRateLimitResult {
  allowed: boolean;
  limit: number;
}

/**
 * Vérifie et incrémente (atomique côté Postgres, voir
 * check_and_increment_ai_usage) le quota IA quotidien de l'utilisateur pour
 * une route donnée, avant d'appeler OpenAI.
 *
 * NOTE (2026-09-09) : depuis la migration 20260909000001, subscription_tier
 * connaît 4 valeurs réelles ('gratuit' | 'essentiel' | 'premium' |
 * 'super_premium'). Ce quota reste temporairement à 2 seuils : 'super_premium'
 * est rattaché au seuil 'premium' (le palier le plus cher ne doit pas se
 * retrouver avec le quota le plus bas), mais 'essentiel' retombe encore sur
 * le seuil 'free' -- passage à 4 seuils distincts prévu dans un item séparé
 * du chantier abonnements, pour ne pas mélanger renommage et nouvelle
 * logique métier dans le même patch.
 */
export async function checkAiRateLimit(
  userId: string,
  route: AiRoute,
  subscriptionTier: string | null | undefined
): Promise<AiRateLimitResult> {
  const limit =
    subscriptionTier === "premium" || subscriptionTier === "super_premium"
      ? DAILY_LIMITS[route].premium
      : DAILY_LIMITS[route].free;

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
