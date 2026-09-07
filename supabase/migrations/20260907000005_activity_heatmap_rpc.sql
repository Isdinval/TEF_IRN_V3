-- RPC dédiée pour la future card "Régularité" (idée 5/plan "cards
-- dashboard", dernière du backlog), même esprit que les RPC stats
-- précédentes : séparée plutôt que d'alourdir get_dashboard_data().
--
-- Source : public.study_activity (heartbeat, une ligne par user/jour avec
-- les minutes étudiées -- déjà utilisée pour study_time_today dans
-- get_dashboard_data). Choisie plutôt qu'un recalcul depuis
-- exercise_attempts/xp_last_7_days : c'est la seule table qui reflète
-- fidèlement "l'utilisateur a été actif ce jour-là", tous types d'activité
-- confondus (leçon, QCM, Trous, EE, EO), et pas seulement les XP d'exercices
-- scorés.
--
-- 84 jours (12 semaines) : format "heatmap de contributions" compact et
-- lisible, calqué sur les heatmaps de régularité usuelles (GitHub-like).
-- generate_series + LEFT JOIN pour renvoyer explicitement 0 minute sur les
-- jours sans ligne study_activity, plutôt que de sauter ces jours (nécessaire
-- pour une grille régulière côté front).

CREATE OR REPLACE FUNCTION public.get_activity_heatmap()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id UUID := auth.uid();
    v_days CONSTANT INTEGER := 84;
    v_result JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object('date', gs::date, 'minutes', COALESCE(sa.minutes, 0))
        ORDER BY gs
    ), '[]'::jsonb)
    INTO v_result
    FROM generate_series(CURRENT_DATE - (v_days - 1), CURRENT_DATE, INTERVAL '1 day') gs
    LEFT JOIN public.study_activity sa ON sa.user_id = v_user_id AND sa.activity_date = gs::date;

    RETURN v_result;
END;
$function$;
