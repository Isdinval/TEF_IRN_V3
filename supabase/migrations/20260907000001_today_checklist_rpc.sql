-- RPC dédiée pour la future card "Objectif du jour" (checklist) de l'onglet
-- "Aujourd'hui" du dashboard, sur le même modèle que get_qcm_stats/get_trous_stats
-- (migration 20260831000001) : RPC séparée plutôt que d'alourdir davantage
-- get_dashboard_data().
--
-- 6 items validés avec Olivier : leçon, QCM, Trous, EE, EO, Examen blanc.
-- Chaque item est un simple booléen "fait aujourd'hui" (pas de quota
-- journalier chiffré -- le quota existant de 3 QCM + 3 Trous est par leçon,
-- pas par jour, voir ExerciseQuotaBadge.tsx).
--
-- "Aujourd'hui" = CURRENT_DATE, même convention que v_today_start dans
-- get_dashboard_data() (xp_today) -- fuseau horaire du serveur, pas de
-- l'utilisateur, limite pré-existante non traitée ici.
--
-- Distinction EE/EO vs Examen blanc = colonne `context` (migration
-- 20260805000001) : 'standalone' (pratique libre) -> EE/EO, 'exam' (examen
-- blanc chronométré, /tef-irn/exam) -> Examen blanc, que ce soit une
-- tentative écrite ou orale -- même sémantique que le dispatch déjà en place
-- dans get_dashboard_data() pour recent_corrections (migration 20260805000003).
--
-- QCM = mêmes types que get_qcm_stats : qcm, association, qcm_centre_entrainement.
-- Trous = type 'trous', comme get_trous_stats.

CREATE OR REPLACE FUNCTION public.get_today_checklist()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_today_start TIMESTAMP WITH TIME ZONE := CURRENT_DATE;
    v_lesson BOOLEAN;
    v_qcm BOOLEAN;
    v_trous BOOLEAN;
    v_ee BOOLEAN;
    v_eo BOOLEAN;
    v_examen_blanc BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.lesson_progress
        WHERE user_id = v_user_id AND completed_at >= v_today_start
    ) INTO v_lesson;

    SELECT EXISTS (
        SELECT 1 FROM public.exercise_attempts ea
        JOIN public.exercises e ON e.id = ea.exercise_id
        WHERE ea.user_id = v_user_id
          AND e.type IN ('qcm', 'association', 'qcm_centre_entrainement')
          AND ea.score IS NOT NULL
          AND ea.created_at >= v_today_start
    ) INTO v_qcm;

    SELECT EXISTS (
        SELECT 1 FROM public.exercise_attempts ea
        JOIN public.exercises e ON e.id = ea.exercise_id
        WHERE ea.user_id = v_user_id
          AND e.type = 'trous'
          AND ea.score IS NOT NULL
          AND ea.created_at >= v_today_start
    ) INTO v_trous;

    SELECT EXISTS (
        SELECT 1 FROM public.writing_scenario_attempts wsa
        WHERE wsa.user_id = v_user_id
          AND wsa.context = 'standalone'
          AND wsa.created_at >= v_today_start
    ) INTO v_ee;

    SELECT EXISTS (
        SELECT 1 FROM public.oral_session_results osr
        WHERE osr.user_id = v_user_id
          AND osr.context = 'standalone'
          AND osr.created_at >= v_today_start
    ) INTO v_eo;

    SELECT EXISTS (
        SELECT 1 FROM public.writing_scenario_attempts wsa
        WHERE wsa.user_id = v_user_id AND wsa.context = 'exam' AND wsa.created_at >= v_today_start
        UNION ALL
        SELECT 1 FROM public.oral_session_results osr
        WHERE osr.user_id = v_user_id AND osr.context = 'exam' AND osr.created_at >= v_today_start
    ) INTO v_examen_blanc;

    RETURN jsonb_build_object(
        'lesson', v_lesson,
        'qcm', v_qcm,
        'trous', v_trous,
        'ee', v_ee,
        'eo', v_eo,
        'examen_blanc', v_examen_blanc
    );
END;
$function$;
