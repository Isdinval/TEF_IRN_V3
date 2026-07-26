-- guides n'avait qu'une policy SELECT publique (is_published = true), aucune policy d'écriture.
-- Même pattern que exercises/civic_questions : on ajoute des policies d'écriture réservées aux admins
-- pour la nouvelle page /tef-irn/admin/guides.
CREATE POLICY "Admins can insert guides" ON guides
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can update guides" ON guides
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can delete guides" ON guides
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
