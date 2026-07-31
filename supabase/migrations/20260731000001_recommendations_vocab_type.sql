-- Ajoute le type 'vocab' aux recommandations du Coach IA.
--
-- Contexte : recommendation-engine.ts ne générait que des recos 'lesson'/
-- 'exercise'/'review' (issues de user_errors), jamais de recommandation
-- vocabulaire, alors que le SRS vocabulaire (user_vocabulary_reviews,
-- ease_factor baissé sur échec par src/lib/srs-engine.ts) contient déjà un
-- signal de mot en difficulté. On ouvre le CHECK pour permettre au nouveau
-- analyzeVocabStruggleAndRecommend() de créer des recos type 'vocab',
-- reference_id pointant vers vocabulary.id.
ALTER TABLE recommendations DROP CONSTRAINT IF EXISTS recommendations_type_check;
ALTER TABLE recommendations ADD CONSTRAINT recommendations_type_check
  CHECK (type IN ('lesson', 'exercise', 'review', 'vocab'));

-- Contrainte nécessaire à l'upsert `onConflict: 'user_id, reference_id'` déjà
-- utilisé par analyzeUserErrorsAndRecommend() pour les leçons (et maintenant
-- par analyzeVocabStruggleAndRecommend() pour le vocabulaire) : sans elle,
-- l'upsert échoue en base (erreur Postgres 42P10, "no unique or exclusion
-- constraint matching the ON CONFLICT specification"). Les NULLs multiples
-- restent autorisés (recos 'exercise'/'review' sans reference_id), donc
-- aucun impact sur les lignes existantes -- sauf si des doublons (user_id,
-- reference_id) existent déjà en prod, auquel cas cette migration échouera
-- et il faudra les dédupliquer avant de la rejouer.
ALTER TABLE recommendations ADD CONSTRAINT recommendations_user_reference_unique
  UNIQUE (user_id, reference_id);
