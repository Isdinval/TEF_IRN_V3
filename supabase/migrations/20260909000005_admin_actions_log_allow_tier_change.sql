-- Correctif retour utilisateur (2026-09) : le journal d'actions admin
-- n'affichait jamais "a changé l'abonnement de" après un changement de
-- palier via /tef-irn/admin/profiles, alors que le changement lui-même
-- fonctionnait (le compte changeait bien de palier).
--
-- Cause : admin_actions_log_action_check limitait la colonne `action` aux
-- 4 valeurs d'origine (promote_admin, demote_admin, reset_progress,
-- delete_account) -- oublié lors de l'item 4 (ajout de l'action
-- change_subscription_tier côté TypeScript uniquement, jamais côté
-- contrainte SQL). Chaque INSERT échouait donc avec une violation de
-- contrainte -- silencieusement, car set-subscription-tier/route.ts ne
-- vérifiait pas l'erreur de cet INSERT (corrigé dans le même patch
-- applicatif que cette migration).
--
-- Vérifié en dry-run BEGIN/ROLLBACK sur la base live avant livraison :
-- INSERT test avec action='change_subscription_tier' réussi après
-- l'élargissement de la contrainte.

BEGIN;

ALTER TABLE admin_actions_log DROP CONSTRAINT admin_actions_log_action_check;

ALTER TABLE admin_actions_log ADD CONSTRAINT admin_actions_log_action_check
  CHECK (action = ANY (ARRAY[
    'promote_admin'::text,
    'demote_admin'::text,
    'reset_progress'::text,
    'delete_account'::text,
    'change_subscription_tier'::text
  ]));

COMMIT;
