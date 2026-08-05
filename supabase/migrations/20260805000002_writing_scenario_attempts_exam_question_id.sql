-- Item 5/10 du plan de correction du dashboard (analyse détaillée) :
--
-- Les sujets EE de l'examen blanc complet (/tef-irn/exam) viennent de la table
-- exam_questions, un catalogue totalement séparé de writing_exam_scenarios
-- (catalogue utilisé par la page Rédaction). writing_scenario_attempts.scenario_id
-- ne peut donc pas pointer vers une question d'examen blanc.
--
-- Option B validée par Olivier : plutôt qu'un libellé générique ("Sujet d'examen
-- blanc") sur les cartes du dashboard, on ajoute un lien direct vers la question
-- exacte, pour afficher son vrai intitulé (exam_questions.instructions), au même
-- titre que les cartes Écrit et Oral.

ALTER TABLE public.writing_scenario_attempts
  ADD COLUMN exam_question_id uuid REFERENCES public.exam_questions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS writing_scenario_attempts_exam_question_id_idx
  ON public.writing_scenario_attempts(exam_question_id);
