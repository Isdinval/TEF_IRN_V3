export interface WritingError {
  texte_original: string;
  texte_corrige: string;
  explication: string;
  type_erreur: 'grammaire' | 'vocabulaire' | 'orthographe' | 'syntaxe' | 'conjugaison' | 'improvement';
  // Notion précise, alignée sur la taxonomie officielle des étiquettes de leçons
  // (docs/lessons-tags-taxonomy.md) -- null pour "orthographe" (pas de liste) ou si
  // l'IA n'a trouvé aucune correspondance pertinente. Voir item 10.12 du plan dashboard.
  sous_categorie?: string | null;
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
  // Renseignés uniquement quand le sujet vient du catalogue (writing_exam_scenarios) —
  // absents pour un exercice SRS classique (exercises, type='ecrit'), qui n'a pas cette
  // donnée structurée. Tout affichage basé sur ces champs doit rester conditionnel.
  section?: "A" | "B";
  type_texte?: string;
  title?: string;
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
  // 'scenario' = vient de writing_scenario_attempts (examen blanc catalogue), via la vue
  // writing_all_attempts. 'srs' (ou absent, anciennes lignes) = exercise_attempts classique.
  source?: 'srs' | 'scenario';
  answers: {
    text: string;
    subject?: string;
    feedback?: WritingFeedback | LegacyFeedback;
  };
  // Join fields
  exercise?: WritingExercise;
}
