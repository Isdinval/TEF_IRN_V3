-- Ajoute le discriminant de format pour la Compréhension Orale, sur le même principe que
-- ce_format (item 1 du plan "Recalibration CO"). Portée initiale : CO uniquement, NULL pour
-- CE/EE/EO.
--
-- annonce / repondeur / chronique : 1 audio, 1 question, indépendant.
-- micro_trottoir : audio_url et transcription partagés entre plusieurs questions-sœurs
--   (3 questions, 1 par personne interrogée, même mécanisme que le partage de texte utilisé
--   pour ce_format='trous' — pas de colonne supplémentaire nécessaire, juste une convention
--   d'usage sur les colonnes existantes audio_url/transcription).
-- conversation : reporté (item 8, Could) — utilisera imageUrl déjà existant sur QCMQuestion
--   quand il sera traité, pas de changement de schéma nécessaire dès maintenant pour lui non
--   plus.

ALTER TABLE public.exam_questions
  ADD COLUMN IF NOT EXISTS co_format text;

ALTER TABLE public.exam_questions
  DROP CONSTRAINT IF EXISTS exam_questions_co_format_check;

ALTER TABLE public.exam_questions
  ADD CONSTRAINT exam_questions_co_format_check
  CHECK (co_format IS NULL OR co_format IN ('annonce', 'repondeur', 'chronique', 'micro_trottoir', 'conversation'));

COMMENT ON COLUMN public.exam_questions.co_format IS
  'Sous-format de question CO : annonce | repondeur | chronique | micro_trottoir | conversation. NULL pour CE/EE/EO. Pour micro_trottoir, audio_url et transcription sont identiques sur les questions-sœurs (comme texte partagé pour ce_format=trous).';

-- Backfill : les 60 questions CO existantes (20 x 3 examens) sont toutes du format générique
-- actuel (1 audio, 1 question, structure la plus proche de "annonce"/"repondeur" mélangés
-- sans distinction). On les tague provisoirement 'annonce' en attendant leur réécriture
-- complète (item 3+), pour que le front puisse s'appuyer sur co_format dès maintenant sans
-- casser l'existant.
UPDATE public.exam_questions
SET co_format = 'annonce'
WHERE section = 'CO' AND co_format IS NULL;
