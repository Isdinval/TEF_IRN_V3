-- Arbitrage manuel des cas non-resolus par le backfill automatique (20260915000002).
-- Decisions prises avec Olivier (2026-09-15) :
-- - Sujet transversal a 2 piliers -> on garde le pilier le plus specifique au coeur du sujet.
-- - carte-resident-10-ans-documents-a-fournir / fonctionnalites-llamakusi -> choix libre.
-- - Les 16 guides-parcours (compagnons "Besoin d'aide ?" d'un parcours precis, cf. skill
--   llamakusi-parcours-guide) n'avaient AUCUN pilier parcours existant -> creation d'un nouveau
--   pilier `parcours-guides-aide-tef-irn`, publie a false (contenu a etoffer par Olivier avant
--   mise en ligne), qui les regroupe par competence (grammaire/conjugaison/syntaxe/vocabulaire).
--
-- Dry-run BEGIN/ROLLBACK verifie sur jksrmyyfllitrkarvgvk : 0 satellite publie restant sans
-- parent_guide_id apres cette migration (135/135).

-- 6 satellites transversaux (sujet couvrant 2 piliers)
UPDATE guides SET parent_guide_id = (SELECT id FROM guides WHERE slug='resultats-echec-budget-examen-civique-guide-complet' AND product='examen-civique')
WHERE slug='budget-complet-naturalisation-2026' AND product='examen-civique';

UPDATE guides SET parent_guide_id = (SELECT id FROM guides WHERE slug='comprendre-examen-civique-guide-complet' AND product='examen-civique')
WHERE slug='examen-civique-csp-niveau-a2-cumulatif' AND product='examen-civique';

UPDATE guides SET parent_guide_id = (SELECT id FROM guides WHERE slug='resultats-echec-budget-examen-civique-guide-complet' AND product='examen-civique')
WHERE slug='naturalisation-condition-moralite-casier-judiciaire' AND product='examen-civique';

UPDATE guides SET parent_guide_id = (SELECT id FROM guides WHERE slug='naturalisation-demarches-tef-irn-guide-complet' AND product='tef-irn')
WHERE slug='tcf-irn-inscription-demarche' AND product='tef-irn';

UPDATE guides SET parent_guide_id = (SELECT id FROM guides WHERE slug='methode-revision-tef-irn-guide-complet' AND product='tef-irn')
WHERE slug='tef-irn-niveau-sous-estime' AND product='tef-irn';

UPDATE guides SET parent_guide_id = (SELECT id FROM guides WHERE slug='tout-comprendre-tef-irn' AND product='tef-irn')
WHERE slug='test-niveau-francais-gratuit-tef-irn' AND product='tef-irn';

-- 2 cas libres
UPDATE guides SET parent_guide_id = (SELECT id FROM guides WHERE slug='comprendre-examen-civique-guide-complet' AND product='examen-civique')
WHERE slug='carte-resident-10-ans-documents-a-fournir' AND product='examen-civique';

UPDATE guides SET parent_guide_id = (SELECT id FROM guides WHERE slug='tout-comprendre-tef-irn' AND product='tef-irn')
WHERE slug='fonctionnalites-llamakusi' AND product='tef-irn';

-- Nouveau pilier "parcours guides" (n'existait pas) - is_published=false volontairement :
-- structure/liens corrects, contenu redactionnel a valider par Olivier avant mise en ligne.
INSERT INTO guides (
  slug, title, product, category, type, silo_role, level, is_published,
  description, content, parent_guide_id
) VALUES (
  'parcours-guides-aide-tef-irn',
  'Parcours guidés TEF IRN : tous les guides d''aide',
  'tef-irn', 'parcours-guides', 'methodologie', 'pilier', 'A1, A2, B1, B2', false,
  'Index de tous les guides d''aide "Besoin d''aide ?" rattaches a un parcours guide LlamaKusi, regroupes par competence.',
  $md$# Parcours guidés TEF IRN : tous les guides d'aide

Chaque parcours guidé LlamaKusi propose sa propre carte "Besoin d'aide ?" pour t'accompagner pas à pas. Retrouve ici l'ensemble de ces guides, classés par compétence.

Retour au [guide complet naturalisation et TEF IRN](/tef-irn/guides/naturalisation-francaise-guide-complet).

## Grammaire
- [Messages simples (A1)](/tef-irn/guides/messages-simples-gram-a1-guide-parcours)
- [Nuancer et comparer (A2)](/tef-irn/guides/nuancer-comparer-gram-a2-guide-parcours)
- [Nuancer ses opinions (B1)](/tef-irn/guides/nuancer-opinions-gram-b1-guide-parcours)
- [Structures d'argumentation (B2)](/tef-irn/guides/structures-argumentation-gram-b2-guide-parcours)

## Conjugaison
- [Parler de soi (A1)](/tef-irn/guides/parler-soi-conj-a1-guide-parcours)
- [Expériences et souvenirs (A2)](/tef-irn/guides/experiences-souvenirs-conj-a2-guide-parcours)
- [Hypothèse, politesse, obligation (B1)](/tef-irn/guides/hypothese-politesse-obligation-conj-b1-guide-parcours)
- [Nuances temporelles (B2)](/tef-irn/guides/nuances-temporelles-conj-b2-guide-parcours)

## Syntaxe
- [Premières phrases (A1)](/tef-irn/guides/premieres-phrases-syn-a1-guide-parcours)
- [Relier ses idées (A2)](/tef-irn/guides/relier-idees-syn-a2-guide-parcours)
- [Discours cohérent (B1)](/tef-irn/guides/discours-coherent-syn-b1-guide-parcours)
- [Textes clairs et argumentation (B2)](/tef-irn/guides/textes-clairs-argumentation-syn-b2-guide-parcours)

## Vocabulaire
- [Présentation et environnement (A1)](/tef-irn/guides/presentation-environnement-voc-a1-guide-parcours)
- [Logement, soins, démarches (A2)](/tef-irn/guides/logement-soins-demarches-voc-a2-guide-parcours)
- [Professionnel, médias, santé (B1)](/tef-irn/guides/professionnel-medias-sante-voc-b1-guide-parcours)
- [Débat, société, monde (B2)](/tef-irn/guides/debat-societe-monde-voc-b2-guide-parcours)
$md$,
  (SELECT id FROM guides WHERE silo_role='hub' AND is_published=true LIMIT 1)
);

-- Rattache les 16 satellites parcours au nouveau pilier
UPDATE guides
SET parent_guide_id = (SELECT id FROM guides WHERE slug='parcours-guides-aide-tef-irn')
WHERE slug LIKE '%-guide-parcours';
