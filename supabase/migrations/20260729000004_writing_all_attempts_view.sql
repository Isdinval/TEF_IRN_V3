-- Point 3 (suite improve_coach_EE) : la page /tef-irn/correction (historique complet,
-- filtres, export, statistiques) ne lisait que exercise_attempts JOIN exercises, ignorant
-- writing_scenario_attempts (examens blancs catalogue).
--
-- Une simple table n'a pas de FK vers exercises, donc l'embed PostgREST
-- '.select("*, exercise:exercises(*)")' ne fonctionnerait pas sur un UNION direct.
-- Solution : une vue qui pré-calcule 'exercise' et 'answers' comme colonnes jsonb déjà
-- fusionnées, avec exactement la forme attendue par les composants front (ExerciseAttempt,
-- WritingFeedback) — aucun changement nécessaire dans CorrectionCard/CorrectionDetailView/
-- CorrectionStats, qui ne lisent que answers.{text,subject,feedback} et exercise.instructions.
--
-- security_invoker = true est indispensable : sans ça, la vue s'exécute avec les droits de
-- son propriétaire (postgres) et contournerait la RLS "auth.uid() = user_id" des deux tables
-- sources. Avec security_invoker, PostgREST réapplique bien la RLS par utilisateur courant.
--
-- Colonne 'source' ('srs' | 'scenario') ajoutée pour permettre au front de distinguer les deux
-- (badge "Examen blanc" dans CorrectionCard, désactivation de l'export PDF pour les scénarios
-- tant que /api/correction/pdf ne les gère pas encore).
CREATE OR REPLACE VIEW public.writing_all_attempts
WITH (security_invoker = true) AS
SELECT
  ea.id,
  ea.user_id,
  ea.exercise_id,
  ea.score,
  ea.is_completed,
  ea.created_at,
  ea.study_time_minutes,
  ea.answers,
  jsonb_build_object(
    'id', e.id,
    'instructions', e.instructions,
    'level', e.level,
    'type', e.type,
    'category', e.category
  ) as exercise,
  'srs'::text as source

FROM public.exercise_attempts ea
LEFT JOIN public.exercises e ON e.id = ea.exercise_id

UNION ALL

SELECT
  wsa.id,
  wsa.user_id,
  NULL::uuid as exercise_id,
  wsa.overall_score::double precision as score,
  true as is_completed,
  wsa.created_at,
  wsa.study_time_minutes,
  jsonb_build_object(
    'text', wsa.submitted_text,
    'subject', COALESCE(wes.sujet, 'Sujet d''examen blanc'),
    'feedback', jsonb_build_object(
      'score_global', wsa.overall_score,
      'scores_par_competence', wsa.scores,
      'liste_des_erreurs', wsa.errors,
      'conseil_general', wsa.general_comment,
      'texte_corrige_complet', wsa.corrected_text,
      'level', wsa.level
    )
  ) as answers,
  jsonb_build_object(
    'id', wsa.scenario_id,
    'instructions', COALESCE(wes.sujet, 'Sujet d''examen blanc'),
    'level', wsa.level,
    'type', 'examen_blanc',
    'category', wsa.section
  ) as exercise,
  'scenario'::text as source

FROM public.writing_scenario_attempts wsa
LEFT JOIN public.writing_exam_scenarios wes ON wes.id = wsa.scenario_id;

GRANT SELECT ON public.writing_all_attempts TO authenticated;
