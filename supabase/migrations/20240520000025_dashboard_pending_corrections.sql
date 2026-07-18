-- Ajout de pending_corrections dans get_dashboard_data
--
-- Contexte : StatsOverview affichait une valeur "En attente / Feedback IA"
-- codée en dur à 0. Après correction des deux bugs du flux écrit
-- (URL cassée /api/tef-irn/writing/correct -> /api/writing/correct, et
-- absence d'insert dans ai_feedback), une tentative d'exercice type 'ecrit'
-- avec un score mais sans ligne ai_feedback correspondante représente un
-- échec réel du pipeline de correction (ex: échec silencieux de l'insert
-- ai_feedback, logué côté serveur mais non bloquant). C'est ce que compte
-- pending_corrections : un signal de suivi utile, pas une donnée fabriquée.

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
    v_xp_last_7_days JSONB;
    v_pending_corrections INTEGER;
    v_today_start TIMESTAMP WITH TIME ZONE := CURRENT_DATE;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object(
        'id', id, 'username', username, 'full_name', full_name, 'avatar_url', avatar_url,
        'current_level', current_level, 'goal_level', goal_level, 'total_xp', total_xp,
        'streak_count', streak_count, 'ai_credits', ai_credits, 'subscription_tier', subscription_tier,
        'last_active_parcours_id', last_active_parcours_id
    ) INTO v_profile FROM public.profiles WHERE id = v_user_id;

    SELECT COALESCE(SUM(score), 0)::INTEGER, COALESCE(SUM(study_time_minutes), 0)::INTEGER
    INTO v_xp_today, v_study_time_today
    FROM public.exercise_attempts WHERE user_id = v_user_id AND created_at >= v_today_start;

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

    -- Corrections écrites en attente : tentative 'ecrit' notée mais sans ai_feedback lié
    SELECT count(*)::INTEGER INTO v_pending_corrections
    FROM public.exercise_attempts ea
    JOIN public.exercises e ON ea.exercise_id = e.id
    WHERE ea.user_id = v_user_id
      AND e.type = 'ecrit'
      AND ea.score IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.ai_feedback af WHERE af.attempt_id = ea.id);

    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_recent_corrections
    FROM (
        SELECT ea.id, ea.created_at, ea.score, ea.study_time_minutes,
            jsonb_build_object('instructions', e.instructions, 'type', e.type, 'category', e.category) as exercise,
            (SELECT jsonb_build_object('overall_score', af.overall_score, 'global_comment', af.global_comment,
                'knowledge_references', CASE WHEN af.knowledge_references IS NOT NULL AND jsonb_array_length(af.knowledge_references) > 0 THEN af.knowledge_references ELSE jsonb_build_array(e.category) END)
             FROM public.ai_feedback af WHERE af.attempt_id = ea.id ORDER BY af.created_at DESC LIMIT 1) as ai_feedback,
            CASE WHEN NOT EXISTS (SELECT 1 FROM public.ai_feedback af WHERE af.attempt_id = ea.id) THEN jsonb_build_array(e.category) ELSE '[]'::jsonb END as manual_notions
        FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id
        WHERE ea.user_id = v_user_id ORDER BY ea.created_at DESC LIMIT 5
    ) t;

    SELECT (
        (SELECT count(*)::INTEGER FROM public.user_reviews WHERE user_id = v_user_id AND next_review_at <= NOW()) +
        (SELECT count(*)::INTEGER FROM public.user_vocabulary_reviews WHERE user_id = v_user_id AND next_review_at <= NOW())
    ) INTO v_reviews_count;

    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_competency_radar
    FROM (
        SELECT subject, CASE WHEN count > 0 THEN ROUND(sum / count) ELSE 0 END as A, 100 as "fullMark"
        FROM (
            SELECT 'GRAMMAIRE' as subject, COALESCE(SUM(ea.score), 0) as sum, COUNT(ea.id) as count
            FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id
            WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND (e.category = 'Grammaire' OR e.type = 'qcm')
            UNION ALL
            SELECT 'RÉDACTION', COALESCE(SUM(ea.score), 0), COUNT(ea.id) FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.type = 'ecrit'
            UNION ALL
            SELECT 'ÉCRIT', COALESCE(SUM(ea.score), 0), COUNT(ea.id) FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.type = 'trous'
            UNION ALL
            SELECT 'ORAL', COALESCE(SUM(ea.score), 0), COUNT(ea.id) FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.type = 'oral'
            UNION ALL
            SELECT 'PARLER', COALESCE(SUM(ea.score), 0), COUNT(ea.id) FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.type = 'reformulage'
        ) s
    ) t;

    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_sub_competencies
    FROM (
        SELECT e.category as label, ROUND(AVG(ea.score)) as score, COUNT(ea.id) as count
        FROM public.exercise_attempts ea JOIN public.exercises e ON ea.exercise_id = e.id
        WHERE ea.user_id = v_user_id AND ea.score IS NOT NULL AND e.category IS NOT NULL
        GROUP BY e.category ORDER BY score DESC
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
    FROM (SELECT id, type, reference_id, reason, status, created_at FROM public.recommendations WHERE user_id = v_user_id AND status = 'pending' ORDER BY created_at DESC LIMIT 4) t;

    SELECT jsonb_build_object('rank', 4, 'total_members', 25, 'league_name', 'Diamant') INTO v_league_stats;

    RETURN jsonb_build_object(
        'profile', v_profile, 'xp_today', v_xp_today, 'study_time_today', v_study_time_today,
        'xp_last_7_days', v_xp_last_7_days,
        'pending_corrections', v_pending_corrections,
        'recent_corrections', v_recent_corrections, 'reviews_count', v_reviews_count,
        'competency_radar', v_competency_radar, 'sub_competencies', v_sub_competencies,
        'vocab_stats', v_vocab_stats, 'in_progress_parcours', v_in_progress_parcours,
        'recommendations', v_recommendations, 'league_stats', v_league_stats
    );
END;
$function$;
