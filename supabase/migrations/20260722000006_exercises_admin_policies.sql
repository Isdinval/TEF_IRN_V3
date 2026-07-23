-- exercises n'avait qu'une policy SELECT publique, aucune policy d'écriture.
-- L'API /api/admin/generate-exercise échouait donc déjà silencieusement à l'insertion pour tout le monde.
-- On ajoute des policies d'écriture réservées aux admins (même pattern que civic_questions).
CREATE POLICY "Admins can insert exercises" ON exercises
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can update exercises" ON exercises
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can delete exercises" ON exercises
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
