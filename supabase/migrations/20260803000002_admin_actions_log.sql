-- Log d'audit des actions admin sensibles sur les comptes (promotion,
-- rétrogradation, réinitialisation de progression). Aucune de ces actions
-- n'était tracée jusqu'ici alors que le reset est irréversible. Écriture
-- uniquement via service_role (les routes /api/admin/profiles/* utilisent
-- déjà createAdminClient()), lecture réservée aux admins.
--
-- admin_email / target_email sont dénormalisés pour rester lisibles même si
-- le profil correspondant est un jour supprimé (ON DELETE SET NULL sur les
-- FK, pas de cascade : on veut garder l'historique).
CREATE TABLE admin_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  admin_email text NOT NULL,
  action text NOT NULL CHECK (action IN ('promote_admin', 'demote_admin', 'reset_progress')),
  target_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_email text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_actions_log_created_at ON admin_actions_log (created_at DESC);

ALTER TABLE admin_actions_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin actions log" ON admin_actions_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Pas de policy INSERT/UPDATE/DELETE pour authenticated : les écritures ne
-- passent que par service_role (bypass RLS), comme le reste des routes admin.
