-- Item 1 du plan "Refonte CE examen blanc" : support de 5 formats de question
-- pour la Compréhension Écrite (court / trous / multi_texte / long_admin / article_presse),
-- au lieu du seul format "texte court x2 questions" actuel.
--
-- ce_format      : discriminant du rendu CE. NULL pour les questions CO/EE/EO (non concernées).
-- highlight_gap  : uniquement pour ce_format = 'trous' — numéro de la lacune (1, 2, ...)
--                  sur laquelle porte CETTE question, parmi les lacunes visibles dans `texte`
--                  (le texte partagé contient toutes les lacunes, ex: "___(1)" et "___(2)").
-- sub_texts      : uniquement pour ce_format = 'multi_texte' — tableau de sous-documents
--                  affichés en grille, ex: [{"label": "Biographie 1", "content": "..."}, ...].
--
-- long_admin et article_presse partagent le même composant de rendu front (texte structuré
-- en paragraphes) mais sont stockés distinctement pour permettre de cibler l'un sans l'autre.

ALTER TABLE public.exam_questions
  ADD COLUMN IF NOT EXISTS ce_format text,
  ADD COLUMN IF NOT EXISTS highlight_gap integer,
  ADD COLUMN IF NOT EXISTS sub_texts jsonb;

ALTER TABLE public.exam_questions
  DROP CONSTRAINT IF EXISTS exam_questions_ce_format_check;

ALTER TABLE public.exam_questions
  ADD CONSTRAINT exam_questions_ce_format_check
  CHECK (ce_format IS NULL OR ce_format IN ('court', 'trous', 'multi_texte', 'long_admin', 'article_presse'));

COMMENT ON COLUMN public.exam_questions.ce_format IS
  'Sous-format de question CE : court | trous | multi_texte | long_admin | article_presse. NULL pour CO/EE/EO.';
COMMENT ON COLUMN public.exam_questions.highlight_gap IS
  'Pour ce_format=trous : numéro de la lacune ciblée par cette question dans le texte partagé.';
COMMENT ON COLUMN public.exam_questions.sub_texts IS
  'Pour ce_format=multi_texte : tableau [{"label": string, "content": string}] des sous-documents affichés en grille.';

-- Backfill : les 60 questions CE existantes (20 x 3 examens) sont toutes du format
-- "texte court x2 questions" actuel. On les tague explicitement pour que le front
-- puisse s'appuyer sur ce_format dès maintenant, avant même la réécriture de contenu
-- (item 5/6 du plan) qui introduira les 4 autres formats.
UPDATE public.exam_questions
SET ce_format = 'court'
WHERE section = 'CE' AND ce_format IS NULL;

