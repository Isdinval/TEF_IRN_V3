-- Ajoute 2 colonnes à `guides` :
-- 1) `product` : remplace l'inférence fragile via CIVIC_GUIDE_CATEGORIES (dupliquée dans
--    civic-guides.ts, sitemap.ts, admin/guides/page.tsx).
-- 2) `silo_role` : rend la structure silo (hub / pilier / satellite), jusqu'ici documentée
--    uniquement dans des fichiers markdown de skills, interrogeable en SQL.
-- `type` existe déjà sur `guides` (complet/thematique/astuces/methodologie) d'où le nom `silo_role`.
-- Appliquée directement sur le projet via Supabase MCP le 29/07/2026 ; ce fichier sert de trace
-- versionnée dans le repo (cohérence avec les autres migrations trackées).

ALTER TABLE guides
  ADD COLUMN product text NOT NULL DEFAULT 'tef-irn'
    CHECK (product IN ('tef-irn', 'examen-civique')),
  ADD COLUMN silo_role text NOT NULL DEFAULT 'satellite'
    CHECK (silo_role IN ('hub', 'pilier', 'satellite'));

UPDATE guides
SET product = 'examen-civique'
WHERE category IN ('examen-civique-general', 'naturalisation-civique', 'csp-civique', 'cr-civique');

UPDATE guides
SET silo_role = 'hub'
WHERE slug = 'naturalisation-francaise-guide-complet';

UPDATE guides
SET silo_role = 'pilier'
WHERE slug IN (
  'tout-comprendre-tef-irn',
  'methode-revision-tef-irn-guide-complet',
  'expression-orale-tef-irn-guide-complet',
  'expression-ecrite-comprehension-tef-irn-guide-complet',
  'naturalisation-demarches-tef-irn-guide-complet',
  'motivation-bien-etre-coaching-tef-irn-guide-complet',
  'comprendre-examen-civique-guide-complet',
  'dispenses-examen-civique-guide-complet',
  'personas-examen-civique-guide-complet',
  'formation-civique-cir-guide-complet',
  'inscription-centres-examen-civique-guide-complet',
  'resultats-echec-budget-examen-civique-guide-complet'
);

CREATE INDEX idx_guides_product ON guides (product);
CREATE INDEX idx_guides_silo_role ON guides (silo_role);
