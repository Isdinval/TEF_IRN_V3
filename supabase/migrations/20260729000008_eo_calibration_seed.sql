-- Exemplaires de calibration pour l'analyse EO (src/app/api/oral/analyze/route.ts).
--
-- Miroir direct de 20260729000007_ee_calibration_seed_v2.sql, mais pour l'oral :
-- 3 niveaux (A2/B1/B2) x 3 paliers (excellent/moyen/faible) = 9 exemplaires.
-- Chaque exemplaire est une transcription courte (candidat + examinateur) plutôt qu'un
-- texte, pour donner un repère concret sur LES 5 CRITÈRES ORAUX (pas les 4 critères EE) :
-- pertinence_et_adequation_au_sujet, coherence_et_interaction,
-- etendue_et_precision_du_vocabulaire, correction_grammaticale, aisance_et_fluidite.
--
-- Simplification assumée : pas de distinction Section A (formel) / Section B (informel)
-- dans les exemplaires -- les 5 critères évaluent la compétence linguistique du candidat,
-- pas le registre de la mise en scène, donc un seul jeu par niveau suffit pour calibrer le
-- barème. Si l'analyse en pratique montre un biais entre sections, on pourra affiner plus
-- tard (cf. discussion produit) sans changer le mécanisme de lookup.
--
-- NB : transcriptions rédigées pour l'occasion (candidats fictifs), pas des extraits réels
-- d'examen -- elles illustrent la sévérité attendue, pas un barème officiel verbatim.
--
-- Idempotent : supprime nos propres lignes avant de réinsérer.

DELETE FROM tef_knowledge WHERE metadata->>'category' = 'eo_calibration_exemplar';

INSERT INTO tef_knowledge (content, metadata) VALUES

($a2e$EXEMPLAIRE DE CALIBRATION A2 -- PALIER EXCELLENT (~88/100), Section A (renseignements, formel).
Extrait : EXAMINATEUR : "Bonjour, mairie de Lyon, j'écoute." / CANDIDAT : "Bonjour madame, je voudrais des informations sur les papiers pour la carte de séjour, s'il vous plaît." / EXAMINATEUR : "Oui, quel type de carte cherchez-vous ?" / CANDIDAT : "C'est pour une carte pluriannuelle. Est-ce qu'il faut prendre un rendez-vous ou je peux venir directement ?" / EXAMINATEUR : "Il faut un rendez-vous, oui." / CANDIDAT : "D'accord, et vous êtes ouverts quels jours de la semaine ?"
Scores attendus : pertinence_et_adequation_au_sujet 90, coherence_et_interaction 85, etendue_et_precision_du_vocabulaire 82, correction_grammaticale 88, aisance_et_fluidite 90.
Justification : le candidat mène l'échange en posant des questions ciblées (conforme à la dynamique Section A), enchaîne logiquement une question après l'autre, vouvoie correctement, verbes et structures interrogatives corrects ("est-ce que", "il faut"). Réponses fluides sans hésitation transcrite. Aucune erreur bloquante -- ne pas en inventer une pour la case correction_grammaticale.$a2e$,
 '{"category": "eo_calibration_exemplar", "level": "A2", "tier": "excellent"}'),

($a2m$EXEMPLAIRE DE CALIBRATION A2 -- PALIER MOYEN (~58/100), Section A (renseignements, formel).
Extrait : EXAMINATEUR : "Bonjour, bibliothèque municipale." / CANDIDAT : "Bonjour... euh je voudrais savoir pour les cours de français." / EXAMINATEUR : "Vous cherchez quel niveau ?" / CANDIDAT : "Niveau... débutant, je pense. C'est où exactement ?" / EXAMINATEUR : "C'est au deuxième étage." / CANDIDAT : "Ok. Et le prix, c'est combien ?"
Scores attendus : pertinence_et_adequation_au_sujet 65, coherence_et_interaction 55, etendue_et_precision_du_vocabulaire 50, correction_grammaticale 60, aisance_et_fluidite 55.
Justification : questions courtes et globalement pertinentes, mais réponses très minimales ("Ok."), vocabulaire limité aux mots essentiels, une hésitation transcrite ("euh"), aucune reformulation ni relance de sa part -- typique A2 : compréhensible mais peu développé.$a2m$,
 '{"category": "eo_calibration_exemplar", "level": "A2", "tier": "moyen"}'),

