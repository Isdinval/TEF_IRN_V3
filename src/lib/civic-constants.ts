export const THEMES = [
  { value: "vivre_societe", label: "Vivre en société" },
  { value: "principes_valeurs", label: "Principes & valeurs" },
  { value: "systeme_politique", label: "Système politique" },
  { value: "droits_devoirs", label: "Droits & devoirs" },
  { value: "histoire_geo_culture", label: "Histoire, géo & culture" },
];

export const MENTIONS = [
  { value: "csp", label: "Carte de séjour pluriannuelle", shortLabel: "CSP" },
  { value: "cr", label: "Carte de résident", shortLabel: "CR" },
  { value: "naturalisation", label: "Naturalisation" },
];

// Valeurs par défaut de la démarche/thématique sélectionnée (sommaire, /parcourir, /entrainement,
// /examen-blanc). Défini ici (fichier server+client) plutôt que dans useCivicContext ("use client")
// pour pouvoir générer un contenu/schema SEO cohérent depuis les Server Components.
export const DEFAULT_MENTION = "naturalisation";
export const DEFAULT_THEME = "Toutes";

// Niveau de français CECRL requis par mention — utilisé pour personnaliser le pont vers le TEF IRN.
export const MENTION_TO_LEVEL: Record<string, string> = {
  csp: "A2",
  cr: "B1",
  naturalisation: "B2",
};

export const EXAM_QUESTION_COUNT = 40;
export const EXAM_DURATION_SECONDS = 45 * 60;
export const EXAM_PASS_THRESHOLD = 32;
export const EXAM_STORAGE_KEY = "civic_exam_session_v1";

// sessionStorage (pas localStorage : usage ponctuel, ne doit pas survivre au-delà de l'onglet) —
// transmet les IDs des questions ratées d'un examen blanc vers une session /entrainement?mode=erreurs.
export const EXAM_MISTAKES_STORAGE_KEY = "civic_exam_mistakes_v1";

export function mentionLabel(value: string): string {
  const m = MENTIONS.find((m) => m.value === value);
  if (!m) return value;
  return m.shortLabel ? `${m.label} (${m.shortLabel})` : m.label;
}

export function passThresholdFor(totalQuestions: number): number {
  return Math.round(totalQuestions * (EXAM_PASS_THRESHOLD / EXAM_QUESTION_COUNT));
}
