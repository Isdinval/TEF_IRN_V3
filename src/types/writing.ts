export interface WritingError {
  texte_original: string;
  texte_corrige: string;
  explication: string;
  type_erreur: 'grammaire' | 'vocabulaire' | 'orthographe' | 'syntaxe';
  position_dans_texte: number;
}

export interface WritingScores {
  grammaire: number;
  vocabulaire: number;
  coherence: number;
  orthographe: number;
}

export interface WritingFeedback {
  score_global: number;
  scores_par_competence: WritingScores;
  liste_des_erreurs: WritingError[];
  conseil_general: string;
  texte_corrige_complet: string;
  error?: string; // For handling API errors
}

export interface WritingExercise {
  id?: string;
  instructions: string;
  level: string;
  content?: {
    min_words?: number;
  };
}
