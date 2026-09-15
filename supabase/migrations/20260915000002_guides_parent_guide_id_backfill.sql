-- Backfill de guides.parent_guide_id (colonne ajoutee par 20260915000001).
--
-- 1) Piliers -> hub : un seul hub existe actuellement (naturalisation-francaise-guide-complet),
--    donc aucune ambiguite possible, tous les piliers publies y sont rattaches.
-- 2) Satellites -> pilier : deduit des liens REELS presents dans `content` (meme logique que
--    src/lib/guides-link-graph.ts, reimplementee ici en SQL pour eviter de faire transiter 135
--    guides.content dans une session Claude). Un satellite est rattache seulement si UN SEUL
--    pilier distinct apparait parmi ses liens sortants (satellite -> pilier) ou entrants
--    (pilier -> satellite). En cas de 0 ou plusieurs candidats, on laisse parent_guide_id a NULL
--    plutot que de deviner - voir la liste des cas a arbitrer manuellement livree a part.
--
-- Dry-run BEGIN/ROLLBACK verifie sur jksrmyyfllitrkarvgvk avant livraison :
--   12/12 piliers rattaches, 111/135 satellites rattaches sans ambiguite.
-- Les 24 satellites restants (6 ambigus + 18 sans candidat, dont les guides-parcours qui ne
-- font pas partie du silo SEO) sont a traiter a la main via le dropdown admin (item 2ter suite).

UPDATE guides
SET parent_guide_id = (SELECT id FROM guides WHERE silo_role = 'hub' AND is_published = true LIMIT 1)
WHERE silo_role = 'pilier' AND is_published = true;

WITH raw_links AS (
  SELECT g.id AS source_id, g.silo_role AS source_role,
         regexp_replace(m[1], '^https?://[^/]+', '') AS path
  FROM guides g,
       regexp_matches(g.content, '\[[^\]]*\]\(([^)]+)\)', 'g') AS m
  WHERE g.is_published = true
),
guide_edges AS (
  SELECT source_id, source_role,
         (regexp_match(path, '^/(tef-irn|examen-civique)/guides/([a-z0-9-]+)/?$'))[1] AS target_product,
         (regexp_match(path, '^/(tef-irn|examen-civique)/guides/([a-z0-9-]+)/?$'))[2] AS target_slug
  FROM raw_links
),
resolved_edges AS (
  SELECT ge.source_id, ge.source_role, gt.id AS target_id, gt.silo_role AS target_role
  FROM guide_edges ge
  JOIN guides gt ON gt.slug = ge.target_slug AND gt.product::text = ge.target_product
  WHERE ge.target_slug IS NOT NULL AND gt.is_published = true AND gt.id <> ge.source_id
),
candidates AS (
  SELECT source_id AS satellite_id, target_id AS pilier_id FROM resolved_edges WHERE target_role = 'pilier'
  UNION
  SELECT target_id AS satellite_id, source_id AS pilier_id FROM resolved_edges WHERE source_role = 'pilier' AND target_role = 'satellite'
),
unambiguous AS (
  SELECT satellite_id, (array_agg(DISTINCT pilier_id))[1] AS pilier_id
  FROM candidates
  GROUP BY satellite_id
  HAVING count(DISTINCT pilier_id) = 1
)
UPDATE guides g
SET parent_guide_id = u.pilier_id
FROM unambiguous u
WHERE g.id = u.satellite_id AND g.silo_role = 'satellite' AND g.is_published = true;
