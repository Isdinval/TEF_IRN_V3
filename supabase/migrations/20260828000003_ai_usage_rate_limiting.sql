-- Audit sécurité 2026-08 (item 7) : coach/chat, writing/correct, oral/analyze
-- et oral/session appellent OpenAI (GPT-4o / Realtime, coût facturé à
-- l'usage) sans aucune limite par utilisateur ou par palier d'abonnement.
-- Un compte (y compris un compte gratuit) peut appeler ces routes en boucle
-- et faire grimper la facture OpenAI sans aucun garde-fou technique.
--
-- settings/page.tsx promet déjà "Accès limité à l'IA" pour le plan Gratuit
-- et "Accès illimité à l'IA" pour Premium -- ce correctif fait juste
-- respecter techniquement une distinction déjà annoncée côté produit.
--
-- ai_usage_daily : compteur d'appels par utilisateur/route/jour (UTC).
-- check_and_increment_ai_usage : incrémente et vérifie la limite en une
-- seule opération atomique (INSERT ... ON CONFLICT DO UPDATE ... RETURNING),
-- pour éviter toute race condition entre deux requêtes concurrentes qui
-- liraient puis écriraient séparément le même compteur.
--
-- Validé par dry-run sur la base live : 2 appels avec limite=2 -> autorisés,
-- 3e appel -> refusé, compteur final à 3 (le blocage trace quand même la
-- tentative, il n'empêche pas l'incrément).

CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  route text NOT NULL,
  usage_date date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, route, usage_date)
);

ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;
-- Aucune policy anon/authenticated : table de bookkeeping interne, seul le
-- service_role (via check_and_increment_ai_usage) y touche. RLS activée sans
-- policy = accès refusé par défaut à tout le monde sauf service_role.

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(
  p_user_id uuid,
  p_route text,
  p_limit integer
)
RETURNS boolean
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

  RETURN v_count <= p_limit;
END;
$$;
