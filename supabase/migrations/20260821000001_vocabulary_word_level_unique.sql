-- Contrainte anti-doublon sur vocabulary(word, level).
-- Contexte : préparation de la génération de masse (218 -> 1500 mots, voir
-- plan-vocabulaire-1500-mots.md). Sans cette contrainte, un mot pourrait être
-- inséré deux fois pour le même niveau lors des lots de génération à venir.
--
-- Dry-run effectué avant livraison (BEGIN/ROLLBACK) : aucun doublon existant
-- au 21/08/2026 (vérifié via SELECT word, level, COUNT(*) ... HAVING COUNT(*) > 1
-- -> 0 ligne). La contrainte peut donc être ajoutée directement, sans étape de
-- dédoublonnage préalable.

ALTER TABLE public.vocabulary
  ADD CONSTRAINT vocabulary_word_level_unique UNIQUE (word, level);
