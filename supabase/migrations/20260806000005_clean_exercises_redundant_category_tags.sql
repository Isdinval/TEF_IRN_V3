-- Item 10.8 du plan de robustification des étiquettes (dashboard), première
-- sous-partie -- le cas non ambigu des 296 étiquettes orphelines identifiées :
--
-- 294 des 373 exercices liés à une leçon portent, en plus de leurs étiquettes
-- précises, une étiquette qui répète simplement la catégorie de leur leçon
-- parente (ex. l'étiquette "grammaire" sur un exercice d'une leçon déjà
-- classée catégorie "grammaire") -- exactement le même problème que celui
-- déjà corrigé sur lessons.tags (item 10.7), à l'échelle des exercices.
--
-- Ce sous-groupe représente à lui seul 370 des ~700 occurrences d'étiquettes
-- orphelines relevées (grammaire: 181, conjugaison: 121, syntaxe: 68).
--
-- Vérifié avant application (transaction de test) :
-- - 294 exercices concernés
-- - 0 exercice ne se retrouve sans étiquette après retrait
--
-- Les 9 exercices sans leçon parente (lesson_id NULL, tag unique = juste la
-- catégorie : "orthographe" x5, "grammaire" x4) sont volontairement exclus de
-- ce nettoyage -- les retirer les laisserait sans aucune étiquette. Ce cas
-- particulier est signalé à Olivier pour décision séparée (item 10.8, reste
-- à traiter : étiquettes non catégorie -- verbes précis, groupes de
-- conjugaison, tags orphelins divers).

UPDATE public.exercises e
SET tags = (SELECT array_agg(t) FROM unnest(e.tags) t WHERE lower(t) <> lower(l.category))
FROM public.lessons l
WHERE e.lesson_id = l.id
  AND EXISTS (SELECT 1 FROM unnest(e.tags) t WHERE lower(t) = lower(l.category));
