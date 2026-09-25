-- Page Parcours (item 12) :
-- 1. L'objectif du parcours "Conjugaison A1" était un copier-coller de celui
--    du parcours "Vocabulaire A2". Nouvel objectif rédigé d'après ses 6 leçons
--    (être/avoir/-ER, -IR/-RE, verbes irréguliers, négation, futur proche,
--    verbes pronominaux).
-- 2. Trois nom_parcours commençaient par une espace parasite.

UPDATE parcours
SET objective = 'Conjuguer au présent les verbes essentiels, utiliser la négation, le futur proche et les verbes pronominaux pour parler de soi et de son quotidien.'
WHERE slug = 'parler-soi-conj-a1';

UPDATE parcours
SET nom_parcours = btrim(nom_parcours)
WHERE nom_parcours <> btrim(nom_parcours);
