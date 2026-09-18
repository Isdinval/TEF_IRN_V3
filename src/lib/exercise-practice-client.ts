/**
 * Chantier abonnements, item 2 (2026-09) : le palier Gratuit est limité à 3
 * exercices INDIVIDUELS par jour et par type (vocabulaire, QCM, chasse aux
 * erreurs) -- voir ai-rate-limit.ts pour les chiffres exacts par palier.
 *
 * Chaque page (vocab/page.tsx, practice/page.tsx, grammar-check/page.tsx)
 * appelle checkExercisePracticeQuota() juste avant d'afficher un nouvel
 * exercice (pas au démarrage du lot -- un lot chargé peut contenir jusqu'à
 * 10 items, mais la progression s'arrête dès que le quota du jour est
 * atteint, même en plein milieu d'un lot).
 */

export type ExercisePracticeType = "vocab" | "qcm" | "trous";

export interface ExercisePracticeCheckResult {
  allowed: boolean;
  limit?: number;
  error?: string;
}

export async function checkExercisePracticeQuota(
  type: ExercisePracticeType
): Promise<ExercisePracticeCheckResult> {
  try {
    const res = await fetch("/api/exercise-practice/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    const data = await res.json();

    if (!res.ok) {
      return { allowed: false, limit: data?.limit, error: data?.error || "Limite quotidienne atteinte." };
    }

    return { allowed: true, limit: data?.limit };
  } catch (err) {
    // Best-effort, même philosophie que checkAiRateLimit côté serveur : un
    // souci réseau sur ce garde-fou annexe ne doit pas bloquer l'exercice.
    console.error("Erreur de vérification du quota d'exercices (non bloquant):", err);
    return { allowed: true };
  }
}
