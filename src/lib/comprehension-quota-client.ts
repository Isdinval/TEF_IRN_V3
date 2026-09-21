/**
 * Contrôle du quota freemium de la pratique CE/CO à l'ouverture d'un sujet
 * (lecture seule, voir /api/comprehension/check). Ne bloque que sur un 429 ;
 * toute autre erreur (réseau, 5xx) laisse passer, même philosophie
 * best-effort que exercise-practice-client.ts -- la vraie protection est
 * dans /api/comprehension/complete.
 */
export async function checkComprehensionScenarioQuota(
  skill: 'CE' | 'CO',
  scenarioId: string
): Promise<{ allowed: boolean; error: string | null }> {
  try {
    const res = await fetch('/api/comprehension/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill, scenarioId }),
    });
    if (res.status === 429) {
      const data = await res.json();
      return { allowed: false, error: data?.error || 'Limite quotidienne atteinte.' };
    }
    return { allowed: true, error: null };
  } catch (err) {
    console.error("Erreur de vérification du quota de compréhension (non bloquant):", err);
    return { allowed: true, error: null };
  }
}

/**
 * Statut du jour pour le badge des catalogues. null = palier payant (illimité)
 * ou erreur : dans les deux cas, aucun badge n'est affiché.
 */
export async function getComprehensionQuotaStatus(
  skill: 'CE' | 'CO'
): Promise<{ limit: number; used: number } | null> {
  try {
    const res = await fetch('/api/comprehension/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.limit === 'number' ? { limit: data.limit, used: data.used ?? 0 } : null;
  } catch {
    return null;
  }
}
