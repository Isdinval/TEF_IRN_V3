-- Item 8/10 du plan de correction du dashboard (analyse détaillée) :
--
-- Contrairement à l'Écrit (knowledge_references dérivé de wsa.errors[].type_erreur),
-- l'Oral renvoyait toujours '[]'::jsonb en dur pour knowledge_references : le badge
-- "notions à renforcer" ne pouvait donc jamais afficher de vraies notions cliquables,
-- seulement un badge générique statique (bug d'origine constaté sur le dashboard).
--
-- On dérive désormais ces notions à partir des critères faibles de osr.scores (les
-- mêmes 5 critères déjà utilisés plus bas pour sub_competencies/ORAL), en reprenant
-- exactement les mêmes libellés pour rester cohérent avec le reste du dashboard.
-- Seuil : < 70 (borne B1 dans src/app/api/oral/analyze/route.ts LEVEL_THRESHOLDS),
-- donc "à renforcer" = en-dessous du niveau B1 sur ce critère précis.

CREATE OR REPLACE FUNCTION public.get_dashboard_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_profile JSONB;
    v_xp_today INTEGER;
    v_recent_corrections JSONB;
    v_reviews_count INTEGER;
    v_vocab_reviews_due INTEGER;
    v_exercise_reviews_due INTEGER;
    v_weak_points JSONB;
    v_competency_radar JSONB;
    v_sub_competencies JSONB;
    v_vocab_stats JSONB;
    v_in_progress_parcours JSONB;
    v_recommendations JSONB;
    v_league_stats JSONB;
    v_study_time_today INTEGER;
    v_xp_last_7_days JSONB;
    v_pending_corrections INTEGER;
    v_user_total_xp INTEGER;
    v_league_name TEXT;
    v_league_min_xp INTEGER;
    v_next_league_min_xp INTEGER;
    v_today_start TIMESTAMP WITH TIME ZONE := CURRENT_DATE;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object(
        'id', id, 'username', username, 'full_name', full_name, 'avatar_url', avatar_url,
        'current_level', current_level, 'goal_level', goal_level, 'total_xp', total_xp,
        'streak_count', streak_count, 'ai_credits', ai_credits, 'subscription_tier', subscription_tier,
        'last_active_parcours_id', last_active_parcours_id, 'onboarding_completed', onboarding_completed,
        'target_exam_date', target_exam_date
    ) INTO v_profile FROM public.profiles WHERE id = v_user_id;

    SELECT COALESCE(SUM(score), 0)::INTEGER
    INTO v_xp_today
    FROM public.exercise_attempts WHERE user_id = v_user_id AND created_at >= v_today_start;

    SELECT COALESCE(minutes, 0) INTO v_study_time_today
    FROM public.study_activity WHERE user_id = v_user_id AND activity_date = CURRENT_DATE;
    v_study_time_today := COALESCE(v_study_time_today, 0);

    SELECT COALESCE(jsonb_agg(jsonb_build_object('day', day_label, 'xp', xp) ORDER BY day_date), '[]'::jsonb)
    INTO v_xp_last_7_days
    FROM (
        SELECT
            gs::date AS day_date,
            CASE EXTRACT(DOW FROM gs)
                WHEN 0 THEN 'Dim' WHEN 1 THEN 'Lun' WHEN 2 THEN 'Mar' WHEN 3 THEN 'Mer'
                WHEN 4 THEN 'Jeu' WHEN 5 THEN 'Ven' WHEN 6 THEN 'Sam'
            END AS day_label,
            COALESCE((
                SELECT SUM(ea.score)::INTEGER
                FROM public.exercise_attempts ea
                WHERE ea.user_id = v_user_id AND ea.created_at::date = gs::date
            ), 0) AS xp
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, INTERVAL '1 day') gs
    ) s;

    SELECT count(*)::INTEGER INTO v_pending_corrections
    FROM public.exercise_attempts ea
    JOIN public.exercises e ON ea.exercise_id = e.id
    WHERE ea.user_id = v_user_id
      AND e.type = 'ecrit'
      AND ea.score IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.ai_feedback af WHERE af.attempt_id = ea.id);

    SELECT COALESCE(jsonb_agg(t ORDER BY t.created_at DESC), '[]'::jsonb) INTO v_recent_corrections
    FROM (
        SELECT id, created_at, score, study_time_minutes, exercise, ai_feedback, manual_notions
        FROM (
            SELECT ea.id, ea.created_at, ea.score, ea.study_time_minutes,
                jsonb_build_object(
                    'instructions', e.instructions, 'type', e.type, 'category', e.category,
                    'skill', CASE WHEN e.type = 'ecrit' THEN 'EE' ELSE NULL END
                ) as exercise,
                (SELECT jsonb_build_object('overall_score', af.overall_score, 'global_comment', af.global_comment,
                    'knowledge_references', CASE WHEN af.knowledge_references IS NOT NULL AND jsonb_array_length(af.knowledge_references) > 0 THEN af.knowledge_references ELSE jsonb_build_array(e.category) END)
                 FROM public.ai_feedback af WHERE af.attempt_id = ea.id ORDER BY af.created_at DESC LIMIT 1) as ai_feedback,
                CASE WHEN NOT EXISTS (SELECT 1 FROM public.ai_feedback af WHERE af.attempt_id = ea.id) THEN jsonb_build_array(e.category) ELSE '[]'::jsonb END as manual_notions,
                ROW_NUMBER() OVER (ORDER BY ea.created_at DESC) as rn
            FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id
            WHERE ea.user_id = v_user_id
        ) ex WHERE rn <= 5

        UNION ALL

        SELECT id, created_at, score, study_time_minutes, exercise, ai_feedback, manual_notions
        FROM (
            SELECT wsa.id, wsa.created_at, wsa.overall_score::double precision as score, wsa.study_time_minutes,
                jsonb_build_object(
                    'instructions', COALESCE(wes.sujet, eq.instructions, 'Sujet d''examen blanc'),
                    'type', CASE WHEN wsa.context = 'exam' THEN 'examen_blanc' ELSE 'ecrit' END,
                    'category', wsa.section,
                    'skill', 'EE'
                ) as exercise,
                jsonb_build_object(
                    'overall_score', wsa.overall_score,
                    'global_comment', wsa.general_comment,
                    'knowledge_references', COALESCE((
                        SELECT jsonb_agg(DISTINCT err->>'type_erreur')
                        FROM jsonb_array_elements(wsa.errors) err
                    ), '[]'::jsonb)
                ) as ai_feedback,
                '[]'::jsonb as manual_notions,
                ROW_NUMBER() OVER (ORDER BY wsa.created_at DESC) as rn
            FROM public.writing_scenario_attempts wsa
            LEFT JOIN public.writing_exam_scenarios wes ON wes.id = wsa.scenario_id
            LEFT JOIN public.exam_questions eq ON eq.id = wsa.exam_question_id
            WHERE wsa.user_id = v_user_id
        ) wb WHERE rn <= 5

        UNION ALL

        SELECT id, created_at, score, study_time_minutes, exercise, ai_feedback, manual_notions
        FROM (
            SELECT osr.id, osr.created_at, osr.overall_score::double precision as score, 0 as study_time_minutes,
                jsonb_build_object(
                    'instructions', COALESCE(oes.title, 'Session d''entretien oral'),
                    'type', CASE WHEN osr.context = 'exam' THEN 'examen_blanc' ELSE 'entretien_oral' END,
                    'category', osr.section,
                    'skill', 'EO'
                ) as exercise,
                jsonb_build_object(
                    'overall_score', osr.overall_score,
                    'global_comment', osr.general_comment,
                    'knowledge_references', COALESCE((
                        SELECT jsonb_agg(w.label)
                        FROM (
                            SELECT 'Grammaire' as label WHERE (osr.scores->>'correction_grammaticale')::double precision < 70
                            UNION ALL
                            SELECT 'Vocabulaire' WHERE (osr.scores->>'etendue_et_precision_du_vocabulaire')::double precision < 70
                            UNION ALL
                            SELECT 'Pertinence & adéquation au sujet' WHERE (osr.scores->>'pertinence_et_adequation_au_sujet')::double precision < 70
                            UNION ALL
                            SELECT 'Cohérence & interaction' WHERE (osr.scores->>'coherence_et_interaction')::double precision < 70
                            UNION ALL
                            SELECT 'Aisance & fluidité' WHERE (osr.scores->>'aisance_et_fluidite')::double precision < 70
                        ) w
                    ), '[]'::jsonb)
                ) as ai_feedback,
                '[]'::jsonb as manual_notions,
                ROW_NUMBER() OVER (ORDER BY osr.created_at DESC) as rn
            FROM public.oral_session_results osr
            LEFT JOIN public.oral_exam_scenarios oes ON oes.id = osr.scenario_id
            WHERE osr.user_id = v_user_id
        ) orl WHERE rn <= 5
    ) t;

    SELECT count(*)::INTEGER INTO v_exercise_reviews_due
    FROM public.user_reviews WHERE user_id = v_user_id AND next_review_at <= NOW();

    SELECT count(*)::INTEGER INTO v_vocab_reviews_due
    FROM public.user_vocabulary_reviews WHERE user_id = v_user_id AND next_review_at <= NOW();

    v_reviews_count := v_exercise_reviews_due + v_vocab_reviews_due;

    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_weak_points
    FROM (
        SELECT category, sub_category, frequency, last_seen_at
        FROM public.user_errors
        WHERE user_id = v_user_id
        ORDER BY frequency DESC, last_seen_at DESC
        LIMIT 3
    ) t;

    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_competency_radar
    FROM (
        SELECT 'CE' as subject, ROUND(sum / count) as "A", 100 as "fullMark"
        FROM (
            SELECT COALESCE(SUM(ea.score), 0) as sum, COUNT(ea.id) as count
            FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id
            WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL
              AND e.type IN ('qcm', 'trous', 'qcm_centre_entrainement')
        ) s WHERE count > 0
        UNION ALL
        SELECT 'EE', ROUND(sum / count), 100
        FROM (
            SELECT
                COALESCE((SELECT SUM(ea.score) FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.type = 'ecrit'), 0)
                + COALESCE((SELECT SUM(overall_score) FROM public.writing_scenario_attempts WHERE user_id = v_user_id AND overall_score IS NOT NULL), 0) as sum,
                COALESCE((SELECT COUNT(*) FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.type = 'ecrit'), 0)
                + COALESCE((SELECT COUNT(*) FROM public.writing_scenario_attempts WHERE user_id = v_user_id AND overall_score IS NOT NULL), 0) as count
        ) s WHERE count > 0
        UNION ALL
        SELECT 'EO', ROUND(sum / count), 100
        FROM (
            SELECT COALESCE(SUM(overall_score), 0) as sum, COUNT(id) as count
            FROM public.oral_session_results
            WHERE user_id = v_user_id AND overall_score IS NOT NULL
        ) s WHERE count > 0
    ) t;

    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_sub_competencies
    FROM (
        SELECT label, group_name, ROUND(AVG(score)) as score, COUNT(*) as count
        FROM (
            SELECT e.category as label, 'ÉCRIT' as group_name, ea.score as score
            FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id
            WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.category IS NOT NULL

            UNION ALL

            SELECT DISTINCT INITCAP(err->>'type_erreur') as label, 'ÉCRIT' as group_name, wsa.overall_score::double precision as score
            FROM public.writing_scenario_attempts wsa
            CROSS JOIN LATERAL jsonb_array_elements(wsa.errors) err
            WHERE wsa.user_id = v_user_id AND wsa.overall_score IS NOT NULL

            UNION ALL

            SELECT 'Grammaire' as label, 'ORAL' as group_name, (osr.scores->>'correction_grammaticale')::double precision as score
            FROM public.oral_session_results osr
            WHERE osr.user_id = v_user_id AND osr.scores ? 'correction_grammaticale'

            UNION ALL

            SELECT 'Vocabulaire', 'ORAL', (osr.scores->>'etendue_et_precision_du_vocabulaire')::double precision
            FROM public.oral_session_results osr
            WHERE osr.user_id = v_user_id AND osr.scores ? 'etendue_et_precision_du_vocabulaire'

            UNION ALL

            SELECT 'Pertinence & adéquation au sujet', 'ORAL', (osr.scores->>'pertinence_et_adequation_au_sujet')::double precision
            FROM public.oral_session_results osr
            WHERE osr.user_id = v_user_id AND osr.scores ? 'pertinence_et_adequation_au_sujet'

            UNION ALL

            SELECT 'Cohérence & interaction', 'ORAL', (osr.scores->>'coherence_et_interaction')::double precision
            FROM public.oral_session_results osr
            WHERE osr.user_id = v_user_id AND osr.scores ? 'coherence_et_interaction'

            UNION ALL

            SELECT 'Aisance & fluidité', 'ORAL', (osr.scores->>'aisance_et_fluidite')::double precision
            FROM public.oral_session_results osr
            WHERE osr.user_id = v_user_id AND osr.scores ? 'aisance_et_fluidite'
        ) combined
        GROUP BY label, group_name ORDER BY group_name, score DESC
    ) t;

    SELECT jsonb_build_object(
        'total', count(*),
        'levels', jsonb_build_object('A1', count(*) FILTER (WHERE v.level = 'A1'), 'A2', count(*) FILTER (WHERE v.level = 'A2'), 'B1', count(*) FILTER (WHERE v.level = 'B1'), 'B2', count(*) FILTER (WHERE v.level = 'B2')),
        'topLevel', COALESCE((SELECT level FROM public.user_vocabulary_reviews uvr2 JOIN public.vocabulary v2 ON uvr2.vocab_id = v2.id WHERE uvr2.user_id = v_user_id AND uvr2.consecutive_correct > 0 ORDER BY CASE WHEN level = 'B2' THEN 4 WHEN level = 'B1' THEN 3 WHEN level = 'A2' THEN 2 ELSE 1 END DESC LIMIT 1), 'A1')
    ) INTO v_vocab_stats
    FROM public.user_vocabulary_reviews uvr JOIN public.vocabulary v ON uvr.vocab_id = v.id WHERE uvr.user_id = v_user_id AND uvr.consecutive_correct > 0;

    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_in_progress_parcours
    FROM (
        SELECT p.id, p.slug, p.level, p.category,
            jsonb_build_object('percent', COALESCE(upp.progress_percentage, 0),
                'total', (SELECT count(*) FROM public.lessons l WHERE l.level = p.level AND l.category = p.category),
                'completed', (SELECT count(*) FROM public.lesson_progress lp JOIN public.lessons l ON lp.lesson_id = l.id WHERE lp.user_id = v_user_id AND l.level = p.level AND l.category = p.category)) as progress,
            COALESCE(upp.updated_at, p.created_at) as sort_date
        FROM public.parcours p
        LEFT JOIN public.user_parcours_progress upp ON upp.parcours_id = p.id AND upp.user_id = v_user_id
        WHERE (upp.user_id = v_user_id AND upp.progress_percentage < 100) OR (p.id = (SELECT last_active_parcours_id FROM public.profiles WHERE id = v_user_id))
        ORDER BY sort_date DESC LIMIT 2
    ) t;

    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_recommendations
    FROM (
        SELECT r.id, r.type, r.reference_id, r.reason, r.status, r.created_at, l.slug
        FROM public.recommendations r
        LEFT JOIN public.lessons l ON r.type = 'lesson' AND l.id = r.reference_id
        WHERE r.user_id = v_user_id AND r.status = 'pending'
        ORDER BY r.created_at DESC LIMIT 4
    ) t;

    SELECT total_xp INTO v_user_total_xp FROM public.profiles WHERE id = v_user_id;

    SELECT name, min_xp INTO v_league_name, v_league_min_xp
    FROM public.leagues
    WHERE min_xp <= COALESCE(v_user_total_xp, 0)
    ORDER BY min_xp DESC
    LIMIT 1;

    SELECT min_xp INTO v_next_league_min_xp
    FROM public.leagues
    WHERE min_xp > v_league_min_xp
    ORDER BY min_xp ASC
    LIMIT 1;

    IF v_league_name IS NOT NULL THEN
        SELECT jsonb_build_object(
            'league_name', v_league_name,
            'rank', (
                SELECT count(*)::INTEGER + 1 FROM public.profiles p2
                WHERE p2.total_xp > v_user_total_xp
                  AND p2.total_xp >= v_league_min_xp
                  AND (v_next_league_min_xp IS NULL OR p2.total_xp < v_next_league_min_xp)
            ),
            'total_members', (
                SELECT count(*)::INTEGER FROM public.profiles p3
                WHERE p3.total_xp >= v_league_min_xp
                  AND (v_next_league_min_xp IS NULL OR p3.total_xp < v_next_league_min_xp)
            )
        ) INTO v_league_stats;
    ELSE
        v_league_stats := NULL;
    END IF;

    RETURN jsonb_build_object(
        'profile', v_profile, 'xp_today', v_xp_today, 'study_time_today', v_study_time_today,
        'xp_last_7_days', v_xp_last_7_days,
        'pending_corrections', v_pending_corrections,
        'recent_corrections', v_recent_corrections,
        'reviews_count', v_reviews_count,
        'vocab_reviews_due', v_vocab_reviews_due,
        'exercise_reviews_due', v_exercise_reviews_due,
        'weak_points', v_weak_points,
        'competency_radar', v_competency_radar, 'sub_competencies', v_sub_competencies,
        'vocab_stats', v_vocab_stats, 'in_progress_parcours', v_in_progress_parcours,
        'recommendations', v_recommendations, 'league_stats', v_league_stats
    );
END;
$function$;
