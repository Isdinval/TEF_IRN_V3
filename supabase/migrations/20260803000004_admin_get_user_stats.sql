-- Agrège les statistiques d'activité d'un compte (nb tentatives par
-- catégorie, score moyen, dernière connexion réelle) pour la vue détail de
-- la page admin Profils. SECURITY DEFINER nécessaire pour lire
-- auth.users.last_sign_in_at, hors de portée du rôle authenticated.
CREATE OR REPLACE FUNCTION admin_get_user_stats(p_target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'exercise_attempts', jsonb_build_object(
      'count', (SELECT count(*) FROM exercise_attempts WHERE user_id = p_target_user_id),
      'avg_score', (SELECT round(avg(score)::numeric, 1) FROM exercise_attempts WHERE user_id = p_target_user_id AND score IS NOT NULL)
    ),
    'writing_scenario_attempts', jsonb_build_object(
      'count', (SELECT count(*) FROM writing_scenario_attempts WHERE user_id = p_target_user_id),
      'avg_score', (SELECT round(avg(overall_score)::numeric, 1) FROM writing_scenario_attempts WHERE user_id = p_target_user_id AND overall_score IS NOT NULL)
    ),
    'oral_session_results', jsonb_build_object(
      'count', (SELECT count(*) FROM oral_session_results WHERE user_id = p_target_user_id),
      'avg_score', (SELECT round(avg(overall_score)::numeric, 1) FROM oral_session_results WHERE user_id = p_target_user_id AND overall_score IS NOT NULL)
    ),
    'civic_exam_attempts', jsonb_build_object(
      'count', (SELECT count(*) FROM civic_exam_attempts WHERE user_id = p_target_user_id),
      'avg_score', (SELECT round(avg(score)::numeric, 1) FROM civic_exam_attempts WHERE user_id = p_target_user_id AND score IS NOT NULL)
    ),
    'lesson_progress_count', (SELECT count(*) FROM lesson_progress WHERE user_id = p_target_user_id),
    'user_parcours_progress_count', (SELECT count(*) FROM user_parcours_progress WHERE user_id = p_target_user_id),
    'user_errors_count', (SELECT count(*) FROM user_errors WHERE user_id = p_target_user_id),
    'last_sign_in_at', (SELECT last_sign_in_at FROM auth.users WHERE id = p_target_user_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_user_stats(uuid) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_stats(uuid) TO service_role;
