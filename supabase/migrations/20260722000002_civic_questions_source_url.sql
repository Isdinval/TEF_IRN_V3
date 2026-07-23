-- Ajout d'un lien direct vers la fiche officielle, en complément de source_ref (texte).
ALTER TABLE civic_questions
ADD COLUMN IF NOT EXISTS source_url TEXT;
