import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Attribution d'XP + mise à jour de la série de jours, factorisée depuis
 * api/exercise-complete/route.ts (seul et unique consommateur jusqu'ici) --
 * logique identique, pas de changement de comportement pour les exercices
 * vocab/qcm/trous. Deuxième consommateur : api/comprehension/complete
 * (pratique libre CE/CO), qui n'a aucun moyen d'écrire dans
 * exercise_attempts (FK exercise_id -> exercises.id, table qui ne connaît
 * pas les sujets CE/CO) -- d'où cette écriture directe sur `profiles`.
 *
 * Pas de garde-fou anti-farming (un même exercice/sujet rejoué regagne de
 * l'XP à chaque fois) : comportement déjà celui des exercices vocab/qcm/
 * trous aujourd'hui, volontairement reproduit à l'identique plutôt que
 * d'introduire une règle différente entre types d'exercices.
 *
 * `supabase` = client de l'utilisateur, pour la LECTURE du profil (RLS :
 * il lit sa propre ligne). L'ÉCRITURE passe toujours par le client admin en
 * interne : total_xp/streak_count sont protégées par un trigger qui bloque
 * toute écriture non-service_role (migration 20260828000002).
 */
export async function awardXpAndStreak(
  supabase: SupabaseClient,
  userId: string,
  xpGain: number
): Promise<{ newStreak: number; totalXp: number }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, streak_count, last_activity_at")
    .eq("id", userId)
    .single();

  const now = new Date();
  const daysSinceLastActivity = profile?.last_activity_at
    ? Math.round(
        (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
          Date.UTC(
            new Date(profile.last_activity_at).getUTCFullYear(),
            new Date(profile.last_activity_at).getUTCMonth(),
            new Date(profile.last_activity_at).getUTCDate()
          )) /
          86400000
      )
    : null;

  // null (jamais actif) ou >1 jour d'écart -> on repart à 1. Même jour -> inchangé. 1 jour -> +1.
  const newStreak =
    daysSinceLastActivity === 0
      ? profile?.streak_count || 1
      : daysSinceLastActivity === 1
        ? (profile?.streak_count || 0) + 1
        : 1;

  const totalXp = (profile?.total_xp || 0) + xpGain;

  const { error } = await createAdminClient()
    .from("profiles")
    .update({
      total_xp: totalXp,
      streak_count: newStreak,
      last_activity_at: now.toISOString(),
    })
    .eq("id", userId);

  if (error) console.error("XP/streak update error:", error);

  return { newStreak, totalXp };
}
