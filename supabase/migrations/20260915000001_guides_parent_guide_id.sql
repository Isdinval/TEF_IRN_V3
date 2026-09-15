-- Ajoute `parent_guide_id` à `guides` : jusqu'ici, `silo_role` (migration 20260729000008)
-- dit SI un guide est un hub / pilier / satellite, mais rien en base ne dit à QUOI il est
-- rattaché (ex: le satellite A appartient à quel pilier ?). Cette information n'existait
-- que dans des fichiers markdown de skills, hors base, hors repo.
--
-- `parent_guide_id` est le rattachement VOULU (édité à la main dans l'admin) : un satellite
-- pointe vers son pilier, un pilier pointe vers le hub. Il complète, sans le remplacer, le
-- graphe RÉEL calculé à la volée par src/lib/guides-link-graph.ts à partir des liens
-- effectivement présents dans `content` — le futur onglet graphe pourra ainsi afficher les cas
-- où le rattachement voulu et les liens réels divergent (ex: satellite rattaché à un pilier en
-- base, mais qui ne le linke pas dans son contenu, ou l'inverse).
--
-- Volontairement pas de contrainte SQL cross-lignes (ex: "un satellite ne peut être rattaché
-- qu'à un pilier") : la cohérence hub/pilier/satellite est vérifiée côté admin (dropdown limité
-- au bon rôle) et côté health-check (buildGuideLinkGraph), pas par un trigger, pour rester simple.
-- Un guide `hub` n'a pas de parent (parent_guide_id reste NULL pour lui).

ALTER TABLE guides
  ADD COLUMN parent_guide_id uuid REFERENCES guides(id) ON DELETE SET NULL;

CREATE INDEX idx_guides_parent_guide_id ON guides (parent_guide_id);

COMMENT ON COLUMN guides.parent_guide_id IS
  'Rattachement editorial voulu : pilier parent pour un satellite, hub parent pour un pilier. NULL pour le hub. A distinguer du maillage reel (liens dans content), calcule a la volee par guides-link-graph.ts.';
