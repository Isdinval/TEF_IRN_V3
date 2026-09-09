-- Item 1 du chantier "Fondations abonnements" (2026-09-09).
--
-- Jusqu'ici, subscription_tier ne connaissait que 'free' / 'premium' (CHECK
-- constraint), alors que la landing page (/tef-irn, section Pricing) affiche
-- 4 paliers réels : Gratuit, Essentiel, Premium, Super Premium. Cette
-- migration aligne le modèle de données sur ces 4 paliers, en amont de toute
-- intégration Stripe.
--
-- Convention retenue : slugs en français (gratuit/essentiel/premium/
-- super_premium) plutôt qu'un mélange anglais/français -- 3 des 4 paliers
-- (Essentiel, Premium, Super Premium) sont déjà identiques ou quasi
-- identiques entre le nom affiché et le slug technique ; 'free' aurait été
-- la seule exception à traduire mentalement à chaque lecture du code ou de
-- la base. Voir aussi src/types/database.ts (même patch) pour le nouveau
-- type TS, et la suppression du palier 'pro' : il n'a jamais existé (ni
-- autorisé par l'ancien CHECK, ni settable par aucune UI) -- code mort.
--
-- Piège découvert en dry-run BEGIN/ROLLBACK sur la base live (jksrmyyfllitrkarvgvk) :
-- le trigger trg_prevent_self_admin_escalation (20260828000002) réinitialise
-- silencieusement subscription_tier à l'ancienne valeur dès qu'une session
-- autre que service_role/admin tente de le modifier -- y compris un simple
-- UPDATE de migration. Sans le désactiver temporairement, la conversion des
-- lignes existantes échoue silencieusement puis fait échouer l'ADD
-- CONSTRAINT suivant (violation détectée en dry-run, corrigée ci-dessous).
--
-- Vérifié en dry-run avant livraison : 100% des comptes réels (6/6) sont
-- aujourd'hui 'free' -- migration de données sans risque, aucun palier
-- payant actif à reconvertir manuellement.

BEGIN;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

-- Désactivation temporaire du garde-fou anti-auto-promotion, le temps de la
-- conversion de données -- réactivé juste après, avant le COMMIT.
ALTER TABLE profiles DISABLE TRIGGER trg_prevent_self_admin_escalation;

UPDATE profiles SET subscription_tier = 'gratuit' WHERE subscription_tier = 'free';
-- 'premium' garde le même nom des deux côtés (aucune ligne à convertir).
-- Aucune ligne 'pro' ne peut exister (l'ancien CHECK ne l'autorisait pas).

ALTER TABLE profiles ENABLE TRIGGER trg_prevent_self_admin_escalation;

ALTER TABLE profiles ALTER COLUMN subscription_tier SET DEFAULT 'gratuit';

ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier = ANY (ARRAY['gratuit'::text, 'essentiel'::text, 'premium'::text, 'super_premium'::text]));

COMMIT;
