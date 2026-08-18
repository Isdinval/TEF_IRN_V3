-- Item 20 du plan "Refonte recommandation erreur -> tag -> ressource" :
-- decouvert lors du retest P0, generalise via le diagnostic item 21 : sur 99
-- lecons, 26 ont au moins un de leurs propres tags (celui utilise comme
-- sub_category dans les recommandations, contraint a la taxonomie
-- officielle) jamais porte par aucun de leurs propres exercices qcm/trous.
-- Le pipeline de generation d'exercices utilise des tags plus descriptifs
-- ("adjectifs demonstratifs", "formes interrogatives"...) au lieu du mot
-- officiel de la lecon ("demonstratifs", "interrogation"...) -- consequence
-- concrete : le palier "exercices de la lecon recommandee" (item 19) ne
-- trouvait jamais rien sur ces 26 lecons, meme quand le contenu pertinent
-- existait.
--
-- Fix : ajout ADDITIF (jamais de suppression) du tag officiel de la lecon a
-- 1-2 exercices representatifs de cette lecon, choisis un par un par lecture
-- de point_clés_lesson. Verifie en base avant/apres : le tag s'ajoute bien
-- sans retirer les tags existants.
--
-- Perimetre : 30 des 51 paires (lecon, tag orphelin) identifiees. Exclusions
-- volontaires, documentees ici plutot que forcees :
-- - 9 tags sont eux-memes absents de la taxonomie officielle (tags de LECON
--   non-officiels : "chez", "distinction subjonctif present passe",
--   "formation du subjonctif present" en tant que tag de lecon, "liaisons
--   orales", "prepositions spatiales", "savoir", "usages de l'imparfait",
--   "usages du passe compose", "usages du plus-que-parfait", "villes et
--   pays prepositions", "vue ensemble discours rapporte present") -- les
--   ajouter aux exercices ne servirait a rien tant que le tag de lecon
--   lui-meme n'est pas regularise (question distincte, item 22).
-- - 4 lecons/notions n'ont aucun exercice existant correspondant a la
--   notion precise recherchee (subjonctif passe, venir et passe compose sur
--   la lecon "Subjonctif Present et Passe" ; aller/avoir/etre/faire/
--   pouvoir/verbes irreguliers/vouloir sur "Subjonctif vs Indicatif" ;
--   present sur "Les Verbes Pronominaux" B1) -- probable trou de contenu,
--   pas un probleme de tag : force un tag sur un exercice qui n'aborde pas
--   reellement la notion aurait ete trompeur.
--
-- Teste avant livraison : chaque UPDATE verifie en transaction, tag ajoute
-- sans perte des tags existants (verifie sur 2 cas representatifs).

UPDATE exercises SET tags = array_append(tags, 'vocabulaire santé') WHERE id='e8387bd4-b006-493b-ad02-c14b006fe84e' AND NOT ('vocabulaire santé' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'vocabulaire travail') WHERE id='1a680ccd-5ab8-4140-9a21-38cf58b1bdd3' AND NOT ('vocabulaire travail' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'compréhension orale') WHERE id='58e34e7f-2086-4e7d-9b9f-b89990b60ab8' AND NOT ('compréhension orale' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'registre soutenu') WHERE id='bfad1168-39e8-4101-aee0-02401a95966a' AND NOT ('registre soutenu' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'imparfait') WHERE id='556a3c53-818f-4ce5-90b8-b83834aa9519' AND NOT ('imparfait' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'futur simple') WHERE id='32a9b00a-ba5d-43ec-b764-025d78fe5edb' AND NOT ('futur simple' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'passé composé') WHERE id='fc9ab3b5-47cc-4a5f-afaf-093c04875470' AND NOT ('passé composé' = ANY(tags));
UPDATE exercises SET tags = array_cat(tags, ARRAY['être','avoir']) WHERE id='81ada338-e85b-447f-8d74-f1c049c7e3bc';
UPDATE exercises SET tags = array_append(tags, 'expression orale') WHERE id='9767cd56-0ee5-4ff0-a4ce-7d67f85928fa' AND NOT ('expression orale' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'connecteurs cause/conséquence') WHERE id='07fe5429-c115-46dd-8f95-fcac0f486331' AND NOT ('connecteurs cause/conséquence' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'vocabulaire famille/logement') WHERE id='da559765-e64d-4331-9a1c-d72afd8d26d0' AND NOT ('vocabulaire famille/logement' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'subjonctif présent') WHERE id='2d357a3a-1d63-423c-b31c-bc6241359bd8' AND NOT ('subjonctif présent' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'démonstratifs') WHERE id='4982b640-a572-42b1-81b7-d4e72ad72521' AND NOT ('démonstratifs' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'expression orale') WHERE id='4f908757-a03b-449f-b6da-d28e0333d78a' AND NOT ('expression orale' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'registre de langue') WHERE id='8755e073-32bd-453a-97b5-5520cef56915' AND NOT ('registre de langue' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'imparfait') WHERE id='84b789bb-d72b-4744-b148-1611fd27d86a' AND NOT ('imparfait' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'passé composé') WHERE id='98e8fdc1-2373-4c9c-94cf-bcf77f873bb6' AND NOT ('passé composé' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'plus-que-parfait') WHERE id='01d35664-3df6-44ca-8ad4-f80bb0f160db' AND NOT ('plus-que-parfait' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'interrogation') WHERE id='babc9344-e479-4042-8f32-f6f78755d5c1' AND NOT ('interrogation' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'prépositions de temps') WHERE id='e66c5547-144e-4b77-b42e-62bf9a979f8f' AND NOT ('prépositions de temps' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'vocabulaire famille/logement') WHERE id='c3fcbbd9-e429-4c6a-8408-9d509410182f' AND NOT ('vocabulaire famille/logement' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'expression orale') WHERE id='b10f5123-87cf-4ddc-a9b4-8d31a205632e' AND NOT ('expression orale' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'quotidien') WHERE id='a6e61c5a-4839-48d7-bfc9-3e92182c3db3' AND NOT ('quotidien' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'vocabulaire civique') WHERE id='6cc8c1e7-0a3d-4e84-8999-7de4a45e1fec' AND NOT ('vocabulaire civique' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'vocabulaire société') WHERE id='bffe6514-447b-46d1-90ad-51de9a5386a7' AND NOT ('vocabulaire société' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'genre et nombre') WHERE id='fb5433c8-da5e-4283-b883-8d3572799add' AND NOT ('genre et nombre' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'pluriel') WHERE id='b8b86760-59cc-4dee-aef2-130c93fcc762' AND NOT ('pluriel' = ANY(tags));
UPDATE exercises SET tags = array_append(tags, 'verbes irréguliers') WHERE id='94927044-e253-4c16-a2bd-0c6825c19fe5' AND NOT ('verbes irréguliers' = ANY(tags));
