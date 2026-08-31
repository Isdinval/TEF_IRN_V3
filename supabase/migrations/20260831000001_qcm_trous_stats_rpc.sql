-- Item 1/2 du plan "Key metrics QCM/Trous" -- RPC dédiées pour alimenter les
-- futures QcmStatsCard / TrousStatsCard de l'onglet "Ma progression" du
-- dashboard, sur le même modèle que le bloc vocab_stats de get_dashboard_data()
-- mais volontairement séparées (choix validé avec Olivier) plutôt que
-- d'alourdir davantage la RPC consolidée existante.
--
-- Définition de "maîtrisé" : alignée sur le SRS déjà en place pour les
-- exercices (table user_reviews, alimentée par updateSRS() dans
-- src/lib/srs-engine-server.ts, isCorrect = score >= 80) -- consecutive_correct > 0.
-- Identique en sémantique au calcul vocab_stats de get_dashboard_data()
-- (public.user_vocabulary_reviews, même seuil consecutive_correct > 0).
--
-- QCM = mêmes types que le catalogue PracticeTreeCatalogue (page
-- /tef-irn/practice) : qcm, association, qcm_centre_entrainement.
-- Trous = type 'trous', catalogue GrammarCheckTreeCatalogue (/tef-irn/grammar-check).

CREATE OR REPLACE FUNCTION public.get_qcm_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_total INTEGER;
    v_a1 INTEGER;
    v_a2 INTEGER;
    v_b1 INTEGER;
    v_b2 INTEGER;
    v_success_rate INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT
        count(*) FILTER (WHERE ur.consecutive_correct > 0),
        count(*) FILTER (WHERE ur.consecutive_correct > 0 AND e.level = 'A1'),
        count(*) FILTER (WHERE ur.consecutive_correct > 0 AND e.level = 'A2'),
        count(*) FILTER (WHERE ur.consecutive_correct > 0 AND e.level = 'B1'),
        count(*) FILTER (WHERE ur.consecutive_correct > 0 AND e.level = 'B2')
    INTO v_total, v_a1, v_a2, v_b1, v_b2
    FROM public.user_reviews ur
    JOIN public.exercises e ON e.id = ur.exercise_id
    WHERE ur.user_id = v_user_id
      AND e.type IN ('qcm', 'association', 'qcm_centre_entrainement');

    -- Taux de réussite : moyenne des scores de tentatives complétées (toutes
    -- tentatives, pas seulement la dernière), même granularité que le badge
    -- "Niveau {topLevel}" qu'il remplace visuellement dans VocabStatsCard.
    SELECT ROUND(AVG(ea.score))::INTEGER
    INTO v_success_rate
    FROM public.exercise_attempts ea
    JOIN public.exercises e ON e.id = ea.exercise_id
    WHERE ea.user_id = v_user_id
      AND e.type IN ('qcm', 'association', 'qcm_centre_entrainement')
      AND ea.score IS NOT NULL;

    RETURN jsonb_build_object(
        'total', COALESCE(v_total, 0),
        'levels', jsonb_build_object(
            'A1', COALESCE(v_a1, 0), 'A2', COALESCE(v_a2, 0),
            'B1', COALESCE(v_b1, 0), 'B2', COALESCE(v_b2, 0)
        ),
        'success_rate', v_success_rate
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_trous_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_total INTEGER;
    v_a1 INTEGER;
    v_a2 INTEGER;
    v_b1 INTEGER;
    v_b2 INTEGER;
    v_success_rate INTEGER;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT
        count(*) FILTER (WHERE ur.consecutive_correct > 0),
        count(*) FILTER (WHERE ur.consecutive_correct > 0 AND e.level = 'A1'),
        count(*) FILTER (WHERE ur.consecutive_correct > 0 AND e.level = 'A2'),
        count(*) FILTER (WHERE ur.consecutive_correct > 0 AND e.level = 'B1'),
        count(*) FILTER (WHERE ur.consecutive_correct > 0 AND e.level = 'B2')
    INTO v_total, v_a1, v_a2, v_b1, v_b2
    FROM public.user_reviews ur
    JOIN public.exercises e ON e.id = ur.exercise_id
    WHERE ur.user_id = v_user_id
      AND e.type = 'trous';

    SELECT ROUND(AVG(ea.score))::INTEGER
    INTO v_success_rate
    FROM public.exercise_attempts ea
    JOIN public.exercises e ON e.id = ea.exercise_id
    WHERE ea.user_id = v_user_id
      AND e.type = 'trous'
      AND ea.score IS NOT NULL;

    RETURN jsonb_build_object(
        'total', COALESCE(v_total, 0),
        'levels', jsonb_build_object(
            'A1', COALESCE(v_a1, 0), 'A2', COALESCE(v_a2, 0),
            'B1', COALESCE(v_b1, 0), 'B2', COALESCE(v_b2, 0)
        ),
        'success_rate', v_success_rate
    );
END;
$function$;
