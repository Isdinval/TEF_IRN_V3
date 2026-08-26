-- Mapping leçon Vocabulaire -> thématique(s) VOCAB_CATEGORIES (src/lib/vocab/categories.ts)
-- Item 3 du plan "Carte vocab thématique sur parcours Vocabulaire".
--
-- Tableau (pas un simple text) car certaines leçons couvrent 2 thématiques à la fois
-- (ex. "Santé & Travail" -> Santé + Travail) -- même pattern que la colonne "tags"
-- déjà en place (20240520000018_coach_tags.sql).
--
-- Pas de CHECK contre VOCAB_CATEGORIES : cohérent avec vocabulary.category, qui n'a
-- lui-même aucune contrainte DB (validation uniquement côté applicatif, dropdown admin) --
-- vérifié en base live avant d'écrire cette migration (pg_constraint sur vocabulary/lessons).
--
-- NULL/tableau vide attendu et légitime pour les leçons sans ancrage thématique-lexical
-- (Registre de Langue, Collocations, Valeurs de la République) -- pas une donnée manquante.
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS vocab_theme_categories TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_lessons_vocab_theme_categories
  ON lessons USING GIN (vocab_theme_categories);
