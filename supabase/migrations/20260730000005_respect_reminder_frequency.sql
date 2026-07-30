-- Respecte enfin la préférence frequency (immediate/daily/weekly) de
-- user_preferences, jusqu'ici ignorée : tout le monde recevait au même
-- rythme que le cron (quotidien).
--
-- Contrainte réelle : le cron Vercel ne tourne qu'une fois par jour (limite
-- du plan Hobby). 'immediate' est donc traité comme 'daily' pour l'instant
-- (c'est le maximum de fréquence qu'on peut offrir aujourd'hui) — pas un
-- vrai envoi instantané. 'weekly' n'est renvoyé que si le dernier rappel
-- date de plus de ~6.5 jours.
--
-- Signature de retour inchangée (user_id, email, due_exercises_count,
-- due_vocab_count) → CREATE OR REPLACE suffit, pas de DROP nécessaire.

CREATE OR REPLACE FUNCTION public.get_due_srs_reminders()
 RETURNS TABLE (
   user_id UUID,
   email TEXT,
   due_exercises_count BIGINT,
   due_vocab_count BIGINT
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    u.email::TEXT,
    COALESCE(ex.cnt, 0) AS due_exercises_count,
    COALESCE(vo.cnt, 0) AS due_vocab_count
  FROM user_preferences up
  JOIN auth.users u ON u.id = up.user_id
  LEFT JOIN (
    SELECT ur.user_id AS uid, COUNT(*) AS cnt
    FROM public.user_reviews ur
    WHERE ur.next_review_at <= NOW()
    GROUP BY ur.user_id
  ) ex ON ex.uid = up.user_id
  LEFT JOIN (
    SELECT uvr.user_id AS uid, COUNT(*) AS cnt
    FROM public.user_vocabulary_reviews uvr
    WHERE uvr.next_review_at <= NOW()
    GROUP BY uvr.user_id
  ) vo ON vo.uid = up.user_id
  WHERE up.email_reminders = true
    AND (COALESCE(ex.cnt, 0) + COALESCE(vo.cnt, 0)) > 0
    AND (
      up.last_srs_reminder_at IS NULL
      OR (up.frequency = 'weekly' AND up.last_srs_reminder_at < NOW() - INTERVAL '6 days 12 hours')
      OR (up.frequency IN ('daily', 'immediate') AND up.last_srs_reminder_at < NOW() - INTERVAL '20 hours')
      OR (up.frequency IS NULL AND up.last_srs_reminder_at < NOW() - INTERVAL '20 hours')
    );
END;
$function$;

REVOKE ALL ON FUNCTION public.get_due_srs_reminders() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_due_srs_reminders() TO service_role;
