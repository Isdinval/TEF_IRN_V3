-- Ajoute 'delete_account' aux actions loggables par admin_actions_log.
-- Nécessaire pour la suppression définitive de compte depuis l'admin
-- (/api/admin/profiles/delete) : le CHECK actuel n'autorise que
-- promote_admin / demote_admin / reset_progress.
ALTER TABLE admin_actions_log DROP CONSTRAINT admin_actions_log_action_check;

ALTER TABLE admin_actions_log ADD CONSTRAINT admin_actions_log_action_check
  CHECK (action IN ('promote_admin', 'demote_admin', 'reset_progress', 'delete_account'));
