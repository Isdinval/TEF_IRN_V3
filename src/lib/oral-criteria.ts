export type OralCriterionKey =
  | "pertinence_et_adequation_au_sujet"
  | "coherence_et_interaction"
  | "etendue_et_precision_du_vocabulaire"
  | "correction_grammaticale"
  | "aisance_et_fluidite";

export const ORAL_CRITERIA_LABELS: Record<OralCriterionKey, string> = {
  pertinence_et_adequation_au_sujet: "Pertinence & adéquation au sujet",
  coherence_et_interaction: "Cohérence & interaction",
  etendue_et_precision_du_vocabulaire: "Vocabulaire",
  correction_grammaticale: "Correction grammaticale",
  aisance_et_fluidite: "Aisance & fluidité",
};

export type OralTurn = { role: "candidat" | "coach"; text: string };

export type OralAnalysis = {
  overall_score: number;
  estimated_level: "<A1" | "A1" | "A2" | "B1" | "B2";
  scores: Record<OralCriterionKey, number>;
  strengths: string[];
  improvements: string[];
  general_comment: string;
  saved?: boolean;
  id?: string;
};
