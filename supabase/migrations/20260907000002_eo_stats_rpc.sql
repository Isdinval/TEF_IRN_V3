-- RPC dédiée pour la future OralStatsCard de l'onglet "Ma progression",
-- même esprit que get_qcm_stats/get_trous_stats (migration 20260831000001)
-- mais adaptée : contrairement au QCM/Trous, l'oral n'a pas de "catalogue"
-- fini à maîtriser (pas de colonne levels_available pertinente) -- c'est un
-- volume de pratique (sessions) avec un score par session, pas des exercices
-- discrets qu'on coche un par un. Le triptyque affiché ici est donc :
-- volume de sessions, score moyen/dernière session, et le critère du barème
-- officiel le plus faible en moyenne (un seul, volontairement -- l'analyse
-- complète des 5 critères existe déjà via SubSkillHeatmap/PerformanceRadar
-- dans l'onglet "Analyse", pas de duplication ici).
--
-- Compte TOUTES les sessions (standalone + exam), à la différence de l'item
-- "eo" de get_today_checklist qui ne compte que le standalone -- ici on
-- mesure le volume total de pratique orale, peu importe son contexte.

CREATE OR REPLACE FUNCTION public.get_eo_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_total INTEGER;
    v_a2 INTEGER;
    v_b1 INTEGER;
    v_b2 INTEGER;
    v_success_rate INTEGER;
    v_last_score INTEGER;
    v_weakest_label TEXT;
    v_weakest_score INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT
        count(*),
        count(*) FILTER (WHERE level = 'A2'),
        count(*) FILTER (WHERE level = 'B1'),
        count(*) FILTER (WHERE level = 'B2'),
        ROUND(AVG(overall_score))::INTEGER
    INTO v_total, v_a2, v_b1, v_b2, v_success_rate
    FROM public.oral_session_results
    WHERE user_id = v_user_id AND overall_score IS NOT NULL;

    v_total := COALESCE(v_total, 0);

    IF v_total = 0 THEN
        RETURN jsonb_build_object(
            'total', 0,
            'levels', jsonb_build_object('A2', 0, 'B1', 0, 'B2', 0),
            'success_rate', NULL,
            'last_score', NULL,
            'weakest_criterion', NULL
        );
    END IF;

    SELECT overall_score INTO v_last_score
    FROM public.oral_session_results
    WHERE user_id = v_user_id AND overall_score IS NOT NULL
    ORDER BY created_at DESC LIMIT 1;

    -- Critère le plus faible en moyenne parmi les 5 du barème officiel
    -- (mêmes clés que get_dashboard_data / SubSkillHeatmap).
    SELECT label, ROUND(avg_score)::INTEGER INTO v_weakest_label, v_weakest_score
    FROM (
        SELECT 'Grammaire' as label, AVG((scores->>'correction_grammaticale')::double precision) as avg_score
        FROM public.oral_session_results WHERE user_id = v_user_id AND scores ? 'correction_grammaticale'
        UNION ALL
        SELECT 'Vocabulaire', AVG((scores->>'etendue_et_precision_du_vocabulaire')::double precision)
        FROM public.oral_session_results WHERE user_id = v_user_id AND scores ? 'etendue_et_precision_du_vocabulaire'
        UNION ALL
        SELECT 'Pertinence au sujet', AVG((scores->>'pertinence_et_adequation_au_sujet')::double precision)
        FROM public.oral_session_results WHERE user_id = v_user_id AND scores ? 'pertinence_et_adequation_au_sujet'
        UNION ALL
        SELECT 'Cohérence & interaction', AVG((scores->>'coherence_et_interaction')::double precision)
        FROM public.oral_session_results WHERE user_id = v_user_id AND scores ? 'coherence_et_interaction'
        UNION ALL
        SELECT 'Aisance & fluidité', AVG((scores->>'aisance_et_fluidite')::double precision)
        FROM public.oral_session_results WHERE user_id = v_user_id AND scores ? 'aisance_et_fluidite'
    ) crit
    WHERE avg_score IS NOT NULL
    ORDER BY avg_score ASC LIMIT 1;

    RETURN jsonb_build_object(
        'total', v_total,
        'levels', jsonb_build_object('A2', COALESCE(v_a2, 0), 'B1', COALESCE(v_b1, 0), 'B2', COALESCE(v_b2, 0)),
        'success_rate', v_success_rate,
        'last_score', v_last_score,
        'weakest_criterion', CASE
            WHEN v_weakest_label IS NOT NULL THEN jsonb_build_object('label', v_weakest_label, 'score', v_weakest_score)
            ELSE NULL
        END
    );
END;
$function$;
