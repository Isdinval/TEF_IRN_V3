-- Item 11 du chantier "fondations abonnements" (2026-09).
--
-- Objectif : recalibrer les 6 chiffres de ai-rate-limit.ts (posés sans
-- aucune donnée d'usage réelle, voir son commentaire d'origine), ce qui
-- suppose d'abord de savoir combien d'appels sont réellement faits par
-- route et par palier. Décision validée avec Olivier (option b) :
-- instrumenter un tracking d'usage via PostHog plutôt que de deviner de
-- nouveaux chiffres sans données.
--
-- check_and_increment_ai_usage ne renvoyait qu'un booléen (allowed/pas
-- allowed) -- le compte réel n'était jamais exposé au code appelant, donc
-- rien à logguer de significatif. Postgres n'autorise pas CREATE OR REPLACE
-- à changer le type de retour d'une fonction existante -- DROP puis CREATE.
-- Seul appelant : src/lib/ai-rate-limit.ts (vérifié avant cette migration),
-- mis à jour dans le même patch applicatif pour lire l'entier renvoyé au
-- lieu du booléen, et pour envoyer l'event PostHog avec ce compte réel.
--
-- Vérifié en dry-run BEGIN/ROLLBACK sur la base live avant livraison
-- (2 appels successifs -> 1 puis 2, incrément correct).

BEGIN;

DROP FUNCTION IF EXISTS public.check_and_increment_ai_usage(uuid, text, integer);

CREATE FUNCTION public.check_and_increment_ai_usage(p_user_id uuid, p_route text, p_limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO ai_usage_daily (user_id, route, usage_date, count)
  VALUES (p_user_id, p_route, (now() AT TIME ZONE 'utc')::date, 1)
  ON CONFLICT (user_id, route, usage_date)
  DO UPDATE SET count = ai_usage_daily.count + 1
  RETURNING count INTO v_count;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.check_and_increment_ai_usage IS
  'Incrémente et retourne le compte d''appels du jour (entier, pas un booléen depuis la migration 20260909000004) -- la comparaison au plafond se fait côté application dans src/lib/ai-rate-limit.ts, pour pouvoir logguer le compte réel dans PostHog (item 11, recalibration future des quotas).';

COMMIT;
