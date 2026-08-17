-- Item 4 du plan "Refonte recommandation erreur -> tag -> ressource" :
-- CE et CO d'examen blanc ne sont aujourd'hui persistes nulle part (voir
-- ExamContext.tsx -- seulement localStorage). Cette table est le prerequis
-- a l'item 5 (branchement ExamContext -> trackUserError pour CE/CO).
--
-- Granularite retenue (validee, section 6 de l'analyse d'architecture) :
-- 1 ligne = 1 question repondue, pas 1 ligne = 1 section d'examen. Meme
-- pattern que exercise_attempts. Necessaire pour que trackUserError sache
-- precisement quelle question a ete ratee, donc quel tag (cf. item 3,
-- exam_questions.category/tags).
--
-- Schema propose et valide par Olivier avant application :
-- - FK user_id/exam_question_id : memes conventions ON DELETE que
--   exercise_attempts (CASCADE).
-- - section dupliquee depuis exam_questions.section : meme pattern que
--   writing_scenario_attempts.section, evite un JOIN pour un filtre tres
--   frequent (score CE vs CO separes).
-- - Pas de colonne `context` (contrairement a writing_scenario_attempts) :
--   CE/CO n'existent aujourd'hui que dans exam_questions/examen blanc, pas
--   en pratique libre sur cette table -- ajouter cette colonne maintenant
--   serait une abstraction speculative sans besoin reel actuel.
-- - Pas de colonne exam_id : derivable par jointure sur exam_question_id,
--   meme convention que writing_scenario_attempts.
-- - RLS insert/select own uniquement (pas d'update/delete) : journal
--   immutable, meme convention que exercise_attempts.
-- - Index (user_id, created_at DESC) : anticipe l'item 12 deja planifie
--   (CE/CO dans recent_corrections du dashboard).
--
-- Teste avant livraison (transaction BEGIN/CREATE TABLE/INSERT factice/
-- SELECT/ROLLBACK) : creation, RLS, insertion et lecture verifiees, aucune
-- erreur.

CREATE TABLE public.exam_ce_co_attempts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_question_id  uuid NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  section           text NOT NULL CHECK (section IN ('CE', 'CO')),
  selected_answer   text,
  is_correct        boolean NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exam_ce_co_attempts_user_question ON public.exam_ce_co_attempts (user_id, exam_question_id);
CREATE INDEX idx_exam_ce_co_attempts_user_created ON public.exam_ce_co_attempts (user_id, created_at DESC);

ALTER TABLE public.exam_ce_co_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own CE/CO attempts" ON public.exam_ce_co_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own CE/CO attempts" ON public.exam_ce_co_attempts
  FOR SELECT USING (auth.uid() = user_id);
