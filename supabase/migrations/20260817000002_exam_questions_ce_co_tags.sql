-- Item 3 du plan "Refonte recommandation erreur -> tag -> ressource" :
-- exam_questions n'avait aucune colonne category/tags, donc impossible de
-- savoir quelle notion une question CE/CO ratee concerne. ExamContext.tsx
-- ne peut donc pas encore appeler trackUserError pour CE/CO (item 5, a
-- suivre) sans cette base.
--
-- Convention retenue pour `category` (validee avec Olivier) :
-- - 'Syntaxe' pour le cas generique CE/CO -- coherent avec la taxonomie
--   officielle (docs/lessons-tags-taxonomy.md, tags "comprehension ecrite"/
--   "comprehension orale" deja classes sous Syntaxe) et avec lessons.category
--   = 'syntaxe' (correspondance exacte apres toLowerCase() dans
--   analyzeUserErrorsAndRecommend).
-- - 'Vocabulaire' pour les questions CE format `trous`, qui testent une
--   distinction lexicale precise (regle n°3, docs/ce-content-calibration-
--   rules.md) -- CHOIX DELIBERE de ne PAS reproduire l'incoherence deja
--   presente sur exercises.category (des exercices a tags "vocabulaire ..."
--   y sont categorises 'Grammaire'/'Orthographe' alors que leur lecon
--   parente est 'vocabulaire', empechant tout matching -- cf. item 16,
--   ajoute au plan, non traite ici). 'Vocabulaire' correspond exactement a
--   lessons.category = 'vocabulaire', donc fonctionne correctement des le
--   depart pour les questions CE/CO.
--
-- Tags utilises : uniquement des tags deja presents dans la taxonomie
-- officielle (aucune creation) : "comprehension ecrite", "comprehension
-- orale", "vocabulaire emploi", "vocabulaire administratif", "vocabulaire
-- sante", "vocabulaire logement".
--
-- Peuplement des 12 questions CE format `trous` existantes : lues une a
-- une par Claude, tagging propose et valide par Olivier avant application
-- (cf. echange precedent).
--
-- Teste avant livraison (transaction BEGIN/ALTER/UPDATE/SELECT/ROLLBACK) :
-- 0 question CE/CO non taguee apres application, repartition verifiee
-- conforme a la proposition validee.

ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.exam_questions ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_exam_questions_tags ON public.exam_questions USING GIN (tags);

-- CE générique (tous formats sauf trous)
UPDATE public.exam_questions
SET category = 'Syntaxe', tags = ARRAY['compréhension écrite']
WHERE section = 'CE' AND (ce_format IS NULL OR ce_format <> 'trous');

-- CO générique (tous formats)
UPDATE public.exam_questions
SET category = 'Syntaxe', tags = ARRAY['compréhension orale']
WHERE section = 'CO';

-- CE format trous : tag précis question par question (validé)
UPDATE public.exam_questions SET category = 'Vocabulaire', tags = ARRAY['vocabulaire emploi']
WHERE id IN (
  '2bda75f7-0fe2-4834-9072-fc79570e8c20', -- "je vous transmets ma candidature..." (poste assistant commercial)
  'b9cf158d-6e51-40fb-b0e4-e0f65be531d1', -- "...entière disposition" (même passage)
  '31fb3a88-ddd8-4ae3-9dd6-d2ce56ae21c1', -- "lire attentivement chaque clause" (contrat)
  '11f5089d-b6f8-4305-9e49-0445bd20ff4e'  -- "L'employeur a décidé de féliciter le salarié"
);

UPDATE public.exam_questions SET category = 'Vocabulaire', tags = ARRAY['vocabulaire administratif']
WHERE id IN (
  '27f8d1dd-d590-4d0b-b690-27d69ba2963a', -- "préfecture... numéro unique... accéder..."
  '54c8f0fc-0184-41e7-8857-66c733f256d1', -- "...réduire les délais d'attente" (même passage)
  '92a3c57e-75d6-41fc-9cdc-a1ba479af8da', -- "prendre un rendez-vous en ligne" (carte d'identité)
  '3e2b5890-b4b2-4434-ba05-202cac87a26f'  -- "dossier de demande de logement social doit être déposé"
);

UPDATE public.exam_questions SET category = 'Vocabulaire', tags = ARRAY['vocabulaire santé']
WHERE id IN (
  '73556e4e-dabb-4c04-b5fe-40a4f26634b4', -- "mutuelle vous garantit le remboursement..."
  'f93fc9c2-4585-452a-82e2-78af4959c242', -- "...obtenir ce remboursement" (même passage)
  'fc9d3244-988b-45cb-b883-7a626ba59f06'  -- "médecin a conseillé... prendre un rendez-vous chez un spécialiste"
);

UPDATE public.exam_questions SET category = 'Vocabulaire', tags = ARRAY['vocabulaire logement']
WHERE id = '5124fa60-f497-4617-a2fa-ff6f64dcb1f2'; -- "locataire doit informer son propriétaire de tout dégât"
