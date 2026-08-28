import { createAdminClient } from "@/lib/supabase-admin";

export type AiRoute = "coach_chat" | "writing_correct" | "oral_analyze" | "oral_session";

// Audit sécurité item 7 (2026-08) : seul endroit à modifier pour ajuster les
// quotas. Chiffres de départ volontairement conservateurs pour le plan
// Gratuit, choisis sans donnée d'usage réel -- à recalibrer une fois qu'on a
// du recul (voir conversation audit sécurité 2026-08). "premium" est un
// plafond anti-abus (script, bug, compte compromis), pas une vraie limite --
// settings/page.tsx promet "Accès illimité à l'IA" pour ce palier.
const DAILY_LIMITS: Record<AiRoute, { free: number; premium: number }> = {
  coach_chat: { free: 15, premium: 300 },
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
 * une route donnée, avant d'appeler OpenAI. 'pro' est traité comme 'premium'
 * (même palier haut, pas de palier supplémentaire pour l'instant).
 */
export async function checkAiRateLimit(
  userId: string,
  route: AiRoute,
  subscriptionTier: string | null | undefined
): Promise<AiRateLimitResult> {
  const limit =
    subscriptionTier === "premium" || subscriptionTier === "pro"
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
