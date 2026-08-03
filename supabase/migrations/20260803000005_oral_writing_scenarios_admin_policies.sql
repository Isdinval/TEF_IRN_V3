-- oral_exam_scenarios n'avait qu'une policy SELECT publique (is_active = true,
-- utilisée par la simulation d'examen oral), aucune policy d'écriture ni de
-- lecture admin des scénarios inactifs/brouillons. Même pattern que
-- civic_questions : policy de lecture admin dédiée + policies d'écriture,
-- pour la nouvelle page /tef-irn/admin/oral-scenarios.
CREATE POLICY "Admins can view all oral exam scenarios" ON oral_exam_scenarios
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can insert oral exam scenarios" ON oral_exam_scenarios
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can update oral exam scenarios" ON oral_exam_scenarios
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can delete oral exam scenarios" ON oral_exam_scenarios
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- writing_exam_scenarios a déjà une policy SELECT publique sans condition
-- (contrairement à oral_exam_scenarios), donc pas besoin d'une policy de
-- lecture admin dédiée ici : seules les policies d'écriture manquent.
CREATE POLICY "Admins can insert writing exam scenarios" ON writing_exam_scenarios
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can update writing exam scenarios" ON writing_exam_scenarios
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can delete writing exam scenarios" ON writing_exam_scenarios
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
