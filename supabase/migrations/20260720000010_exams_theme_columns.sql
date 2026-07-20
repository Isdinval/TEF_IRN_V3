ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS level text;

UPDATE public.exams SET description = 'Vie administrative quotidienne', level = 'A2-B1' WHERE slug = 'exam-1';
UPDATE public.exams SET description = 'Vie professionnelle & recherche d''emploi', level = 'B1' WHERE slug = 'exam-2';
UPDATE public.exams SET description = 'Vie sociale, santé, logement', level = 'B1-B2' WHERE slug = 'exam-3';
