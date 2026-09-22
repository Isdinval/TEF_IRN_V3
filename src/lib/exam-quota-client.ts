/**
 * Contrôle de l'essai gratuit CE/CO du simulateur d'examen blanc, appelé à
 * l'ouverture d'une section (lecture seule, voir /api/exam/check). Ne
 * bloque que sur un 429 ; toute autre erreur (réseau, 5xx) laisse passer --
 * la vraie protection est dans /api/exam/ce-co-complete.
 */
export async function checkExamTrial(
  section: 'CE' | 'CO'
): Promise<{ allowed: boolean; error: string | null }> {
  try {
    const res = await fetch('/api/exam/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section }),
    });
    if (res.status === 429) {
      const data = await res.json();
      return { allowed: false, error: data?.error || 'Essai gratuit déjà utilisé.' };
    }
    return { allowed: true, error: null };
  } catch (err) {
    console.error("Erreur de vérification de l'essai examen (non bloquant):", err);
    return { allowed: true, error: null };
  }
}
