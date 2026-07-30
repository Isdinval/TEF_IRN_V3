-- Ajoute le module Examen Civique au rappel email unique existant (une
-- seule préférence email_reminders couvre les deux modules, pas de
-- toggle séparé côté Réglages) : due_civic_count en 3e compte, même
-- logique que due_exercises_count / due_vocab_count.
--
-- Signature de retour changée (nouvelle colonne) → DROP requis avant
-- CREATE, comme pour le passage due_count -> due_exercises/due_vocab.

DROP FUNCTION IF EXISTS public.get_due_srs_reminders();

CREATE OR REPLACE FUNCTION public.get_due_srs_reminders()
 RETURNS TABLE (
   user_id UUID,
   email TEXT,
   due_exercises_count BIGINT,
   due_vocab_count BIGINT,
   due_civic_count BIGINT
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
    COALESCE(vo.cnt, 0) AS due_vocab_count,
    COALESCE(ci.cnt, 0) AS due_civic_count
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
  LEFT JOIN (
    SELECT ucr.user_id AS uid, COUNT(*) AS cnt
    FROM public.user_civic_reviews ucr
    WHERE ucr.next_review_at <= NOW()
    GROUP BY ucr.user_id
  ) ci ON ci.uid = up.user_id
  WHERE up.email_reminders = true
    AND (COALESCE(ex.cnt, 0) + COALESCE(vo.cnt, 0) + COALESCE(ci.cnt, 0)) > 0
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
