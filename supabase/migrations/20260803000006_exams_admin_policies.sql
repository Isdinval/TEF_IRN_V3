-- exams n'avait qu'une policy SELECT publique sans condition (même les
-- examens is_active = false sont lisibles publiquement aujourd'hui — pré-
-- existant, hors scope ici), aucune policy d'écriture. Même pattern que
-- guides/exercises/oral_exam_scenarios : policies d'écriture réservées aux
-- admins pour la nouvelle page /tef-irn/admin/exams.
CREATE POLICY "Admins can insert exams" ON exams
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can update exams" ON exams
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can delete exams" ON exams
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
