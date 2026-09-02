import { ExerciseAttempt } from "@/types/writing";

// Item 5 du plan "Refonte page Correction" : estimation du niveau CECRL global
// actuel, tous compétences confondues (EE+EO).
//
// Décision de scope (voir migration 20260902000001 et discussion du plan) :
// UNIQUEMENT EE (niveau_apparent_cecrl) + EO (estimated_level), pas CE/CO
// (retiré du plan -- aucune mesure de niveau absolu n'existe pour ce format,
// voir commentaire dans la migration de la vue correction_all_attempts).
//
// Les deux champs mesurent la même chose (niveau CECRL démontré, indépendant
// du niveau VISÉ par le sujet -- voir docs/writing-correction-levels.md et
// docs/oral-analysis-levels.md) mais avec des domaines de valeurs légèrement
// différents (EO admet '<A1', pas EE) -- normalisés ici sur une échelle
// numérique commune.
const LEVEL_ORDER = ["<A1", "A1", "A2", "B1", "B2"] as const;
type CecrlLevel = typeof LEVEL_ORDER[number];

const levelToScore = (level: string): number | null => {
  const idx = LEVEL_ORDER.indexOf(level as CecrlLevel);
  return idx === -1 ? null : idx;
};

const scoreToLevel = (score: number): CecrlLevel => {
  const idx = Math.round(score);
  return LEVEL_ORDER[Math.min(Math.max(idx, 0), LEVEL_ORDER.length - 1)];
};

const MAX_ATTEMPTS_CONSIDERED = 10;

export interface EstimatedLevelResult {
  level: CecrlLevel | null;
  // Nombre de tentatives EE/EO avec un niveau CECRL renseigné ayant servi au
  // calcul -- affiché dans le tooltip pour que l'utilisateur comprenne
  // pourquoi l'estimation peut sembler instable avec peu de données.
  sampleSize: number;
}

/**
 * Moyenne pondérée par récence (poids linéaire décroissant, la tentative la
 * plus récente pèse le plus) du niveau CECRL démontré sur les N dernières
 * tentatives EE+EO qui ont ce champ renseigné, arrondie au niveau CECRL le
 * plus proche.
 *
 * `attempts` doit être le dataset non filtré par le filtre Type de la page
 * (même source que le graphique, item 3) : le niveau global ne doit pas
 * disparaître ou se biaiser si l'utilisateur filtre sur un seul type.
 */
export function estimateCurrentLevel(attempts: ExerciseAttempt[]): EstimatedLevelResult {
  const withLevel = [...attempts]
    .filter(a => a.estimated_level && levelToScore(a.estimated_level) !== null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, MAX_ATTEMPTS_CONSIDERED);

  if (withLevel.length === 0) {
    return { level: null, sampleSize: 0 };
  }

  let weightedSum = 0;
  let totalWeight = 0;
  withLevel.forEach((attempt, i) => {
    const weight = withLevel.length - i; // la plus récente (i=0) a le plus grand poids
    weightedSum += (levelToScore(attempt.estimated_level as string) as number) * weight;
    totalWeight += weight;
  });

  return {
    level: scoreToLevel(weightedSum / totalWeight),
    sampleSize: withLevel.length,
  };
}
