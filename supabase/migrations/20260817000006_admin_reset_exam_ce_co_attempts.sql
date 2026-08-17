-- Complément au plan "Refonte recommandation erreur -> tag -> ressource" :
-- admin_reset_user_progress() ne videait pas exam_ce_co_attempts (table
-- créée par l'item 4, postérieure à la dernière mise à jour de cette
-- fonction) -- un reset de compte pour tester le plan laissait donc
-- subsister l'historique CE/CO d'examen blanc, faussant le signal de test.
--
-- Seul changement : ajout d'un DELETE FROM exam_ce_co_attempts, au même
-- endroit logique que les autres tables de tentatives (writing_scenario_
-- attempts, oral_session_results). Aucun autre bloc de la fonction n'est
-- modifié.
--
-- Testé avant livraison (transaction BEGIN/CREATE OR REPLACE/ROLLBACK) :
-- la fonction compile et reste appelable.

CREATE OR REPLACE FUNCTION public.admin_reset_user_progress(p_target_user_id uuid, p_admin_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted integer := 0;
  v_count integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND is_admin = true) THEN
    RAISE EXCEPTION 'Seul un administrateur peut réinitialiser un compte.';
  END IF;

  DELETE FROM exercise_attempts WHERE user_id = p_target_user_id; -- cascade -> ai_feedback
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM writing_scenario_attempts WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM oral_session_results WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM exam_ce_co_attempts WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM civic_exam_attempts WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM user_civic_reviews WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM user_vocabulary_reviews WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM user_reviews WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM user_errors WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM lesson_progress WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM user_parcours_progress WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM recommendations WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM study_activity WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM user_streaks WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM user_challenges WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM coach_generated_exercises WHERE user_id = p_target_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  DELETE FROM chat_sessions WHERE user_id = p_target_user_id; -- cascade -> chat_messages
  GET DIAGNOSTICS v_count = ROW_COUNT; v_deleted := v_deleted + v_count;

  UPDATE profiles
  SET total_xp = 0,
      streak_count = 0,
      last_activity_at = now(),
      last_active_parcours_id = NULL
  WHERE id = p_target_user_id;

  RETURN v_deleted;
END;
$function$;
