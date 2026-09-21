import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeTier } from "@/lib/entitlements";

/**
 * Quota freemium de la pratique libre CE/CO : le palier Gratuit peut entamer
 * 1 sujet distinct par jour (UTC, comme ai_usage_daily) et par épreuve. Les
 * paliers payants sont illimités. Unité = le sujet (5 questions), pas la
 * question : un sujet commencé se termine toujours, et rejouer un sujet déjà
 * entamé aujourd'hui ne consomme rien.
 *
 * Le compte est dérivé des tentatives déjà enregistrées (aucun compteur à
 * incrémenter, donc pas de dérive). Seul point à modifier pour ajuster :
 * FREE_DAILY_SCENARIOS.
 */

export type ComprehensionSkill = "CE" | "CO";

const FREE_DAILY_SCENARIOS: Record<ComprehensionSkill, number> = { CE: 1, CO: 1 };

const TABLES = {
  CE: { attempts: "ce_scenario_attempts", questions: "ce_scenario_questions" },
  CO: { attempts: "co_scenario_attempts", questions: "co_scenario_questions" },
} as const;

export interface ComprehensionQuotaResult {
  allowed: boolean;
  /** null = illimité (palier payant). */
  limit: number | null;
  used: number;
}

export function comprehensionQuotaMessage(skill: ComprehensionSkill, limit: number): string {
  const label = skill === "CE" ? "de Compréhension Écrite" : "de Compréhension Orale";
  return `Limite quotidienne de sujets ${label} atteinte (${limit}/jour). Passez à un palier payant pour un accès illimité.`;
}

/**
 * Vérifie (lecture seule, aucun incrément) si l'utilisateur peut entamer /
 * poursuivre les sujets donnés. `supabase` = client de l'utilisateur (RLS :
 * il lit ses propres tentatives).
 */
export async function checkComprehensionQuota(
  supabase: SupabaseClient,
  userId: string,
  skill: ComprehensionSkill,
  subscriptionTier: string | null | undefined,
  scenarioIds: string[]
): Promise<ComprehensionQuotaResult> {
  if (normalizeTier(subscriptionTier) !== "gratuit") {
    return { allowed: true, limit: null, used: 0 };
  }

  const limit = FREE_DAILY_SCENARIOS[skill];
  const { attempts, questions } = TABLES[skill];
  const startOfUtcDay = `${new Date().toISOString().slice(0, 10)}T00:00:00Z`;

  const { data, error } = await supabase
    .from(attempts)
    .select(`${questions}!inner(scenario_id)`)
    .eq("user_id", userId)
    .gte("created_at", startOfUtcDay);

  if (error) {
    // Best-effort, même philosophie que checkAiRateLimit : un souci sur ce
    // garde-fou ne doit pas casser la pratique.
    console.error(`Comprehension quota check failed (${skill}):`, error);
    return { allowed: true, limit, used: 0 };
  }

  const startedToday = new Set<string>();
  for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
    const joined = row[questions] as { scenario_id: string } | { scenario_id: string }[] | null;
    const q = Array.isArray(joined) ? joined[0] : joined;
    if (q?.scenario_id) startedToday.add(q.scenario_id);
  }

  const newScenarios = new Set(scenarioIds.filter((id) => !startedToday.has(id)));
  return {
    allowed: startedToday.size + newScenarios.size <= limit,
    limit,
    used: startedToday.size,
  };
}
