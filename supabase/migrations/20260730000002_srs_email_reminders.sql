-- Notifications SRS proactives (rappel email des cartes dues)
--
-- Contexte : la table `user_preferences` existe déjà en production (utilisée
-- par src/app/tef-irn/settings/page.tsx, colonne `email_reminders`) mais n'a
-- jamais été versionnée dans supabase/migrations/ — elle a été créée
-- directement en base. Cette migration la fige dans le repo (CREATE TABLE
-- IF NOT EXISTS, sans risque si elle existe déjà) et ajoute la colonne
-- nécessaire au job de rappel.
--
-- get_due_srs_reminders() agrège user_reviews + user_vocabulary_reviews dus,
-- joint l'email depuis auth.users et le flag email_reminders depuis
-- user_preferences. Réservée au service_role (jamais appelable par un
-- utilisateur authentifié classique, qui pourrait sinon lire l'email de
-- tous les autres utilisateurs).

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    email_marketing BOOLEAN DEFAULT true,
    email_reminders BOOLEAN DEFAULT true,
    email_new_courses BOOLEAN DEFAULT true,
    email_results BOOLEAN DEFAULT true,
    email_promotions BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT false,
    frequency TEXT DEFAULT 'daily',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS last_srs_reminder_at TIMESTAMP WITH TIME ZONE;

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
    SELECT user_id, COUNT(*) AS due_count
    FROM (
      SELECT user_id FROM public.user_reviews WHERE next_review_at <= NOW()
      UNION ALL
      SELECT user_id FROM public.user_vocabulary_reviews WHERE next_review_at <= NOW()
    ) due
    GROUP BY user_id
  ) counts ON counts.user_id = up.user_id
  WHERE up.email_reminders = true
    AND (up.last_srs_reminder_at IS NULL OR up.last_srs_reminder_at < NOW() - INTERVAL '20 hours');
END;
$function$;

REVOKE ALL ON FUNCTION public.get_due_srs_reminders() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_due_srs_reminders() TO service_role;
