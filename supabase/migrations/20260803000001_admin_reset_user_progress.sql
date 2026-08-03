-- Reset admin d'un compte : vide toutes les données de progression/activité
-- d'un utilisateur (tentatives, examens blancs, SRS, chat coach, etc.) sans
-- toucher à l'identité (auth), au statut is_admin, à l'abonnement/crédits IA,
-- ni aux paramètres d'onboarding (niveau actuel/visé, date d'examen,
-- disponibilité) — décision produit : un reset remet à zéro la PERFORMANCE,
-- pas les préférences déclarées par l'utilisateur.
--
-- SECURITY DEFINER + service_role uniquement : la route API
-- (/api/admin/profiles/reset) vérifie déjà côté serveur que l'appelant est
-- admin avant d'invoquer cette fonction avec la clé service_role. Le check
-- p_admin_id ci-dessous est une deuxième barrière en cas d'appel direct.
CREATE OR REPLACE FUNCTION admin_reset_user_progress(
  p_target_user_id uuid,
  p_admin_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.admin_reset_user_progress(uuid, uuid) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_progress(uuid, uuid) TO service_role;
