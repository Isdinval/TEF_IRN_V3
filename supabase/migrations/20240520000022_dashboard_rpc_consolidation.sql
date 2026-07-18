-- Consolidation de get_dashboard_data
--
-- Contexte : deux versions surchargées de cette fonction existaient en base,
-- créées manuellement hors migrations versionnées :
--   1. get_dashboard_data()               -> version active, utilisée par
--      src/app/tef-irn/dashboard/page.tsx via auth.uid()
--   2. get_dashboard_data(p_user_id uuid) -> version orpheline, plus ancienne,
--      non appelée par le code frontend
--
-- Cette migration :
--   a) supprime la surcharge orpheline (p_user_id)
--   b) fige la version active dans le repo, pour que le contrat de données
--      consommé par le dashboard soit désormais versionné et revu en review

-- (a) Suppression de la surcharge orpheline
DROP FUNCTION IF EXISTS public.get_dashboard_data(uuid);

-- (b) Version active, figée telle qu'observée en production
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
    v_competency_radar JSONB;
    v_sub_competencies JSONB;
    v_vocab_stats JSONB;
    v_in_progress_parcours JSONB;
    v_recommendations JSONB;
    v_league_stats JSONB;
    v_study_time_today INTEGER;
    v_today_start TIMESTAMP WITH TIME ZONE := CURRENT_DATE;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- 1. Profile
    SELECT jsonb_build_object(
        'id', id,
        'username', username,
        'full_name', full_name,
        'avatar_url', avatar_url,
        'current_level', current_level,
        'goal_level', goal_level,
        'total_xp', total_xp,
        'streak_count', streak_count,
        'ai_credits', ai_credits,
        'subscription_tier', subscription_tier,
        'last_active_parcours_id', last_active_parcours_id
    ) INTO v_profile
    FROM public.profiles
    WHERE id = v_user_id;

    -- 2. XP Today & Study Time Today
    SELECT
        COALESCE(SUM(score), 0)::INTEGER,
        COALESCE(SUM(study_time_minutes), 0)::INTEGER
    INTO v_xp_today, v_study_time_today
    FROM public.exercise_attempts
    WHERE user_id = v_user_id AND created_at >= v_today_start;

    -- 3. Recent Corrections
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_recent_corrections
    FROM (
        SELECT
            ea.id,
            ea.created_at,
            ea.score,
            ea.study_time_minutes,
            jsonb_build_object(
                'instructions', e.instructions,
                'type', e.type,
                'category', e.category
            ) as exercise,
            (
                SELECT jsonb_build_object(
                    'overall_score', af.overall_score,
                    'global_comment', af.global_comment,
                    'knowledge_references',
                        CASE
                            WHEN af.knowledge_references IS NOT NULL AND jsonb_array_length(af.knowledge_references) > 0
                            THEN af.knowledge_references
                            ELSE jsonb_build_array(e.category)
                        END
                )
                FROM public.ai_feedback af
                WHERE af.attempt_id = ea.id
                ORDER BY af.created_at DESC
                LIMIT 1
            ) as ai_feedback,
            -- Fallback notions for QCM/TROU without AI feedback
            CASE
                WHEN NOT EXISTS (SELECT 1 FROM public.ai_feedback af WHERE af.attempt_id = ea.id)
                THEN jsonb_build_array(e.category)
                ELSE '[]'::jsonb
            END as manual_notions
        FROM public.exercise_attempts ea
        JOIN public.exercises e ON ea.exercise_id = e.id
        WHERE ea.user_id = v_user_id
        ORDER BY ea.created_at DESC
        LIMIT 5
    ) t;

    -- 4. Reviews Count
    SELECT (
        (SELECT count(*)::INTEGER FROM public.user_reviews WHERE user_id = v_user_id AND next_review_at <= NOW()) +
        (SELECT count(*)::INTEGER FROM public.user_vocabulary_reviews WHERE user_id = v_user_id AND next_review_at <= NOW())
    ) INTO v_reviews_count;

    -- 5. Competency Radar Data
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_competency_radar
    FROM (
        SELECT
            subject,
            CASE
                WHEN count > 0 THEN ROUND(sum / count)
                ELSE 0
            END as A,
            100 as "fullMark"
        FROM (
            SELECT 'GRAMMAIRE' as subject, COALESCE(SUM(ea.score), 0) as sum, COUNT(ea.id) as count
            FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id
            WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND (e.category = 'Grammaire' OR e.type = 'qcm')
            UNION ALL
            SELECT 'RÉDACTION', COALESCE(SUM(ea.score), 0), COUNT(ea.id)
            FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id
            WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.type = 'ecrit'
            UNION ALL
            SELECT 'ÉCRIT', COALESCE(SUM(ea.score), 0), COUNT(ea.id)
            FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id
            WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.type = 'trous'
            UNION ALL
            SELECT 'ORAL', COALESCE(SUM(ea.score), 0), COUNT(ea.id)
            FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id
            WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.type = 'oral'
            UNION ALL
            SELECT 'PARLER', COALESCE(SUM(ea.score), 0), COUNT(ea.id)
            FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id
            WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.type = 'reformulage'
        ) s
    ) t;

    -- 5b. Sub-competencies (Heatmap data)
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_sub_competencies
    FROM (
        SELECT
            e.category as label,
            ROUND(AVG(ea.score)) as score,
            COUNT(ea.id) as count
        FROM public.exercise_attempts ea
        JOIN public.exercises e ON ea.exercise_id = e.id
        WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.category IS NOT NULL
        GROUP BY e.category
        ORDER BY score DESC
    ) t;

    -- 6. Vocab Stats
    SELECT jsonb_build_object(
        'total', count(*),
        'levels', jsonb_build_object(
            'A1', count(*) FILTER (WHERE v.level = 'A1'),
            'A2', count(*) FILTER (WHERE v.level = 'A2'),
            'B1', count(*) FILTER (WHERE v.level = 'B1'),
            'B2', count(*) FILTER (WHERE v.level = 'B2')
        ),
        'topLevel', COALESCE(
            (SELECT level FROM public.user_vocabulary_reviews uvr2 JOIN public.vocabulary v2 ON uvr2.vocab_id = v2.id WHERE uvr2.user_id = v_user_id AND uvr2.consecutive_correct > 0 ORDER BY CASE WHEN level = 'B2' THEN 4 WHEN level = 'B1' THEN 3 WHEN level = 'A2' THEN 2 ELSE 1 END DESC LIMIT 1),
            'A1'
        )
    ) INTO v_vocab_stats
    FROM public.user_vocabulary_reviews uvr
    JOIN public.vocabulary v ON uvr.vocab_id = v.id
    WHERE uvr.user_id = v_user_id AND uvr.consecutive_correct > 0;

    -- 7. In Progress Parcours
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_in_progress_parcours
    FROM (
        SELECT
            p.id, p.level, p.category,
            jsonb_build_object(
                'percent', COALESCE(upp.progress_percentage, 0),
                'total', (SELECT count(*) FROM public.lessons l WHERE l.level = p.level AND l.category = p.category),
                'completed', (SELECT count(*) FROM public.lesson_progress lp JOIN public.lessons l ON lp.lesson_id = l.id WHERE lp.user_id = v_user_id AND l.level = p.level AND l.category = p.category)
            ) as progress,
            COALESCE(upp.updated_at, p.created_at) as sort_date
        FROM public.parcours p
        LEFT JOIN public.user_parcours_progress upp ON upp.parcours_id = p.id AND upp.user_id = v_user_id
        WHERE (upp.user_id = v_user_id AND upp.progress_percentage < 100)
           OR (p.id = (SELECT last_active_parcours_id FROM public.profiles WHERE id = v_user_id))
        ORDER BY sort_date DESC
        LIMIT 2
    ) t;

    -- 8. Recommendations
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_recommendations
    FROM (
        SELECT id, type, reference_id, reason, status, created_at
        FROM public.recommendations
        WHERE user_id = v_user_id AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 4
    ) t;

    -- 9. League Stats
    -- TODO(dashboard-phase-0.6): valeurs actuellement statiques (rank/total_members/league_name
    -- codés en dur), non consommées par le frontend aujourd'hui. À implémenter réellement ou
    -- retirer lors de la phase 0.6 du plan de mise à jour du dashboard.
    SELECT jsonb_build_object(
        'rank', 4,
        'total_members', 25,
        'league_name', 'Diamant'
    ) INTO v_league_stats;

    RETURN jsonb_build_object(
        'profile', v_profile,
        'xp_today', v_xp_today,
        'study_time_today', v_study_time_today,
        'recent_corrections', v_recent_corrections,
        'reviews_count', v_reviews_count,
        'competency_radar', v_competency_radar,
        'sub_competencies', v_sub_competencies,
        'vocab_stats', v_vocab_stats,
        'in_progress_parcours', v_in_progress_parcours,
        'recommendations', v_recommendations,
        'league_stats', v_league_stats
    );
END;
$function$;
