-- Stratégie de sortie pour les recommandations du Coach IA.
--
-- Contexte : recommendations.status accepte déjà 'completed' et 'dismissed'
-- dans son CHECK, mais rien dans le code ne les positionnait jamais — une
-- recommandation restait 'pending' indéfiniment, même une fois le point
-- faible associé résolu.
--
-- Pour marquer une recommandation 'completed' automatiquement, il faut savoir
-- QUEL point faible (category/sub_category de user_errors) l'a générée, afin
-- de vérifier s'il a disparu. Ces colonnes n'existaient pas sur
-- `recommendations` — on les ajoute, remplies à la création par
-- recommendation-engine.ts.

ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS sub_category TEXT;
