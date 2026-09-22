import type { SupabaseClient } from "@supabase/supabase-js";
import { getEntitlements } from "@/lib/entitlements";

/**
 * Essai gratuit du simulateur d'examen blanc (sections CE/CO uniquement) :
 * le palier Gratuit a droit à 1 section CE + 1 section CO À VIE, tous
 * examens confondus (pas hasFullExam, voir entitlements.ts) ; les paliers
 * payants sont illimités.
 *
 * Contrairement au quota quotidien de la pratique libre CE/CO
 * (comprehension-quota.ts), c'est un essai à vie -- même logique que
 * `profiles.free_ee_correction_used` pour l'EE, mais dérivé des tentatives
 * déjà enregistrées plutôt qu'un booléen dédié : `exam_ce_co_attempts` a
 * déjà la granularité "1 ligne = 1 question répondue" (voir migration
 * 20260817000003), donc la présence d'AU MOINS UNE tentative pour la
 * section suffit à prouver que l'essai a été consommé, sans nouvelle
 * colonne ni migration.
 */

export type ExamCeCoSection = "CE" | "CO";

export interface ExamSectionTrialResult {
  allowed: boolean;
  /** true = essai déjà consommé (toujours false pour un palier payant). */
  used: boolean;
}

export function examTrialMessage(section: ExamCeCoSection): string {
  const label = section === "CE" ? "Compréhension Écrite" : "Compréhension Orale";
  return `Votre essai gratuit de la section ${label} de l'examen blanc a déjà été utilisé. Passez à un palier payant pour un accès illimité au simulateur d'examen complet.`;
}

/**
 * Vérifie (lecture seule, aucune écriture) si l'utilisateur peut entamer ou
 * soumettre la section CE/CO de l'examen blanc. `supabase` = client de
 * l'utilisateur (RLS : il lit ses propres tentatives, policy "Users can
 * view their own CE/CO attempts").
 */
export async function checkExamSectionTrial(
  supabase: SupabaseClient,
  userId: string,
  section: ExamCeCoSection,
  subscriptionTier: string | null | undefined
): Promise<ExamSectionTrialResult> {
  if (getEntitlements(subscriptionTier).hasFullExam) {
    return { allowed: true, used: false };
  }

  const { data, error } = await supabase
    .from("exam_ce_co_attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("section", section)
    .limit(1);

  if (error) {
    // Best-effort, même philosophie que checkComprehensionQuota : un souci
    // sur ce garde-fou ne doit pas casser l'examen.
    console.error(`Exam section trial check failed (${section}):`, error);
    return { allowed: true, used: false };
  }

  const used = (data?.length ?? 0) > 0;
  return { allowed: !used, used };
}
