-- v2 du seed de calibration EE : remplace 20260729000006 par 3 repères par niveau
-- (excellent / moyen / faible) au lieu d'un seul, pour éviter que le modèle converge
-- toujours vers un score "moyen" par manque de repères aux extrêmes du barème.
--
-- Idempotent : peut être ré-exécutée sans risque de doublon, quel que soit l'état actuel
-- de la table (supprime d'abord nos propres lignes + l'ancien seed contradictoire avant
-- de réinsérer).

-- 1. Supprime nos propres exemplaires (au cas où 20260729000006 a déjà été appliquée).
DELETE FROM tef_knowledge WHERE metadata->>'category' = 'ee_calibration_exemplar';

-- 2. Supprime l'ancien seed placeholder (20240520000014_rag_seed.sql) s'il est présent :
--    son exemple B2 ("néanmoins, toutefois, richesse du vocabulaire") contredit
--    LEVEL_GUIDELINES qui interdit ce registre soutenu à B2.
DELETE FROM tef_knowledge WHERE content ILIKE 'Règle du subjonctif%'
   OR content ILIKE 'Accord du participe passé avec avoir%'
   OR content ILIKE 'Conseil Section A Expression Orale%'
   OR content ILIKE 'Critère B2 : Utilisation de connecteurs%';

-- 3. Réinsère 9 exemplaires : 3 niveaux (A2/B1/B2) x 3 paliers (excellent/moyen/faible).
INSERT INTO tef_knowledge (content, metadata) VALUES

($a2e$EXEMPLAIRE DE CALIBRATION A2 -- PALIER EXCELLENT (~92/100), message informatif.
Texte du candidat : "Bonjour, Je m'appelle Maria et j'habite à Lyon depuis six mois. Je cherche un cours de français le samedi matin parce que je travaille toute la semaine. Avez-vous des places disponibles pour les débutants ? Je peux venir le samedi entre 9h et 12h. Merci beaucoup pour votre réponse. Cordialement, Maria"
Score attendu : 92/100.
Justification : message clair, tous les verbes fréquents corrects (habite, cherche, travaille, peux venir), accords corrects, longueur respectée. AUCUNE erreur bloquante à signaler ici -- ne pas en inventer une pour remplir la liste. Un texte A2 propre et complet mérite un score élevé, même simple.$a2e$,
 '{"category": "ee_calibration_exemplar", "level": "A2", "tier": "excellent"}'),

($a2m$EXEMPLAIRE DE CALIBRATION A2 -- PALIER MOYEN (~58/100), message informatif.
Texte du candidat : "Bonjour, Je m'appelle Ahmed. Je suis arrivé en France il y a un an. Je veux apprendre le français parce que je cherche un travail. La semaine dernière, j'ai allé à la mairie pour des informations. Est-ce que vous avez des cours le matin ? Merci."
Score attendu : 58/100.
Justification : message globalement compris, longueur respectée, mais 1 erreur bloquante de conjugaison sur un verbe fréquent : "j'ai allé" au lieu de "je suis allé" (aller se conjugue avec être) -- exactement le type d'erreur à signaler en priorité à ce niveau.$a2m$,
 '{"category": "ee_calibration_exemplar", "level": "A2", "tier": "moyen"}'),

($a2f$EXEMPLAIRE DE CALIBRATION A2 -- PALIER FAIBLE (~22/100), message informatif.
Texte du candidat : "Bonjour. Je suis Fatima. Je veut apprendre français. Je travaille dans usine. Le cours quand ? Merci."
Score attendu : 22/100.
Justification : très en dessous du seuil de mots (40 min pour ce sujet, ici ~15 mots -- pénalise fortement le score_global), plusieurs erreurs bloquantes cumulées ("je veut" au lieu de "je veux", article manquant "dans usine"). Le message reste vaguement compréhensible mais le cumul longueur insuffisante + erreurs fréquentes justifie un score très bas -- ne pas remonter artificiellement par bienveillance.$a2f$,
 '{"category": "ee_calibration_exemplar", "level": "A2", "tier": "faible"}'),

