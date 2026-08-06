-- Item 10.7 du plan de robustification des étiquettes (dashboard) :
--
-- Nettoyage réel de lessons.tags : retrait de l'étiquette qui ne fait que
-- répéter la catégorie de la leçon (ex. l'étiquette "conjugaison" sur une
-- leçon déjà classée catégorie "conjugaison"). Cette info est redondante
-- avec la colonne category, comme relevé par Olivier.
--
-- Vérifications faites AVANT ce nettoyage (transaction de test) :
-- - Aucune leçon ne se retrouve sans étiquette après retrait (0/99)
-- - Aucune autre incohérence trouvée : pas d'espaces parasites, pas de
--   doublon au sein d'une même leçon, pas de variation de casse pour un
--   même mot entre deux leçons (ex. "Vocabulaire" vs "vocabulaire")
-- - Seul usage applicatif de lessons.tags trouvé dans le code :
--   /api/coach/chat (recherche de leçons par mots-clés extraits par l'IA,
--   ex. "passé composé", "subjonctif" -- jamais un nom de catégorie). Le
--   retrait de l'étiquette redondante n'affecte donc pas ce mécanisme.

UPDATE public.lessons
SET tags = (SELECT array_agg(t) FROM unnest(tags) t WHERE lower(t) <> lower(category));
