-- Baseline : les tables `exams` et `exam_questions` existent déjà en production
-- mais n'avaient jamais été capturées dans une migration versionnée.
-- Ce fichier ne fait que rattraper le schéma existant (idempotent), sans données,
-- pour que `npx supabase db push` reproduise fidèlement l'environnement de prod.

CREATE TABLE IF NOT EXISTS public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  duration_co integer DEFAULT 20,
  duration_ce integer DEFAULT 30,
  duration_ee integer DEFAULT 30,
  duration_eo integer DEFAULT 10
);

CREATE TABLE IF NOT EXISTS public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  section text NOT NULL,
  order_index integer NOT NULL,
  type text NOT NULL,
  question text,
  texte text,
  options text[],
  correct_answer text,
  audio_url text,
  max_plays integer,
  transcription text,
  prompt text,
  min_words integer,
  max_time integer,
  prep_time integer,
  speak_time integer,
  instructions text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on exams" ON public.exams;
CREATE POLICY "Allow public read access on exams"
  ON public.exams FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow public read access on exam_questions" ON public.exam_questions;
CREATE POLICY "Allow public read access on exam_questions"
  ON public.exam_questions FOR SELECT
  TO anon
  USING (true);