($a2f$EXEMPLAIRE DE CALIBRATION A2 -- PALIER FAIBLE (~25/100), Section A (renseignements, formel).
Extrait : EXAMINATEUR : "Bonjour, j'écoute." / CANDIDAT : "Bonjour... je veux... cours français." / EXAMINATEUR : "Vous cherchez des cours de français, d'accord. Pour quel niveau ?" / CANDIDAT : "Euh... oui... niveau..." / EXAMINATEUR : "Prenez votre temps." / CANDIDAT : "Je sais pas."
Scores attendus : pertinence_et_adequation_au_sujet 30, coherence_et_interaction 20, etendue_et_precision_du_vocabulaire 22, correction_grammaticale 25, aisance_et_fluidite 20.
Justification : mots isolés sans construction de phrase ("je veux... cours français"), incapacité à répondre à une question simple malgré la relance de l'examinateur, quasiment aucune production autonome -- score très bas justifié sur les 5 critères, sans complaisance.$a2f$,
 '{"category": "eo_calibration_exemplar", "level": "A2", "tier": "faible"}'),

($b1e$EXEMPLAIRE DE CALIBRATION B1 -- PALIER EXCELLENT (~86/100), Section B (conseil, informel).
Extrait : EXAMINATEUR : "J'hésite entre prendre l'avion ou le train pour mes vacances, qu'est-ce que tu en penses ?" / CANDIDAT : "Ça dépend de la distance je pense. Si c'est loin, l'avion est plus rapide, mais le train c'est mieux pour l'environnement et souvent moins stressant." / EXAMINATEUR : "Oui c'est vrai, mais le train coûte parfois plus cher." / CANDIDAT : "C'est vrai, mais si tu réserves à l'avance, tu peux trouver des prix corrects. Moi je préfère le train parce qu'on peut se lever, regarder le paysage, c'est plus agréable."
Scores attendus : pertinence_et_adequation_au_sujet 88, coherence_et_interaction 85, etendue_et_precision_du_vocabulaire 82, correction_grammaticale 85, aisance_et_fluidite 90.
Justification : argumentation avec nuance ("ça dépend"), réagit directement à l'objection de l'examinateur au lieu de l'ignorer, connecteurs simples (mais, parce que), tutoiement correct et constant (registre Section B). Réponses développées, aucune erreur grammaticale bloquante.$b1e$,
 '{"category": "eo_calibration_exemplar", "level": "B1", "tier": "excellent"}'),

($b1m$EXEMPLAIRE DE CALIBRATION B1 -- PALIER MOYEN (~60/100), Section B (conseil, informel).
Extrait : EXAMINATEUR : "J'hésite entre prendre l'avion ou le train pour mes vacances, qu'est-ce que tu en penses ?" / CANDIDAT : "Je pense l'avion c'est bien parce que c'est rapide." / EXAMINATEUR : "Oui, mais le train c'est plus écologique." / CANDIDAT : "Ah oui... c'est vrai aussi. Mais moi je prends toujours l'avion." / EXAMINATEUR : "D'accord, pourquoi ?" / CANDIDAT : "Parce que j'aime pas attendre longtemps."
Scores attendus : pertinence_et_adequation_au_sujet 62, coherence_et_interaction 58, etendue_et_precision_du_vocabulaire 55, correction_grammaticale 60, aisance_et_fluidite 62.
Justification : donne un avis et une raison simple, réagit à l'objection ("ah oui, c'est vrai aussi") sans vraiment développer davantage, phrases courtes juxtaposées plutôt qu'articulées. Négation orale "j'aime pas" tolérée à l'oral B1, pas à signaler comme faute bloquante. Reste dans une zone moyenne, sans erreur grave ni développement réel.$b1m$,
 '{"category": "eo_calibration_exemplar", "level": "B1", "tier": "moyen"}'),

