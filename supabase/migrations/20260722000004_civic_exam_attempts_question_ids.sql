-- Permet d'exclure les questions du dernier examen blanc lors du tirage suivant (variété).
ALTER TABLE civic_exam_attempts ADD COLUMN IF NOT EXISTS question_ids uuid[];
