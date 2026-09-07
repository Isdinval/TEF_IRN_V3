-- RPC dédiée pour la nouvelle EEStatsCard de l'onglet "Ma progression"
-- (demande directe d'Olivier : "il manque une card EE, qui ressemble à
-- celle de EO"). Même esprit que get_eo_stats, mais l'EE a DEUX sources à
-- unir, contrairement à l'oral qui n'en a qu'une (oral_session_results) :
--   - public.exercise_attempts (JOIN exercises) où e.type = 'ecrit'
--     (exercices de rédaction "classiques", catalogue /tef-irn/writing)
--   - public.writing_scenario_attempts (scénarios d'examen ou standalone)
-- Même union que celle déjà utilisée pour le bloc 'EE' de competency_radar
-- dans get_dashboard_data() -- volume total, standalone + exam confondus
-- (même choix que get_eo_stats pour l'oral).
--
-- Pas de répartition par niveau ici (contrairement à get_eo_stats) :
-- writing_scenario_attempts.level est un TEXT libre, sans contrainte CECRL
-- (peut contenir des valeurs composites comme "A2-B1"), donc un filtre
-- exact par niveau serait silencieusement faux sur une partie des lignes.
-- Assumption posée faute de pouvoir fiabiliser ce découpage sans changer le
-- schéma -- total + score moyen + dernière session suffisent pour rester
-- correct.

CREATE OR REPLACE FUNCTION public.get_ee_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_total INTEGER;
    v_success_rate INTEGER;
    v_last_score DOUBLE PRECISION;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT count(*), ROUND(AVG(score))::INTEGER
    INTO v_total, v_success_rate
    FROM (
        SELECT ea.score::double precision as score, ea.created_at
        FROM public.exercise_attempts ea
        JOIN public.exercises e ON e.id = ea.exercise_id
        WHERE ea.user_id = v_user_id AND e.type = 'ecrit' AND ea.score IS NOT NULL

        UNION ALL

        SELECT wsa.overall_score::double precision, wsa.created_at
        FROM public.writing_scenario_attempts wsa
        WHERE wsa.user_id = v_user_id AND wsa.overall_score IS NOT NULL
    ) combined;

    v_total := COALESCE(v_total, 0);

    IF v_total = 0 THEN
        RETURN jsonb_build_object('total', 0, 'success_rate', NULL, 'last_score', NULL);
    END IF;

    SELECT score INTO v_last_score
    FROM (
        SELECT ea.score::double precision as score, ea.created_at
        FROM public.exercise_attempts ea
        JOIN public.exercises e ON e.id = ea.exercise_id
        WHERE ea.user_id = v_user_id AND e.type = 'ecrit' AND ea.score IS NOT NULL

        UNION ALL

        SELECT wsa.overall_score::double precision, wsa.created_at
        FROM public.writing_scenario_attempts wsa
        WHERE wsa.user_id = v_user_id AND wsa.overall_score IS NOT NULL
    ) combined
    ORDER BY created_at DESC LIMIT 1;

    RETURN jsonb_build_object(
        'total', v_total,
        'success_rate', v_success_rate,
        'last_score', ROUND(v_last_score)::INTEGER
    );
END;
$function$;
