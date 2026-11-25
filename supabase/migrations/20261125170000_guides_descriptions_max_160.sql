-- SEO (audit sitemap, item 7b) : trois guides avaient une meta description de
-- plus de 160 caractères (tronquée par Google). Nouvelles descriptions de
-- 150 à 160 caractères, même message. Idempotent : ne touche que les
-- descriptions encore trop longues.

UPDATE guides
SET description = 'Réviser sur mobile : micro-sessions de 5 minutes, applications utiles et écueils à éviter. La méthode efficace pour préparer le TEF IRN sur téléphone en 2026.'
WHERE slug = 'tef-irn-phone-tablette' AND length(description) > 160;

UPDATE guides
SET description = 'Le guide compagnon du parcours A2 sur le vocabulaire du quotidien : santé, démarches administratives et logement, utiles pour le TEF IRN et vivre en France.'
WHERE slug = 'logement-soins-demarches-voc-a2-guide-parcours' AND length(description) > 160;

UPDATE guides
SET description = 'Le guide compagnon du parcours B2 sur l''argumentation : éviter le piège du si + conditionnel et structurer un raisonnement thèse-antithèse-synthèse au TEF IRN.'
WHERE slug = 'textes-clairs-argumentation-syn-b2-guide-parcours' AND length(description) > 160;
