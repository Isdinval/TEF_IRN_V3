-- Audit sécurité 2026-08 (item 1) : exam_questions exposait correct_answer et
-- explanation en lecture à tout utilisateur authentifié (policy "Allow
-- authenticated read access on exam_questions" USING (true), sans distinction
-- de colonne). Conséquences concrètes :
--   - ExamContext.tsx faisait un select('*') pour afficher l'examen blanc réel
--     aux candidats : la bonne réponse était présente dans la réponse réseau
--     de l'API, visible dans l'onglet Network avant même d'avoir répondu.
--   - N'importe quel compte authentifié (pas besoin d'être admin) pouvait
--     interroger directement l'API REST Supabase et récupérer toutes les
--     bonnes réponses de tous les examens.
--
-- Correctif : la table brute n'est plus lisible qu'en admin (même pattern que
-- les policies d'écriture déjà en place sur cette table, cf.
-- 20260803000007_exam_questions_admin_policies.sql). Une vue publique sans
-- correct_answer ni explanation est exposée à la place pour l'affichage des
-- questions ; elle est créée par le rôle propriétaire des migrations
-- (postgres), qui n'est pas soumis au RLS de la table sous-jacente -- c'est
-- le mécanisme standard Supabase pour exposer une version filtrée d'une
-- table protégée par RLS.
--
-- Validé par dry-run BEGIN/ROLLBACK sur la base live avant livraison :
--   - un compte admin voit toujours les 132 lignes sur la table brute
--   - un compte authentifié non-admin voit 0 ligne sur la table brute
--   - un compte anon et un compte authentifié non-admin voient les 132
--     lignes via exam_questions_public, sans correct_answer ni explanation

DROP POLICY IF EXISTS "Allow authenticated read access on exam_questions" ON public.exam_questions;

CREATE POLICY "Admins can read all exam questions" ON public.exam_questions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

DROP VIEW IF EXISTS public.exam_questions_public;

CREATE VIEW public.exam_questions_public AS
SELECT
  id,
  exam_id,
  section,
  order_index,
  type,
  question,
  texte,
  options,
  audio_url,
  max_plays,
  transcription,
  prompt,
  min_words,
  max_time,
  prep_time,
  speak_time,
  instructions,
  created_at,
  oral_scenario_id,
  ce_format,
  highlight_gap,
  sub_texts,
  co_format,
  category,
  tags
FROM public.exam_questions;

GRANT SELECT ON public.exam_questions_public TO anon, authenticated;
