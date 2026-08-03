-- parcours a déjà une policy SELECT publique sans condition, aucune policy
-- d'écriture. Pattern identique aux autres tables de contenu.
--
-- Note suppression : user_parcours_progress.parcours_id est en CASCADE
-- (la progression liée sera supprimée avec), guides.parcours_id est en
-- SET NULL (les guides "Besoin d'aide ?" liés perdent juste leur lien),
-- profiles.last_active_parcours_id est en NO ACTION : si un profil a ce
-- parcours comme dernier actif, la suppression sera bloquée par Postgres
-- avec une erreur de contrainte (comportement de sécurité voulu, pas un bug).
CREATE POLICY "Admins can insert parcours" ON parcours
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can update parcours" ON parcours
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can delete parcours" ON parcours
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
