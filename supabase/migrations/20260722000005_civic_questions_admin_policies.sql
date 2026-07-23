-- Ajoute une notion d'administrateur (nécessaire pour gérer le contenu de l'examen civique en production).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- civic_questions n'a aujourd'hui qu'une policy SELECT (reviewed = true, public).
-- On ajoute les policies d'écriture réservées aux admins, et une lecture complète (y compris non reviewed) pour eux.
CREATE POLICY "Admins can view all civic questions" ON civic_questions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can insert civic questions" ON civic_questions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can update civic questions" ON civic_questions
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Admins can delete civic questions" ON civic_questions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
