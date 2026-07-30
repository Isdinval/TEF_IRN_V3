-- Fix: "column reference user_id is ambiguous" (erreur 500 en prod).
--
-- RETURNS TABLE (user_id UUID, ...) déclare `user_id` comme variable de
-- sortie du bloc PL/pgSQL. Dans la version précédente, la sous-requête
-- `SELECT user_id FROM public.user_reviews WHERE ...` référençait `user_id`
-- sans alias de table, ce qui entrait en collision avec cette variable de
-- sortie. Correction : qualifier explicitement chaque colonne `user_id` par
-- son alias de table dans tout le corps de la fonction.

CREATE OR REPLACE FUNCTION public.get_due_srs_reminders()
 RETURNS TABLE (
   user_id UUID,
   email TEXT,
   due_count BIGINT
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT up.user_id, u.email::TEXT, counts.due_count
  FROM user_preferences up
  JOIN auth.users u ON u.id = up.user_id
  JOIN (
    SELECT due.user_id, COUNT(*) AS due_count
    FROM (
      SELECT ur.user_id FROM public.user_reviews ur WHERE ur.next_review_at <= NOW()
      UNION ALL
      SELECT uvr.user_id FROM public.user_vocabulary_reviews uvr WHERE uvr.next_review_at <= NOW()
    ) due
    GROUP BY due.user_id
  ) counts ON counts.user_id = up.user_id
  WHERE up.email_reminders = true
    AND (up.last_srs_reminder_at IS NULL OR up.last_srs_reminder_at < NOW() - INTERVAL '20 hours');
END;
$function$;
