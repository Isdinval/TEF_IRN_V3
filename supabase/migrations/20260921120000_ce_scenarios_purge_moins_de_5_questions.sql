-- Pratique CE : ne conserver que les sujets comportant exactement 5 questions.
-- Les sujets migrés des Examens Blancs (1-2 questions) sont supprimés ; les
-- questions partent en cascade avec leur sujet, mais ce_scenario_attempts
-- référence ce_scenario_questions sans ON DELETE CASCADE : on purge donc d'abord
-- les tentatives (compte admin/test + lot de test inséré en bloc le 18/09).
-- exam_questions (Examens Blancs) n'est pas touché.

DELETE FROM public.ce_scenario_attempts a
USING public.ce_scenario_questions q
WHERE a.scenario_question_id = q.id
  AND q.scenario_id IN (
    SELECT s.id FROM public.ce_scenarios s
    WHERE (SELECT count(*) FROM public.ce_scenario_questions x WHERE x.scenario_id = s.id) <> 5
  );

DELETE FROM public.ce_scenarios s
WHERE (SELECT count(*) FROM public.ce_scenario_questions x WHERE x.scenario_id = s.id) <> 5;

-- Garde-fou : la migration échoue (rollback) s'il reste un sujet invalide.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.ce_scenarios s
    WHERE (SELECT count(*) FROM public.ce_scenario_questions x WHERE x.scenario_id = s.id) <> 5
  ) THEN
    RAISE EXCEPTION 'ce_scenarios : il reste des sujets avec un nombre de questions <> 5';
  END IF;
END $$;
