/**
 * Mélange l'ordre d'affichage des options d'une question QCM dont le texte
 * porte la lettre en dur ("A) Contenu", "B) Contenu"...) -- format utilisé
 * par ce_scenario_questions / co_scenario_questions / exam_questions (via
 * les vues *_public) et exercice-gratuit. Corrige le biais de position de
 * la bonne réponse à l'affichage, sans toucher aux données ni à la
 * correction : la lettre/texte ORIGINAL de chaque option est conservé pour
 * la soumission, exactement comme avant ce changement -- seul le LABEL vu
 * par l'utilisateur (nouvelle position) change.
 *
 * Ne pas utiliser sur des options qui n'ont pas ce format "X) " en dur
 * (ex. exercises.content.options, civic_questions.options) : ces deux
 * tables ont déjà leur propre mélange, correct pour leur modèle de données
 * (correct_answer/index connu côté client, donc pas besoin de préserver une
 * lettre d'origine) -- voir practice/page.tsx et CivicExam.tsx.
 */

export interface ShuffledQcmOption {
  /** Texte à afficher, avec la NOUVELLE lettre correspondant à la position d'affichage : "B) Contenu". */
  display: string;
  /** Lettre ORIGINALE en base (avant mélange) -- à utiliser pour comparer à correct_answer ou soumettre si l'API attend une lettre seule. */
  originalLetter: string;
  /** Chaîne ORIGINALE complète, exactement comme reçue ("A) Contenu") -- à soumettre telle quelle si l'API attend le texte complet. */
  original: string;
}

const DISPLAY_LETTERS = ['A', 'B', 'C', 'D'];

export function shuffleQcmOptions(options: string[]): ShuffledQcmOption[] {
  const parsed = options.map((opt) => ({
    originalLetter: opt.trim().charAt(0).toUpperCase(),
    content: opt.slice(3),
    original: opt,
  }));

  const shuffled = [...parsed];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.map((item, i) => ({
    display: `${DISPLAY_LETTERS[i] ?? item.originalLetter}) ${item.content}`,
    originalLetter: item.originalLetter,
    original: item.original,
  }));
}
