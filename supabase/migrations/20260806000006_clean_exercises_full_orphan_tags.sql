-- Item 10.8 du plan de robustification des étiquettes (dashboard), nettoyage
-- complet (2/2) :
--
-- Après le retrait des étiquettes redondantes avec la catégorie (10.8 1/2),
-- ~140 étiquettes distinctes restaient sur les exercices sans figurer dans la
-- taxonomie officielle (docs/lessons-tags-taxonomy.md) : variantes d'une
-- notion déjà officielle ("comparaison" au lieu de "comparatifs", "-RE"/"2e
-- groupe" au lieu de "verbes en -re"...), verbes précis utilisés comme tags
-- (attendre, prendre, choisir...), mots de vocabulaire/lieux (Mexique, Paris,
-- bibliotheque...), tags "meta" hétérogènes (mix, centre entrainement,
-- expression_ecrite...), et un vrai bug détecté en creusant : l'étiquette
-- "grammaire" posée par erreur sur 72 exercices de vocabulaire pur (salutations,
-- valeurs de la République...) sans aucun rapport grammatical.
--
-- Le rapprochement erreur -> leçon (item 10.11) ne s'appuiera que sur les
-- étiquettes de la taxonomie officielle -- toute étiquette hors liste est
-- donc du bruit sans utilité fonctionnelle. Nettoyage complet demandé par
-- Olivier plutôt que de ne corriger que le bug "grammaire".
--
-- Vérifié avant application (transaction de test) :
-- - 0 exercice lié à une leçon ne se retrouve sans étiquette après nettoyage
-- - 674 étiquettes restantes au total (contre ~1000+ avant), toutes issues
--   de la taxonomie officielle
--
-- Les 9 exercices sans leçon parente (lesson_id NULL, tag unique = juste une
-- catégorie : "orthographe" x5, "grammaire" x4) sont explicitement exclus --
-- ce nettoyage les aurait vidés de toute étiquette, faute d'alternative dans
-- la taxonomie officielle pour ces cas particuliers (pas de leçon Orthographe,
-- "grammaire" n'est plus un tag valide depuis 10.7). Cas à traiter séparément
-- si besoin.

WITH official AS (
  SELECT DISTINCT lower(unnest(tags)) AS tag FROM public.lessons
)
UPDATE public.exercises e
SET tags = (SELECT array_agg(t) FROM unnest(e.tags) t WHERE lower(t) IN (SELECT tag FROM official))
WHERE e.lesson_id IS NOT NULL;
