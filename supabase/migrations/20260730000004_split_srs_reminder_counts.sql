-- L'email de rappel ne distinguait pas les exercices dus (user_reviews) du
-- vocabulaire dû (user_vocabulary_reviews) : un seul total agrégé, un seul
-- lien vers /tef-irn/vocab, trompeur quand ce qui est dû ce sont des
-- exercices. On sépare les deux comptes pour construire un email correct.
--
-- Signature de retour changée (nouvelles colonnes) → DROP requis avant
-- CREATE, Postgres ne permet pas de modifier les OUT columns via
-- CREATE OR REPLACE.

DROP FUNCTION IF EXISTS public.get_due_srs_reminders();

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
    AND (up.last_srs_reminder_at IS NULL OR up.last_srs_reminder_at < NOW() - INTERVAL '20 hours')
    AND (COALESCE(ex.cnt, 0) + COALESCE(vo.cnt, 0)) > 0;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_due_srs_reminders() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_due_srs_reminders() TO service_role;
