-- Bug pré-existant : les policies de lecture sur `exams` et `exam_questions`
-- étaient scopées uniquement au rôle `anon`, donc invisibles pour tout
-- utilisateur connecté (rôle `authenticated`) — contrairement à
-- `writing_exam_scenarios` et `oral_exam_scenarios` qui utilisent `public`.

DROP POLICY IF EXISTS "Allow public read access on exams" ON public.exams;
CREATE POLICY "Allow public read access on exams"
  ON public.exams FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow public read access on exam_questions" ON public.exam_questions;
CREATE POLICY "Allow public read access on exam_questions"
  ON public.exam_questions FOR SELECT
  TO public
  USING (true);
