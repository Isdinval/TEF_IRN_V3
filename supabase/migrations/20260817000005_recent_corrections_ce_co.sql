-- Item 12 du plan "Refonte recommandation erreur -> tag -> ressource" :
-- CE et CO d'examen blanc n'apparaissaient jamais dans le bloc "Examen blanc"
-- des Corrections recentes du dashboard (seuls EE/EO y remontaient, via
-- writing_scenario_attempts/oral_session_results).
--
-- exam_ce_co_attempts (item 4) n'a qu'1 ligne par QUESTION repondue, pas par
-- section -- il faut regrouper pour reconstituer 1 "carte" de correction par
-- section completee, comme EE/EO. Regroupement par (user_id, exam_id via
-- jointure exam_questions, section, created_at) : toutes les questions
-- d'une meme section, inserees en un seul appel API (ExamContext.tsx ->
-- /api/exam/ce-co-complete), partagent exactement le meme created_at
-- (verifie : now() est stable sur toute la transaction en Postgres, y
-- compris pour un INSERT multi-lignes).
--
-- Decision produit validee avec Olivier (Option A) : la carte CE/CO affiche
-- le score et les notions a retravailler (badges cliquables vers
-- /tef-irn/practice, comme EE/EO), mais n'a PAS d'action au clic sur la
-- carte elle-meme -- contrairement a EE/EO, aucune page de detail CE/CO
-- n'existe aujourd'hui. Cote front (composant RecentCorrectionsList), livre
-- separement dans ce meme item.
--
-- Seul changement : ajout d'un 4e bloc UNION ALL dans la sous-requete
-- v_recent_corrections, sur le modele des 3 blocs EE/EO/exercices deja
-- presents. Aucun autre bloc de la fonction n'est modifie (reprend les fix
-- items 1 et 11 deja appliques).
--
-- Teste avant livraison : fonction complete testee en transaction
-- (BEGIN/CREATE OR REPLACE/ROLLBACK), et le bloc CE/CO isole teste avec
-- deux questions d'un meme examen (une juste, une fausse) inserees dans
-- exam_ce_co_attempts -- un seul groupe produit, score 50/100, une seule
-- notion faible remontee (la question fausse), conforme a l'attendu.

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
                        SELECT jsonb_agg(DISTINCT
                            INITCAP(err->>'type_erreur') ||
                            CASE WHEN err->>'sous_categorie' IS NOT NULL AND err->>'sous_categorie' <> ''
                                 THEN ' (' || INITCAP(err->>'sous_categorie') || ')'
                                 ELSE '' END
                        )
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

        UNION ALL

        -- CE/CO d'examen blanc (item 12) : exam_ce_co_attempts n'a qu'1 ligne
        -- par QUESTION repondue (item 4) -- on regroupe ici par section
        -- completee (meme exam_id + section + created_at, identique pour
        -- toutes les questions d'un meme appel de finishSection(), verifie :
        -- now() est stable sur toute la transaction) pour reconstituer 1
        -- "carte" de correction par section, comme EE/EO.
        SELECT id, created_at, score, study_time_minutes, exercise, ai_feedback, manual_notions
        FROM (
            SELECT
                (array_agg(a.id))[1] as id,
                a.created_at,
                ROUND((COUNT(*) FILTER (WHERE a.is_correct))::numeric / NULLIF(COUNT(*), 0) * 100)::double precision as score,
                0 as study_time_minutes,
                jsonb_build_object(
                    'instructions', CASE WHEN a.section = 'CE' THEN 'Compréhension Écrite' ELSE 'Compréhension Orale' END,
                    'type', 'examen_blanc',
                    'category', a.section,
                    'skill', a.section
                ) as exercise,
                jsonb_build_object(
                    'overall_score', ROUND((COUNT(*) FILTER (WHERE a.is_correct))::numeric / NULLIF(COUNT(*), 0) * 100),
                    'global_comment', NULL,
                    'knowledge_references', COALESCE(jsonb_agg(DISTINCT
                        INITCAP(eq.category) ||
                        CASE WHEN eq.tags IS NOT NULL AND array_length(eq.tags, 1) > 0
                             THEN ' (' || INITCAP(eq.tags[1]) || ')'
                             ELSE '' END
                    ) FILTER (WHERE NOT a.is_correct AND eq.category IS NOT NULL), '[]'::jsonb)
                ) as ai_feedback,
                '[]'::jsonb as manual_notions,
                ROW_NUMBER() OVER (ORDER BY a.created_at DESC) as rn
            FROM public.exam_ce_co_attempts a
            JOIN public.exam_questions eq ON eq.id = a.exam_question_id
            WHERE a.user_id = v_user_id
            GROUP BY a.user_id, eq.exam_id, a.section, a.created_at
        ) ceco WHERE rn <= 5
    ) t;

    SELECT count(*)::INTEGER INTO v_exercise_reviews_due
    FROM public.user_reviews WHERE user_id = v_user_id AND next_review_at <= NOW();

    SELECT count(*)::INTEGER INTO v_vocab_reviews_due
    FROM public.user_vocabulary_reviews WHERE user_id = v_user_id AND next_review_at <= NOW();

    v_reviews_count := v_exercise_reviews_due + v_vocab_reviews_due;

    -- FIX (item 11) : depriorisation (pas suppression) des points faibles
    -- dont last_seen_at depasse 30 jours -- ils passent apres tous les
    -- points recents dans le tri, quelle que soit leur frequency.
    SELECT COALESCE(jsonb_agg(t), '[]'::jsonb) INTO v_weak_points
    FROM (
        SELECT category, sub_category, frequency, last_seen_at, source_label
        FROM public.user_errors
        WHERE user_id = v_user_id
        ORDER BY (last_seen_at < now() - interval '30 days') ASC, frequency DESC, last_seen_at DESC
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
        SELECT r.id, r.type, r.reference_id, r.reason, r.status, r.created_at, r.category, r.sub_category, l.slug
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
