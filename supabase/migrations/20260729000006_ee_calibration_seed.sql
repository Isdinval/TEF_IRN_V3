-- Exemplaires de calibration pour la correction EE (src/app/api/writing/correct/route.ts).
--
-- Objectif : donner à l'IA un point d'ancrage concret ("à quoi ressemble une copie notée
-- correctement à ce niveau") en plus du référentiel textuel LEVEL_GUIDELINES déjà présent
-- dans le prompt. Un seul exemplaire par niveau est injecté par requête (celui du niveau
-- du sujet en cours), via une lecture directe metadata->>level / metadata->>category --
-- PAS de recherche vectorielle : le niveau recherché est toujours connu à l'avance, une
-- similarité sémantique n'apporterait rien ici (voir analyse "RAG vs lookup déterministe").
--
-- NB : ces exemplaires sont rédigés pour l'occasion (candidats fictifs), pas des copies
-- réelles de la CCI Paris IDF -- ils servent à illustrer la sévérité attendue, pas à
-- reproduire un barème officiel verbatim.
--
-- IMPORTANT : ne pas appliquer 20240520000014_rag_seed.sql tel quel en complément -- son
-- 4e exemple ("Critère B2 : ... néanmoins, toutefois ...") pousse un vocabulaire soutenu
-- que LEVEL_GUIDELINES (route correct) interdit explicitement à B2. Si ce fichier a déjà
-- été exécuté sur l'environnement cible, supprimer cette ligne :
--   DELETE FROM tef_knowledge WHERE metadata->>'topic' = 'B2' AND metadata->>'category' = 'critère';

INSERT INTO tef_knowledge (content, metadata) VALUES
($ex1$EXEMPLAIRE DE CALIBRATION A2 (Carte de séjour pluriannuelle, message informatif, ~40 mots).
Texte du candidat : "Bonjour, Je vous écris pour dire que je suis intéressé par votre cours de français. Je travaille dans un restaurant et je suis disponible le soir après 18h. Est-ce que vous avez des cours cette semaine ? Merci de votre réponse."
Score attendu : 78/100.
Justification : message compris, sujet traité, verbes fréquents corrects. Petite maladresse ("dire que je suis intéressé" un peu plat) mais TOLÉRÉE à ce niveau -- ne pas la signaler comme faute. Aucune erreur bloquante de conjugaison/accord ici : ce texte est un exemple de bonne copie A2, pas une copie sans reproche absolu.$ex1$,
 '{"category": "ee_calibration_exemplar", "level": "A2"}'),

($ex2$EXEMPLAIRE DE CALIBRATION B1 (Carte de résident, texte argumentatif, ~100 mots).
Texte du candidat : "Je pense que le télétravail est une bonne chose pour les salariés. D'abord, on gagne du temps parce qu'on ne perd pas de temps dans les transports. Ensuite, on peux mieux organiser sa journée. Mais il y a aussi des problèmes : parfois on se sent isolé et on communique moins avec les collègues. Avant, je travaillais dans un bureau et j'aimais bien parler avec les autres. Maintenant je travaille à la maison et c'est plus calme mais aussi plus solitaire. Donc c'est une bonne solution si on l'utilise pas tous les jours."
Score attendu : 65/100.
Justification : opinion exprimée et justifiée, connecteurs simples présents (d'abord/ensuite/donc), contraste imparfait/passé composé maîtrisé ("avant je travaillais... maintenant je travaille"). 2 erreurs à signaler : "on peux" (accord 3e pers. sing.), "si on l'utilise pas" (négation incomplète, régulière à l'oral mais à corriger à l'écrit). Le style reste simple : NE PAS pénaliser pour ça, seulement les 2 erreurs ci-dessus.$ex2$,
 '{"category": "ee_calibration_exemplar", "level": "B1"}'),

($ex3$EXEMPLAIRE DE CALIBRATION B2 (Naturalisation, texte argumentatif, ~130 mots).
Texte du candidat : "De nos jours, beaucoup de personnes s'interrogent sur l'impact des réseaux sociaux sur les relations humaines. D'un côté, ces plateformes permettent de rester en contact avec des proches éloignés et facilitent l'échange d'informations. Cependant, elles peuvent aussi nuire à la qualité des échanges réels, en encourageant une communication plus superficielle. Je me suis souvent demandé si mes propres habitudes avaient changées à cause de ça. Pour ma part, je pense qu'il faut trouver un équilibre : profiter des avantages sans remplacer les rencontres en personne. En conclusion, les réseaux sociaux ne sont ni bons ni mauvais en soi, tout dépend de l'usage qu'on en fait."
Score attendu : 74/100.
Justification : argumentation nuancée (concession "cependant" puis contre-argument), connecteurs B2 courants bien utilisés, conclusion présente. 1 erreur B2 typique à signaler : accord du participe passé pronominal "avaient changées" (invariable ici, "changé"). Le registre reste courant/soutenu standard SANS vocabulaire livresque : c'est le niveau attendu, ne pas suggérer de l'enrichir davantage.$ex3$,
 '{"category": "ee_calibration_exemplar", "level": "B2"}');