($b1f$EXEMPLAIRE DE CALIBRATION B1 -- PALIER FAIBLE (~28/100), Section B (conseil, informel).
Extrait : EXAMINATEUR : "J'hésite entre prendre l'avion ou le train pour mes vacances, qu'est-ce que tu en penses ?" / CANDIDAT : "Euh... avion, oui." / EXAMINATEUR : "Pourquoi l'avion plutôt que le train ?" / CANDIDAT : "Je sais pas... c'est bien." / EXAMINATEUR : "Bien pour quoi, tu peux dire un peu plus ?" / CANDIDAT : "Oui... rapide."
Scores attendus : pertinence_et_adequation_au_sujet 35, coherence_et_interaction 20, etendue_et_precision_du_vocabulaire 25, correction_grammaticale 30, aisance_et_fluidite 25.
Justification : réponses en un mot malgré deux relances explicites de l'examinateur, aucune justification construite, pas d'échange réel -- très en dessous des attentes B1 (raconter, justifier, prendre part à l'échange). Score bas cohérent sur les 5 critères.$b1f$,
 '{"category": "eo_calibration_exemplar", "level": "B1", "tier": "faible"}'),

($b2e$EXEMPLAIRE DE CALIBRATION B2 -- PALIER EXCELLENT (~90/100), Section B (conseil, informel).
Extrait : EXAMINATEUR : "J'hésite à changer de métier, je me sens pas épanoui, qu'est-ce que tu en penses ?" / CANDIDAT : "Je comprends, c'est une décision importante. Est-ce que c'est vraiment le métier le problème, ou plutôt l'ambiance de ton entreprise ? Parce que parfois on peut changer de poste sans tout quitter." / EXAMINATEUR : "C'est vrai, je n'y avais pas pensé comme ça." / CANDIDAT : "Du coup, avant de tout changer, je pense qu'il vaudrait mieux essayer d'en parler avec ton responsable, et si vraiment rien ne bouge, là ça vaudrait le coup de chercher ailleurs."
Scores attendus : pertinence_et_adequation_au_sujet 92, coherence_et_interaction 90, etendue_et_precision_du_vocabulaire 88, correction_grammaticale 88, aisance_et_fluidite 92.
Justification : nuance l'avis en distinguant deux causes possibles, pousse la réflexion de l'interlocuteur (l'examinateur change explicitement d'avis, preuve d'une interaction réelle), conditionnel bien maîtrisé ("il vaudrait mieux", "ça vaudrait le coup"), argumentation structurée en plusieurs étapes. Registre courant B2, sans vocabulaire livresque -- c'est le niveau attendu, ne pas exiger plus.$b2e$,
 '{"category": "eo_calibration_exemplar", "level": "B2", "tier": "excellent"}'),

($b2m$EXEMPLAIRE DE CALIBRATION B2 -- PALIER MOYEN (~63/100), Section B (conseil, informel).
Extrait : EXAMINATEUR : "J'hésite à changer de métier, je me sens pas épanoui, qu'est-ce que tu en penses ?" / CANDIDAT : "Je pense que si tu es pas content, il faut changer. C'est important d'être bien dans son travail." / EXAMINATEUR : "Oui mais c'est un risque financier aussi." / CANDIDAT : "C'est vrai, mais je pense que la santé c'est plus important que l'argent, donc il faut réfléchir mais pas trop attendre non plus."
Scores attendus : pertinence_et_adequation_au_sujet 68, coherence_et_interaction 62, etendue_et_precision_du_vocabulaire 58, correction_grammaticale 60, aisance_et_fluidite 65.
Justification : avis clair et une réaction à l'objection financière, mais argumentation qui reste générale ("c'est important d'être bien"), sans exemple concret ni nuance fine. Correct mais sans la profondeur attendue au sommet B2 -- zone moyenne cohérente.$b2m$,
 '{"category": "eo_calibration_exemplar", "level": "B2", "tier": "moyen"}'),

($b2f$EXEMPLAIRE DE CALIBRATION B2 -- PALIER FAIBLE (~30/100), Section B (conseil, informel).
Extrait : EXAMINATEUR : "J'hésite à changer de métier, je me sens pas épanoui, qu'est-ce que tu en penses ?" / CANDIDAT : "Ah oui c'est difficile ça." / EXAMINATEUR : "Tu ferais quoi à ma place ?" / CANDIDAT : "Je sais pas, peut-être changer, ou pas, je sais pas trop." / EXAMINATEUR : "D'accord..." / CANDIDAT : "Oui c'est compliqué."
Scores attendus : pertinence_et_adequation_au_sujet 35, coherence_et_interaction 25, etendue_et_precision_du_vocabulaire 30, correction_grammaticale 35, aisance_et_fluidite 28.
Justification : aucune position réelle prise malgré une question directe, réponses évasives répétées ("je sais pas trop"), pas d'argumentation ni de nuance -- très en dessous des attentes B2 (développer un point de vue, nuancer, argumenter). Score bas cohérent sur les 5 critères.$b2f$,
 '{"category": "eo_calibration_exemplar", "level": "B2", "tier": "faible"}');
