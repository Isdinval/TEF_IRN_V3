-- exam_questions n'avait qu'une policy SELECT publique sans condition,
-- aucune policy d'écriture. Même pattern que exams/oral_exam_scenarios :
-- policies d'écriture réservées aux admins pour la nouvelle page
-- /tef-irn/admin/exams/[examId]/questions.
CREATE POLICY "Admins can insert exam questions" ON exam_questions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can update exam questions" ON exam_questions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can delete exam questions" ON exam_questions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
