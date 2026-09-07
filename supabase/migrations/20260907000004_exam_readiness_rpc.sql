-- RPC dédiée pour la future card "Cap examen" (idée 4/plan "cards
-- dashboard") de l'onglet "Ma progression", même esprit que
-- get_qcm_stats/get_trous_stats/get_eo_stats : RPC séparée plutôt que
-- d'alourdir get_dashboard_data().
--
-- Calcule uniquement les deux briques nécessaires à la projection --
-- lessons_remaining et lessons_per_week -- la comparaison à target_exam_date
-- et le rendu (statut vert/orange/rouge, date estimée) restent côté front
-- (ExamReadinessCard) pour rester ajustables sans nouvelle migration.
--
-- "Leçons restantes" = jusqu'au goal_level du profil INCLUS, ordre CECRL
-- explicite (même convention que le tri topLevel de vocab_stats dans
-- get_dashboard_data). Renvoie NULL si goal_level n'est pas défini (onboarding
-- non terminé), comme les autres RPC stats de ce fichier de plan.
--
-- "Rythme récent" = leçons terminées sur les 28 derniers jours / 4, pour
-- lisser les creux ponctuels (un jour sans activité ne doit pas faire
-- disparaître la projection) sans remonter trop loin dans un historique qui
-- ne reflèterait plus le rythme actuel.

CREATE OR REPLACE FUNCTION public.get_exam_readiness()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_goal_level TEXT;
    v_lessons_remaining INTEGER;
    v_lessons_last_28_days INTEGER;
    v_lessons_per_week NUMERIC;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT goal_level INTO v_goal_level FROM public.profiles WHERE id = v_user_id;
    IF v_goal_level IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT count(*) INTO v_lessons_remaining
    FROM public.lessons l
    WHERE (CASE l.level WHEN 'A1' THEN 1 WHEN 'A2' THEN 2 WHEN 'B1' THEN 3 WHEN 'B2' THEN 4 END)
          <= (CASE v_goal_level WHEN 'A2' THEN 2 WHEN 'B1' THEN 3 WHEN 'B2' THEN 4 END)
      AND NOT EXISTS (
          SELECT 1 FROM public.lesson_progress lp
          WHERE lp.user_id = v_user_id AND lp.lesson_id = l.id
      );

    SELECT count(*) INTO v_lessons_last_28_days
    FROM public.lesson_progress
    WHERE user_id = v_user_id AND completed_at >= CURRENT_DATE - INTERVAL '28 days';

    v_lessons_per_week := ROUND(COALESCE(v_lessons_last_28_days, 0) / 4.0, 1);

    RETURN jsonb_build_object(
        'lessons_remaining', COALESCE(v_lessons_remaining, 0),
        'lessons_per_week', v_lessons_per_week
    );
END;
$function$;
