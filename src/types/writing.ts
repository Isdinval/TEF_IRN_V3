export interface WritingError {
  texte_original: string;
  texte_corrige: string;
  explication: string;
  type_erreur: 'grammaire' | 'vocabulaire' | 'orthographe' | 'syntaxe' | 'conjugaison' | 'improvement';
  position_dans_texte?: number;
}

// Legacy support for older annotations
export interface LegacyAnnotation {
  type: string;
  correction: string;
  explanation: string;
  original_fragment: string;
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
  level?: string; // Derived or explicitly stated
  error?: string;
}

// Legacy feedback structure found in some database records
export interface LegacyFeedback {
  level: string;
  score: number;
  comment: string;
  improved: string;
  annotations: LegacyAnnotation[];
}

export interface WritingExercise {
  id?: string;
  instructions: string;
  level: string;
  content?: {
    min_words?: number;
  };
}

export interface ExerciseAttempt {
  id: string;
  user_id: string;
  exercise_id: string | null;
  score: number | null;
  is_completed: boolean;
  created_at: string;
  study_time_minutes: number;
  answers: {
    text: string;
    subject?: string;
    feedback?: WritingFeedback | LegacyFeedback;
  };
  // Join fields
  exercise?: WritingExercise;
}
