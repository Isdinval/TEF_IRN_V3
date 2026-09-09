-- Item 10 du chantier "fondations abonnements" (2026-09).
--
-- entitlements.ts modélise oralDailyMinutes (40 pour Premium, 75 pour Super
-- Premium) depuis l'item 2, mais rien ne le vérifiait : ai_usage_daily ne
-- comptait que des APPELS (colonne `count`), jamais de durée. Cette
-- migration ajoute le tracking en secondes nécessaire.
--
-- Décision validée avec Olivier (option 1) : la durée est déclarée par le
-- CLIENT (calculée entre le démarrage et la fin de la session vocale, seule
-- source possible -- la connexion WebRTC se fait directement entre le
-- navigateur et OpenAI, notre serveur ne l'observe jamais). Théoriquement
-- falsifiable côté client, mais cohérent avec la philosophie déjà en place
-- pour les autres quotas payants (garde-fou anti-abus, pas un système de
-- facturation à l'usage strict -- voir ai-rate-limit.ts).
--
-- Deux nouvelles RPC plutôt que d'étendre check_and_increment_ai_usage
-- (qui compte des appels, une notion différente) :
-- - get_oral_seconds_used_today() : lue par /api/oral/session avant de
--   délivrer un token, pour refuser une nouvelle session si le quota du
--   jour est déjà atteint.
-- - increment_oral_seconds() : appelée par /api/oral/analyze à la fin
--   d'une session (durée fournie par le client), pour mettre à jour le
--   total du jour consulté par la RPC ci-dessus.
-- Les deux partagent la ligne ai_usage_daily existante de la route
-- 'oral_session' (déjà utilisée par check_and_increment_ai_usage pour le
-- compteur d'appels) -- même route, même jour, une seule ligne.
--
-- ai_usage_daily a RLS activée sans aucune policy (deny-by-default) --
-- ces RPC sont SECURITY DEFINER, comme check_and_increment_ai_usage déjà
-- en place, pour rester accessibles depuis le serveur applicatif.
--
-- Vérifié en dry-run BEGIN/ROLLBACK sur la base live avant livraison
-- (incréments 120 puis 90 -> relecture 210, addition correcte).

BEGIN;

ALTER TABLE ai_usage_daily ADD COLUMN IF NOT EXISTS seconds_used integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.get_oral_seconds_used_today(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seconds integer;
BEGIN
  SELECT seconds_used INTO v_seconds
  FROM ai_usage_daily
  WHERE user_id = p_user_id AND route = 'oral_session' AND usage_date = (now() AT TIME ZONE 'utc')::date;

  RETURN COALESCE(v_seconds, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_oral_seconds(p_user_id uuid, p_seconds integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
BEGIN
  INSERT INTO ai_usage_daily (user_id, route, usage_date, count, seconds_used)
  VALUES (p_user_id, 'oral_session', (now() AT TIME ZONE 'utc')::date, 0, GREATEST(p_seconds, 0))
  ON CONFLICT (user_id, route, usage_date)
  DO UPDATE SET seconds_used = ai_usage_daily.seconds_used + GREATEST(p_seconds, 0)
  RETURNING seconds_used INTO v_total;

  RETURN v_total;
END;
$$;

COMMIT;
