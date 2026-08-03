-- centres_examen_civique n'avait qu'une policy SELECT publique (actif = true),
-- aucune policy d'écriture ni de lecture admin des centres inactifs. Même
-- pattern que civic_questions / oral_exam_scenarios.
CREATE POLICY "Admins can view all civic exam centres" ON centres_examen_civique
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can insert civic exam centres" ON centres_examen_civique
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can update civic exam centres" ON centres_examen_civique
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can delete civic exam centres" ON centres_examen_civique
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
