-- Persistance des tentatives d'examen blanc écrit (catalogue writing_exam_scenarios).
-- Table dédiée, séparée d'exercises/exercise_attempts (FK stricte exercise_attempts.exercise_id
-- -> exercises.id, cf. docs/EXAM_SCENARIOS_CATALOGUE.md), même pattern que oral_session_results.
-- Voir src/app/api/writing/scenario-complete/route.ts pour l'utilisation.
CREATE TABLE writing_scenario_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scenario_id uuid REFERENCES writing_exam_scenarios(id) ON DELETE SET NULL,
  section text,
  level text,
  submitted_text text NOT NULL,
  overall_score integer,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  general_comment text,
  corrected_text text,
  study_time_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX writing_scenario_attempts_user_id_idx ON writing_scenario_attempts(user_id);

ALTER TABLE writing_scenario_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own writing scenario attempts"
  ON writing_scenario_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own writing scenario attempts"
  ON writing_scenario_attempts FOR SELECT
  USING (auth.uid() = user_id);
