-- lessons n'avait qu'une policy SELECT publique, aucune policy d'écriture
-- (cf. 20240520000007_rls_policies.sql). Idem que le gap corrigé pour exercises
-- en 20260722000006 : sans ceci, tout insert/update/delete échoue silencieusement
-- via l'API Supabase, quelle que soit la protection côté page admin.
CREATE POLICY "Admins can insert lessons" ON lessons
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can update lessons" ON lessons
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can delete lessons" ON lessons
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
