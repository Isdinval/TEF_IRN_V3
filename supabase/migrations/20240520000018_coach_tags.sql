-- Ajout des tags pour le Coach IA

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Index GIN pour la recherche efficace dans les tags
CREATE INDEX IF NOT EXISTS idx_lessons_tags ON lessons USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_exercises_tags ON exercises USING GIN (tags);

-- Insertion de quelques tags d'exemple pour le test
UPDATE lessons SET tags = ARRAY['grammaire', 'adverbes'] WHERE category = 'grammaire' AND title ILIKE '%adverbe%';
UPDATE lessons SET tags = ARRAY['conjugaison', 'présent'] WHERE category = 'conjugaison' AND title ILIKE '%présent%';
UPDATE exercises SET tags = ARRAY['vocabulaire', 'santé'] WHERE instructions ILIKE '%santé%';
UPDATE exercises SET tags = ARRAY['grammaire', 'articles'] WHERE instructions ILIKE '%article%';
