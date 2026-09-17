-- Chantier abonnements, item 5 (2026-09) : suppression de compte
-- self-service. Réutilise la même logique de cascade que la suppression
-- admin (/api/admin/profiles/delete), mais initiée par l'utilisateur
-- lui-même sur son propre compte -- distingué par une nouvelle valeur
-- d'action ('self_delete_account') plutôt que de réutiliser
-- 'delete_account' (qui reste réservé aux suppressions initiées par un
-- admin sur un AUTRE compte), pour que l'historique reste lisible.
--
-- admin_id et target_user_id sont tous les deux en ON DELETE SET NULL sur
-- profiles(id) -- pour une auto-suppression, admin_id = target_user_id =
-- l'utilisateur qui se supprime ; les deux repassent à NULL après la
-- cascade, mais admin_email/target_email (dénormalisés, NOT NULL) restent
-- lisibles dans l'historique.
--
-- Vérifié en dry-run BEGIN/ROLLBACK sur la base live avant livraison :
-- INSERT test avec action='self_delete_account' réussi après l'élargissement
-- de la contrainte.

BEGIN;

ALTER TABLE admin_actions_log DROP CONSTRAINT admin_actions_log_action_check;

ALTER TABLE admin_actions_log ADD CONSTRAINT admin_actions_log_action_check
  CHECK (action = ANY (ARRAY[
    'promote_admin'::text,
    'demote_admin'::text,
    'reset_progress'::text,
    'delete_account'::text,
    'change_subscription_tier'::text,
    'self_delete_account'::text
  ]));

COMMIT;