($b1e$EXEMPLAIRE DE CALIBRATION B1 -- PALIER EXCELLENT (~88/100), texte argumentatif.
Texte du candidat : "Je pense que le télétravail est une bonne chose pour les salariés. D'abord, on gagne du temps parce qu'on ne perd pas de temps dans les transports. Ensuite, on peut mieux organiser sa journée et être plus concentré. Cependant, il y a aussi des inconvénients : parfois on se sent isolé et on communique moins avec les collègues. Avant, je travaillais dans un bureau et j'aimais bien parler avec les autres pendant la pause. Maintenant, je travaille à la maison et c'est plus calme, mais aussi plus solitaire. Pour conclure, je pense que c'est une bonne solution si on ne l'utilise pas tous les jours."
Score attendu : 88/100.
Justification : opinion claire et justifiée, structuration intro/développement/conclusion, contraste imparfait/passé composé maîtrisé, connecteurs variés (d'abord/ensuite/cependant/pour conclure). Pas d'erreur bloquante. Le style reste simple : c'est le niveau attendu à B1, NE PAS exiger davantage pour monter plus haut.$b1e$,
 '{"category": "ee_calibration_exemplar", "level": "B1", "tier": "excellent"}'),

($b1m$EXEMPLAIRE DE CALIBRATION B1 -- PALIER MOYEN (~62/100), texte argumentatif.
Texte du candidat : "Je pense que le télétravail est une bonne chose pour les salariés. D'abord, on gagne du temps parce qu'on ne perd pas de temps dans les transports. Ensuite, on peux mieux organiser sa journée. Mais il y a aussi des problèmes : parfois on se sent isolé et on communique moins avec les collègues. Avant, je travaillais dans un bureau et j'aimais bien parler avec les autres. Maintenant je travaille à la maison et c'est plus calme mais aussi plus solitaire. Donc c'est une bonne solution si on l'utilise pas tous les jours."
Score attendu : 62/100.
Justification : opinion exprimée et justifiée, connecteurs simples présents, contraste imparfait/passé composé maîtrisé. 2 erreurs à signaler : "on peux" (accord 3e pers. sing.), "si on l'utilise pas" (négation incomplète à l'écrit). Le style reste simple : NE PAS pénaliser pour ça, seulement les 2 erreurs ci-dessus.$b1m$,
 '{"category": "ee_calibration_exemplar", "level": "B1", "tier": "moyen"}'),

($b1f$EXEMPLAIRE DE CALIBRATION B1 -- PALIER FAIBLE (~28/100), texte argumentatif.
Texte du candidat : "Je pense télétravail est bon pour salarié. On gagne temps. Mais il y a problème parfois on est seul. Avant je travaille au bureau et j'aime parler avec collègue. Maintenant je reste maison. C'est bien mais difficile."
Score attendu : 28/100.
Justification : nettement en dessous du seuil de mots (100 min, ici ~45 mots), déterminants manquants de façon répétée ("bon pour salarié", "il y a problème"), aucune structuration ni connecteur logique, confusion temporelle ("avant je travaille" -- l'imparfait est attendu). Cumul de plusieurs erreurs prioritaires B1, score bas justifié.$b1f$,
 '{"category": "ee_calibration_exemplar", "level": "B1", "tier": "faible"}'),

($b2e$EXEMPLAIRE DE CALIBRATION B2 -- PALIER EXCELLENT (~91/100), texte argumentatif.
Texte du candidat : "De nos jours, beaucoup de personnes s'interrogent sur l'impact des réseaux sociaux sur les relations humaines. D'un côté, ces plateformes permettent de rester en contact avec des proches éloignés et facilitent l'échange d'informations. Cependant, elles peuvent aussi nuire à la qualité des échanges réels, en encourageant une communication plus superficielle. Je me suis souvent demandé si mes propres habitudes avaient changé à cause de cela. Pour ma part, je pense qu'il faut trouver un équilibre : profiter des avantages sans remplacer les rencontres en personne. Les entreprises et les écoles ont d'ailleurs un rôle à jouer en sensibilisant les jeunes à un usage raisonné. En conclusion, les réseaux sociaux ne sont ni bons ni mauvais en soi, tout dépend de l'usage qu'on en fait."
Score attendu : 91/100.
Justification : argumentation nuancée (concession puis contre-argument), connecteurs B2 variés et courants, accord du participe passé pronominal correct ("avaient changé", invariable ici). Registre courant/soutenu standard, SANS vocabulaire livresque. Quasiment aucune erreur -- ne pas en inventer une pour remplir la liste.$b2e$,
 '{"category": "ee_calibration_exemplar", "level": "B2", "tier": "excellent"}'),

($b2m$EXEMPLAIRE DE CALIBRATION B2 -- PALIER MOYEN (~62/100), texte argumentatif.
Texte du candidat : "De nos jours, beaucoup de personnes s'interrogent sur l'impact des réseaux sociaux sur les relations humaines. D'un côté, ces plateformes permettent de rester en contact avec des proches éloignés et facilitent l'échange d'informations. Cependant, elles peuvent aussi nuire à la qualité des échanges réels, en encourageant une communication plus superficielle. Je me suis souvent demandé si mes propres habitudes avaient changées à cause de ça. Pour ma part, je pense qu'il faut trouver un équilibre : profiter des avantages sans remplacer les rencontres en personne. En conclusion, les réseaux sociaux ne sont ni bons ni mauvais en soi, tout dépend de l'usage qu'on en fait."
Score attendu : 62/100.
Justification : argumentation nuancée, connecteurs B2 bien utilisés, conclusion présente. 1 erreur B2 typique à signaler : accord du participe passé pronominal "avaient changées" (invariable ici, "changé"). Le registre reste courant SANS vocabulaire livresque : c'est le niveau attendu, ne pas suggérer de l'enrichir.$b2m$,
 '{"category": "ee_calibration_exemplar", "level": "B2", "tier": "moyen"}'),

($b2f$EXEMPLAIRE DE CALIBRATION B2 -- PALIER FAIBLE (~28/100), texte argumentatif.
Texte du candidat : "Les réseaux sociaux sont utile pour la vie. On peut parler avec ami loin. Mais des fois c'est pas bon parce que les gens regarde tout le temps le telephone. Moi je pense faut faire attention avec ça. Voilà mon avis."
Score attendu : 28/100.
Justification : nettement en dessous du seuil de mots (100 min, ici ~45 mots), registre trop familier ("des fois", "c'est pas") inadapté à un texte formel/argumentatif B2, erreurs d'accord répétées ("utile" invariable, "les gens regarde"), argumentation quasi absente (pas de nuance, pas de connecteurs B2). Cumul de plusieurs INTERDITS B2, score bas justifié.$b2f$,
 '{"category": "ee_calibration_exemplar", "level": "B2", "tier": "faible"}');
