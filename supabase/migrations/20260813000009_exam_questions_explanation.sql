-- Ajoute la colonne d'explication pédagogique affichée dans l'écran de résultats
-- (QuestionDetailPanel.tsx), systématiquement, que la réponse du candidat soit juste ou fausse.
-- Item 1 du plan "Explications de correction CE".
--
-- Portée initiale : CE uniquement (60 questions à documenter, items 4-6). NULL pour CO/EE/EO,
-- comme ce_format/highlight_gap/sub_texts.

ALTER TABLE public.exam_questions
  ADD COLUMN IF NOT EXISTS explanation text;

COMMENT ON COLUMN public.exam_questions.explanation IS
  'Explication pédagogique affichée dans la revue de correction : justifie la bonne réponse en citant/paraphrasant le passage du texte, et écarte le distracteur le plus proche le cas échéant. Affichage systématique (juste ou faux), pas uniquement en cas d''erreur.';
