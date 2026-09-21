-- Pratique CE — vague 3 (15 sujets, 75 questions) : 3e sujet par couple niveau × format (A2, B1, B2 × 5 formats).
-- Thèmes distincts des vagues 1 et 2. Généré avec le skill llamakusi-ce-scenario-content.
-- À exécuter UNE seule fois (garde-fou ci-dessous).

DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.ce_scenarios WHERE title = 'Une sortie scolaire au musée') THEN RAISE EXCEPTION 'Vague 3 CE déjà appliquée'; END IF; END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : A2 | Thématique : École, invitation, emploi, poste, fête de quartier | 5 sujet(s)
--
-- Dissociés de l'Examen Blanc : aucune référence à exam_id/exams ici. Chaque sujet
-- devient une ligne ce_scenarios ; ses questions sont insérées avec le scenario_id
-- venant d'être créé (RETURNING ... INTO, chaîné en variables PL/pgSQL).
--
-- Comme toujours, ce SQL est fourni pour application MANUELLE dans le SQL Editor
-- Supabase — jamais exécuté automatiquement par Claude.

DO $$
DECLARE
  v_scenario_0 uuid;
  v_scenario_1 uuid;
  v_scenario_2 uuid;
  v_scenario_3 uuid;
  v_scenario_4 uuid;
BEGIN
  -- Sujet 1 : Une sortie scolaire au musée (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'A2', 'Une sortie scolaire au musée', 'Chers parents, la classe de CE2 ira au musée de la ville le jeudi 22 octobre. Le car partira de l''école à 8 h 30 et les enfants reviendront à 16 h. Les élèves doivent apporter un pique-nique et une bouteille d''eau. Il n''y aura pas de cantine ce jour-là. La sortie coûte trois euros par enfant : vous pouvez donner l''argent à la maîtresse dans une enveloppe. Merci de signer le papier en bas de cette lettre et de le rendre avant mardi. Si votre enfant est malade, prévenez l''école le matin. Madame Perrin, maîtresse de CE2.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est le but de cette lettre ?', ARRAY['A) Demander aux parents de venir à une réunion','B) Annoncer un changement de maîtresse','C) Prévenir d''une sortie scolaire','D) Inviter les enfants à une fête de l''école'], 'C', 'La maîtresse explique l''organisation d''une sortie au musée.', NULL),
    (v_scenario_0, 2, 'À quelle heure les enfants reviennent-ils à l''école ?', ARRAY['A) À 16 h','B) À 8 h 30','C) À 15 h','D) À 17 h'], 'A', 'Le texte indique que les enfants reviendront à 16 h.', NULL),
    (v_scenario_0, 3, 'Que doivent apporter les élèves ?', ARRAY['A) Un repas chaud pour la cantine','B) Un cahier et un stylo neufs','C) Un maillot de bain et une serviette','D) Un pique-nique et une bouteille d''eau'], 'D', 'Il n''y a pas de cantine : les élèves apportent un pique-nique et de l''eau.', NULL),
    (v_scenario_0, 4, 'Comment peut-on payer la sortie ?', ARRAY['A) Par carte bancaire à la mairie de la ville','B) En donnant l''argent à la maîtresse','C) Par virement sur le site de l''école','D) En payant le chauffeur du car'], 'B', 'L''argent se donne à la maîtresse dans une enveloppe.', NULL),
    (v_scenario_0, 5, 'Que doivent faire les parents avant mardi ?', ARRAY['A) Signer le papier et le rendre à l''école','B) Prévenir l''école si l''enfant est malade','C) Acheter un billet pour le musée','D) Choisir le repas de leur enfant'], 'A', 'Il faut signer le papier en bas de la lettre et le rendre avant mardi.', NULL);

  -- Sujet 2 : Une invitation pour un anniversaire (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'A2', 'Une invitation pour un anniversaire', 'Salut Léa ! Samedi, c''est mon anniversaire et je fais une petite fête chez moi. Je t''invite ___________ (1) 18 heures ! Nous allons manger une pizza, écouter de la musique et jouer ___________ (2) cartes. J''invite aussi Sofia et Amir. Tu ___________ (3) connais déjà : on les a rencontrés au parc. Tu peux venir en bus ___________ (4) à pied : j''habite à dix minutes de l''arrêt, au 12 rue des Fleurs. Si tu ne peux pas venir, dis-le-moi ___________ (5) vendredi, pour que je sache combien de personnes vont venir. J''espère que tu seras là. À samedi ! Karim', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) en','B) à','C) de','D) par'], 'B', 'On dit « inviter à 18 heures » pour donner l''heure de la fête.', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) aux','B) des','C) les','D) de'], 'A', 'On dit « jouer aux cartes » pour un jeu.', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) leur','B) lui','C) y','D) les'], 'D', 'Le pronom « les » remplace Sofia et Amir : « tu les connais ».', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) mais','B) donc','C) ou','D) parce que'], 'C', '« Ou » propose deux possibilités pour venir : en bus ou à pied.', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) avant','B) après','C) pendant','D) depuis'], 'A', 'Karim veut savoir avant la fête combien de personnes viennent : « avant vendredi ».', 5);

  -- Sujet 3 : Quatre offres d'emploi (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'A2', 'Quatre offres d''emploi', NULL, '[{"label": "Aide à domicile", "content": "Nous cherchons une personne pour aider des personnes âgées à faire le ménage et les courses, du lundi au vendredi le matin. Pas besoin de diplôme, mais il faut avoir le permis de conduire. Contrat de 20 heures par semaine."}, {"label": "Vendeur en magasin", "content": "Un magasin de vêtements cherche un vendeur pour le week-end et pendant les vacances scolaires. Il faut aimer le contact avec les clients et parler français. Aucune expérience n''est demandée : le magasin forme le nouveau vendeur."}, {"label": "Agent d''entretien", "content": "Une entreprise de nettoyage recherche une personne pour nettoyer des bureaux tous les soirs, de 18 h à 21 h. Il faut être ponctuel et avoir déjà travaillé dans le nettoyage pendant au moins un an."}, {"label": "Livraison de repas", "content": "Une société de repas à domicile cherche des livreurs de 18 ans ou plus. Vous choisissez vos horaires sur une application. Il faut avoir son propre vélo et un téléphone. Vous êtes payé à chaque livraison."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Je n''ai pas de diplôme, j''ai le permis de conduire et je préfère travailler le matin. Quelle offre peut me convenir ?', ARRAY['A) Vendeur en magasin','B) Aide à domicile','C) Agent d''entretien','D) Livraison de repas'], 'B', 'Cette offre demande le permis, pas de diplôme, et le travail a lieu le matin.', NULL),
    (v_scenario_2, 2, 'Je suis étudiante, je suis libre seulement le week-end, je n''ai pas de vélo et je n''ai jamais travaillé. Quelle offre peut me convenir ?', ARRAY['A) Aide à domicile','B) Agent d''entretien','C) Livraison de repas','D) Vendeur en magasin'], 'D', 'Le magasin cherche un vendeur pour le week-end et forme les débutants.', NULL),
    (v_scenario_2, 3, 'Je peux travailler seulement le soir et j''ai déjà nettoyé des bureaux pendant deux ans. Quelle offre peut me convenir ?', ARRAY['A) Agent d''entretien','B) Aide à domicile','C) Vendeur en magasin','D) Livraison de repas'], 'A', 'Le poste a lieu tous les soirs et demande au moins un an d''expérience.', NULL),
    (v_scenario_2, 4, 'J''ai vingt-cinq ans, un vélo et un téléphone, et je veux choisir mes horaires moi-même. Quelle offre peut me convenir ?', ARRAY['A) Aide à domicile','B) Vendeur en magasin','C) Livraison de repas','D) Agent d''entretien'], 'C', 'Les livreurs majeurs choisissent leurs horaires et doivent avoir leur vélo et un téléphone.', NULL),
    (v_scenario_2, 5, 'Je parle bien français, j''aime parler avec les gens et je suis libre pendant les vacances scolaires. Quelle offre peut me convenir ?', ARRAY['A) Aide à domicile','B) Vendeur en magasin','C) Agent d''entretien','D) Livraison de repas'], 'B', 'Le magasin cherche un vendeur pour les vacances scolaires qui aime le contact avec les clients.', NULL);

  -- Sujet 4 : Un colis à retirer à la poste (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'A2', 'Un colis à retirer à la poste', E'Objet : avis de passage — colis à retirer\n\nMadame, Monsieur,\n\nLe facteur est passé aujourd''hui à votre adresse pour vous remettre un colis, mais vous étiez absent. Votre colis vous attend au bureau de poste de la rue Victor-Hugo. Vous pouvez le retirer pendant dix jours à partir de la date de cet avis, du lundi au vendredi de 9 h à 18 h, et le samedi matin de 9 h à 12 h. Pour retirer votre colis, apportez cet avis et une pièce d''identité. Une autre personne peut aussi le retirer à votre place, avec une lettre signée de votre part et sa propre pièce d''identité. Après dix jours, le colis sera renvoyé à la personne qui vous l''a envoyé.\n\nLe service de livraison', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Pourquoi ce courrier a-t-il été laissé chez vous ?', ARRAY['A) Pour annoncer que le colis a été perdu','B) Pour demander de payer le transport du colis','C) Pour proposer un nouveau jour de livraison','D) Pour prévenir qu''un colis attend à la poste'], 'D', 'Le colis n''a pas pu être remis : il attend au bureau de poste.', NULL),
    (v_scenario_3, 2, 'Où peut-on retirer le colis ?', ARRAY['A) Au bureau de poste de la rue Victor-Hugo','B) À la mairie du quartier, au service courrier','C) Chez un voisin de confiance de votre immeuble','D) Dans un magasin près de chez soi'], 'A', 'L''avis indique le bureau de poste de la rue Victor-Hugo.', NULL),
    (v_scenario_3, 3, 'Quel jour le bureau est-il ouvert seulement le matin ?', ARRAY['A) Le lundi','B) Le vendredi','C) Le samedi','D) Le mercredi'], 'C', 'Le samedi, le bureau ouvre de 9 h à 12 h.', NULL),
    (v_scenario_3, 4, 'Quels documents faut-il apporter ?', ARRAY['A) L''avis de passage et un justificatif de domicile','B) L''avis de passage et une pièce d''identité','C) Une pièce d''identité et un chèque','D) Un certificat de naissance et l''avis'], 'B', 'Il faut apporter cet avis et une pièce d''identité.', NULL),
    (v_scenario_3, 5, 'Que se passe-t-il après dix jours ?', ARRAY['A) Le colis est livré une deuxième fois à votre adresse','B) Le colis est donné à un voisin','C) Le colis retourne à la personne qui l''a envoyé','D) Il faut payer pour le récupérer'], 'C', 'Après dix jours, le colis est renvoyé à l''expéditeur.', NULL);

  -- Sujet 5 : La fête de quartier (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'A2', 'La fête de quartier', 'Samedi dernier, plus de trois cents habitants du quartier Saint-Roch ont participé à la fête de quartier, dans la cour de l''école. La fête a commencé à 14 heures avec des jeux pour les enfants : course en sac, maquillage et pêche aux canards. Puis les adultes ont pu goûter les plats préparés par les voisins : couscous, gâteaux, salades et soupes de plusieurs pays. À 18 heures, un groupe de musique composé de jeunes du quartier a donné un concert gratuit. « J''ai rencontré des personnes qui habitent à côté de chez moi depuis dix ans et que je ne connaissais pas », raconte Mme Diallo, retraitée. Les organisateurs sont contents, mais ils regrettent que la pluie ait obligé à finir la fête plus tôt que prévu. Ils veulent recommencer l''an prochain, au printemps.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Que raconte cet article ?', ARRAY['A) Un concert payant dans une salle de spectacle','B) Une fête organisée par les habitants d''un quartier','C) La fermeture de l''école du quartier','D) Un marché de produits locaux'], 'B', 'L''article raconte la fête de quartier organisée dans la cour de l''école.', NULL),
    (v_scenario_4, 2, 'Que pouvaient faire les enfants à 14 heures ?', ARRAY['A) Écouter un concert de musique','B) Goûter des plats de plusieurs pays','C) Visiter l''école avec leurs parents','D) Participer à des jeux dans la cour'], 'D', 'La fête a commencé avec des jeux pour les enfants.', NULL),
    (v_scenario_4, 3, 'Qui a préparé les plats ?', ARRAY['A) Les voisins du quartier','B) Un restaurant de la ville','C) Les enfants de l''école','D) La mairie et ses employés'], 'A', 'Les adultes ont goûté les plats préparés par les voisins.', NULL),
    (v_scenario_4, 4, 'Pourquoi Mme Diallo est-elle contente ?', ARRAY['A) Elle a gagné un prix de cuisine','B) Elle a retrouvé une amie d''enfance','C) Elle a fait connaissance avec des voisins','D) Elle a chanté avec le groupe de musique'], 'C', 'Elle a rencontré des personnes qui habitent près de chez elle sans les connaître.', NULL),
    (v_scenario_4, 5, 'Quel problème a eu lieu pendant la fête ?', ARRAY['A) Le groupe de musique est arrivé en retard','B) La pluie a obligé à terminer plus tôt','C) Il n''y avait pas assez de nourriture','D) La cour de l''école était fermée'], 'B', 'Les organisateurs regrettent que la pluie ait obligé à finir plus tôt.', NULL);

END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : B1 | Thématique : Transport, santé, culture, emploi | 5 sujet(s)
--
-- Dissociés de l'Examen Blanc : aucune référence à exam_id/exams ici. Chaque sujet
-- devient une ligne ce_scenarios ; ses questions sont insérées avec le scenario_id
-- venant d'être créé (RETURNING ... INTO, chaîné en variables PL/pgSQL).
--
-- Comme toujours, ce SQL est fourni pour application MANUELLE dans le SQL Editor
-- Supabase — jamais exécuté automatiquement par Claude.

DO $$
DECLARE
  v_scenario_0 uuid;
  v_scenario_1 uuid;
  v_scenario_2 uuid;
  v_scenario_3 uuid;
  v_scenario_4 uuid;
BEGIN
  -- Sujet 1 : Perturbations sur la ligne de train (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'B1', 'Perturbations sur la ligne de train', 'Information voyageurs — Ligne 4, Valmont – Rivière-sur-Mer. En raison de travaux sur les voies, la circulation des trains est perturbée du lundi 19 au vendredi 23 octobre. Entre Valmont et Rivière-sur-Mer, les trains sont remplacés par des autocars, qui partent devant la gare, côté parking. Le trajet dure environ vingt minutes de plus qu''en train. Les autocars sont moins nombreux : comptez un départ toutes les quarante minutes, au lieu d''un train toutes les vingt minutes. Nous vous conseillons donc de prévoir une marge supplémentaire pour vos déplacements, notamment si vous avez une correspondance. Vos billets et abonnements restent valables dans les autocars, sans démarche particulière. Si votre trajet est retardé de plus d''une heure, vous pouvez demander un remboursement partiel sur notre site ou au guichet, sur présentation de votre billet. Les personnes en fauteuil roulant peuvent réserver un véhicule adapté en appelant le service voyageurs la veille avant midi.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est le but de ce message ?', ARRAY['A) Annoncer la suppression définitive de la ligne 4','B) Prévenir d''une perturbation temporaire sur une ligne','C) Présenter un nouveau tarif d''abonnement mensuel','D) Recruter des conducteurs d''autocar pour la région'], 'B', 'Le message annonce des travaux et des autocars de remplacement pendant une semaine.', NULL),
    (v_scenario_0, 2, 'Comment voyage-t-on entre les deux gares pendant les travaux ?', ARRAY['A) En train, mais avec un seul wagon disponible','B) En taxi, remboursé ensuite par la compagnie','C) À pied jusqu''à la gare suivante de la ligne','D) En autocar, avec un départ plus rare'], 'D', 'Les trains sont remplacés par des autocars, moins fréquents.', NULL),
    (v_scenario_0, 3, 'Que conseille la compagnie aux voyageurs ?', ARRAY['A) Prévoir plus de temps pour leur trajet','B) Acheter un nouveau billet pour les autocars','C) Éviter de voyager pendant toute la semaine','D) Arriver à la gare une heure avant le départ'], 'A', 'Elle conseille de prévoir une marge supplémentaire, notamment en cas de correspondance.', NULL),
    (v_scenario_0, 4, 'Dans quel cas peut-on demander un remboursement ?', ARRAY['A) Si le voyageur préfère le train à l''autocar','B) Si le billet a été acheté sur le site internet','C) Si le trajet est retardé de plus d''une heure','D) Si le trajet dure vingt minutes de plus que d''habitude'], 'C', 'Un remboursement partiel est possible en cas de retard de plus d''une heure.', NULL),
    (v_scenario_0, 5, 'Que doit faire une personne en fauteuil roulant ?', ARRAY['A) Se présenter au guichet une heure avant le départ','B) Réserver un véhicule adapté la veille avant midi','C) Attendre un autocar spécial le lundi matin','D) Demander un remboursement dès le premier jour'], 'B', 'Elle doit appeler le service voyageurs la veille avant midi pour réserver un véhicule adapté.', NULL);

  -- Sujet 2 : Bouger au quotidien (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'B1', 'Bouger au quotidien', 'Les médecins le répètent : pour rester en bonne santé, il faut bouger tous les jours. Pourtant, beaucoup de personnes pensent ___________ (1) elles n''ont pas le temps de faire du sport. Or, l''activité physique ne se limite pas à la salle de gym. Monter les escaliers ___________ (2) de prendre l''ascenseur, descendre du bus un arrêt plus tôt ou marcher pendant une pause au travail suffit déjà à améliorer sa forme. Une étude récente montre que trente minutes de marche par jour ___________ (3) le risque de nombreuses maladies. Certaines villes proposent d''ailleurs des parcours balisés dans les parcs, ___________ (4) les habitants peuvent marcher en toute sécurité. Il ne faut toutefois pas se fixer des objectifs trop difficiles : ceux qui commencent trop fort abandonnent souvent au bout de quelques semaines. Le plus important est de choisir une activité qui ___________ (5) plaisir, car on la pratique alors plus régulièrement.', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) que','B) qui','C) dont','D) où'], 'A', '« Penser que » introduit ce que pensent les personnes : elles n''ont pas le temps.', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) à cause','B) à force','C) au lieu','D) à côté'], 'C', '« Au lieu de prendre l''ascenseur » exprime une alternative : on monte à pied à la place.', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) augmente','B) réduit','C) ignore','D) oublie'], 'B', 'Marcher est bon pour la santé : la marche réduit le risque de maladies.', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) que','B) dont','C) qui','D) où'], 'D', '« Où » remplace le lieu : les parcours dans lesquels les habitants peuvent marcher.', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) fait','B) met','C) prend','D) a'], 'A', 'On dit « faire plaisir » : une activité qui fait plaisir se pratique plus régulièrement.', 5);

  -- Sujet 3 : Quatre sorties culturelles ce week-end (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'B1', 'Quatre sorties culturelles ce week-end', NULL, '[{"label": "Concert en plein air", "content": "Ce samedi à 20 h, un orchestre de jeunes musiciens joue gratuitement dans le parc municipal. Le concert dure environ deux heures. Apportez une couverture ou un siège pliant : il n''y a pas de chaises. En cas de pluie, le concert est annulé et remplacé par une date en juin."}, {"label": "Visite guidée du vieux quartier", "content": "Un guide raconte l''histoire du vieux quartier pendant une promenade d''une heure et demie, le dimanche à 10 h. La visite coûte six euros par adulte, gratuit pour les moins de douze ans. Le parcours, en partie sur des pavés, n''est pas adapté aux fauteuils roulants. Réservation conseillée."}, {"label": "Cinéma pour enfants", "content": "Le cinéma Le Rex propose dimanche à 15 h un film d''animation pour les enfants de 4 à 8 ans, suivi d''un goûter offert. Le billet coûte quatre euros. Les parents accompagnent leurs enfants sans payer. La salle est accessible aux personnes à mobilité réduite."}, {"label": "Exposition de photographies", "content": "Le musée de la ville présente jusqu''à la fin du mois une exposition de photographies sur les métiers d''autrefois. Ouvert tous les jours de 10 h à 18 h, sauf le lundi. L''entrée est gratuite le premier dimanche du mois, et à quatre euros les autres jours. Des audioguides sont disponibles en français et en anglais."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Je voudrais sortir samedi soir avec des amis, mais nous n''avons pas beaucoup d''argent. Quelle sortie peut nous convenir ?', ARRAY['A) Visite guidée du vieux quartier','B) Cinéma pour enfants','C) Concert en plein air','D) Exposition de photographies'], 'C', 'Le concert a lieu samedi à 20 h et il est gratuit.', NULL),
    (v_scenario_2, 2, 'Mon fils de six ans adore les dessins animés et nous cherchons une activité pas chère pour dimanche après-midi. Quelle sortie peut nous convenir ?', ARRAY['A) Cinéma pour enfants','B) Concert en plein air','C) Visite guidée du vieux quartier','D) Exposition de photographies'], 'A', 'La séance est dimanche à 15 h, pour les 4 à 8 ans, avec un goûter offert.', NULL),
    (v_scenario_2, 3, 'Je m''intéresse à l''histoire de la ville et je préfère une activité le dimanche matin, avec quelqu''un qui explique. Quelle sortie peut me convenir ?', ARRAY['A) Concert en plein air','B) Cinéma pour enfants','C) Exposition de photographies','D) Visite guidée du vieux quartier'], 'D', 'Un guide raconte l''histoire du vieux quartier dimanche à 10 h.', NULL),
    (v_scenario_2, 4, 'Je m''intéresse aux métiers d''autrefois, je suis libre mardi et je parle un peu anglais. Quelle sortie peut me convenir ?', ARRAY['A) Concert en plein air','B) Exposition de photographies','C) Visite guidée du vieux quartier','D) Cinéma pour enfants'], 'B', 'L''exposition est ouverte le mardi et propose des audioguides en anglais.', NULL),
    (v_scenario_2, 5, 'Je voudrais une promenade commentée avec mes enfants de dix ans, sans payer pour eux. Quelle sortie peut nous convenir ?', ARRAY['A) Visite guidée du vieux quartier','B) Concert en plein air','C) Cinéma pour enfants','D) Exposition de photographies'], 'A', 'La visite est gratuite pour les moins de douze ans.', NULL);

  -- Sujet 4 : Confirmation d'embauche (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'B1', 'Confirmation d''embauche', E'Objet : confirmation de votre embauche — contrat à durée déterminée\n\nMadame, Monsieur,\n\nNous avons le plaisir de vous confirmer votre embauche en qualité d''agent d''accueil au sein de notre entreprise, pour un contrat à durée déterminée de six mois à compter du lundi 2 novembre. Votre temps de travail sera de trente-cinq heures par semaine, du lundi au vendredi, avec des horaires de 9 h à 17 h 30, dont une pause d''une heure pour le déjeuner. Les deux premières semaines constituent une période d''essai, pendant laquelle chacune des deux parties peut mettre fin au contrat sans préavis. Le jour de votre arrivée, vous serez accueilli à 9 h par votre responsable, Mme Laurent, à l''accueil du bâtiment B. Merci de lui remettre ce jour-là les documents suivants : une pièce d''identité en cours de validité, un relevé d''identité bancaire et une attestation de sécurité sociale. Une visite médicale sera organisée pendant le premier mois ; nous vous communiquerons la date par e-mail. Si vous ne pouvez pas commencer à la date prévue, merci de nous prévenir au plus vite.\n\nLe service des ressources humaines', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Quel est l''objet de ce courrier ?', ARRAY['A) Convoquer le candidat à un entretien d''embauche pour le poste','B) Refuser une candidature pour un poste d''accueil','C) Confirmer une embauche et préciser les conditions du contrat','D) Proposer un poste dans un autre établissement de l''entreprise'], 'C', 'Le courrier confirme l''embauche et détaille horaires, période d''essai et documents.', NULL),
    (v_scenario_3, 2, 'Combien de temps dure le contrat ?', ARRAY['A) Six mois à partir du 2 novembre','B) Deux semaines, comme la période d''essai prévue','C) Un an, avec un renouvellement automatique possible','D) Un mois, avec une visite médicale obligatoire à la fin'], 'A', 'Le contrat est de six mois à compter du lundi 2 novembre.', NULL),
    (v_scenario_3, 3, 'Que se passe-t-il pendant la période d''essai ?', ARRAY['A) Le salarié travaille seulement le matin pendant deux semaines','B) Le salaire est réduit de moitié pendant cette période','C) Le contrat devient à durée indéterminée à la fin','D) Chacun peut arrêter le contrat sans prévenir à l''avance'], 'D', 'Pendant les deux premières semaines, chacun peut mettre fin au contrat sans préavis.', NULL),
    (v_scenario_3, 4, 'Que doit remettre le salarié à sa responsable ?', ARRAY['A) Un CV, un diplôme et une lettre de motivation détaillée','B) Une pièce d''identité, un RIB et une attestation de sécurité sociale','C) Un certificat médical récent et une photo d''identité','D) Un contrat signé et un justificatif de domicile récent'], 'B', 'Ces trois documents sont demandés le jour de l''arrivée.', NULL),
    (v_scenario_3, 5, 'Quand la visite médicale aura-t-elle lieu ?', ARRAY['A) Avant le premier jour de travail, chez le médecin de famille','B) Pendant le premier mois, à une date donnée par e-mail','C) À la fin de la période d''essai, dans les locaux de l''entreprise','D) Le jour de l''arrivée, à 9 h, avec la responsable'], 'B', 'La visite est organisée dans le premier mois et la date sera envoyée par e-mail.', NULL);

  -- Sujet 5 : Le sommeil des adolescents (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'B1', 'Le sommeil des adolescents', 'Se coucher tard, se lever difficilement, somnoler en classe : beaucoup d''adolescents dorment trop peu. Selon une enquête menée dans plusieurs lycées, près de la moitié des élèves de seconde dorment moins de sept heures par nuit, alors que les spécialistes recommandent entre huit et dix heures à cet âge. Les écrans sont souvent montrés du doigt : le téléphone reste allumé sous l''oreiller, et les notifications interrompent le sommeil. Mais les médecins rappellent que la cause n''est pas seulement là. Pendant l''adolescence, l''horloge interne se décale naturellement : les jeunes ont sommeil plus tard le soir, alors que les cours commencent tôt le matin. Certains établissements ont donc testé un début des cours à 9 h. Après un an, les enseignants ont observé moins de retards et davantage d''attention en classe, même si les résultats scolaires n''ont pas beaucoup changé. Les parents, eux, sont partagés : ce décalage complique l''organisation des familles. Les chercheurs conseillent en attendant des gestes simples : éteindre les écrans une heure avant le coucher, garder des horaires réguliers, éviter la caféine l''après-midi.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Quel constat l''article fait-il ?', ARRAY['A) Les adolescents dorment plus que la plupart des adultes','B) Beaucoup d''adolescents ne dorment pas assez','C) Les lycéens dorment mal à cause de leurs devoirs du soir','D) Les enseignants dorment moins que leurs propres élèves'], 'B', 'Près de la moitié des élèves de seconde dorment moins de sept heures par nuit.', NULL),
    (v_scenario_4, 2, 'Quelle autre cause que les écrans est évoquée ?', ARRAY['A) Un manque d''activité physique dans la journée','B) Le bruit des voisins pendant une grande partie de la nuit','C) Une alimentation trop riche prise le soir','D) Un décalage naturel de l''horloge interne des jeunes'], 'D', 'À l''adolescence, l''horloge interne se décale : le sommeil vient plus tard.', NULL),
    (v_scenario_4, 3, 'Quel effet a été observé avec des cours à 9 h ?', ARRAY['A) Moins de retards et plus d''attention en classe','B) De bien meilleurs résultats scolaires pour les élèves','C) Une forte baisse du nombre d''élèves absents en classe','D) Des journées de travail plus courtes pour les professeurs'], 'A', 'Les enseignants ont noté moins de retards et davantage d''attention.', NULL),
    (v_scenario_4, 4, 'Pourquoi les parents sont-ils partagés ?', ARRAY['A) Ils craignent que leurs enfants dorment trop longtemps','B) Ils voudraient que les cours finissent beaucoup plus tôt','C) Le décalage des horaires complique la vie des familles','D) Ils ne croient pas aux conseils donnés par les médecins'], 'C', 'Ce décalage complique l''organisation des familles.', NULL),
    (v_scenario_4, 5, 'Quel conseil les chercheurs donnent-ils ?', ARRAY['A) Faire une longue sieste chaque après-midi à la maison','B) Éteindre les écrans environ une heure avant de dormir','C) Boire du café pour rester attentif pendant les cours','D) Se coucher plus tard le week-end pour récupérer'], 'B', 'Les chercheurs conseillent d''éteindre les écrans une heure avant le coucher.', NULL);

END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : B2 | Thématique : Santé, travail, consommation, assurance, société | 5 sujet(s)
--
-- Dissociés de l'Examen Blanc : aucune référence à exam_id/exams ici. Chaque sujet
-- devient une ligne ce_scenarios ; ses questions sont insérées avec le scenario_id
-- venant d'être créé (RETURNING ... INTO, chaîné en variables PL/pgSQL).
--
-- Comme toujours, ce SQL est fourni pour application MANUELLE dans le SQL Editor
-- Supabase — jamais exécuté automatiquement par Claude.

DO $$
DECLARE
  v_scenario_0 uuid;
  v_scenario_1 uuid;
  v_scenario_2 uuid;
  v_scenario_3 uuid;
  v_scenario_4 uuid;
BEGIN
  -- Sujet 1 : Nouvelle organisation des urgences (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'B2', 'Nouvelle organisation des urgences', 'À compter du 1er décembre, l''hôpital de Valmont modifie l''accueil des patients aux urgences. Jusqu''ici, les personnes étaient examinées dans l''ordre d''arrivée, ce qui entraînait des attentes parfois très longues pour des cas peu graves, pendant que des situations plus sérieuses devaient patienter à leur tour. Désormais, une infirmière d''accueil évaluera la gravité de chaque situation dès l''arrivée et orientera le patient vers l''un des trois circuits : soins immédiats, consultation dans l''heure ou consultation non urgente. Ce dernier circuit sera assuré par un médecin généraliste installé à côté des urgences, ce qui devrait libérer les équipes pour les cas les plus graves. L''établissement précise que cette organisation ne change rien à la prise en charge des enfants et des femmes enceintes, toujours reçus en priorité. En revanche, les patients qui se présentent sans urgence vitale pourront attendre plus longtemps qu''auparavant, et l''hôpital leur recommande de contacter d''abord leur médecin ou un service de garde. Pour éviter les déplacements inutiles, un numéro d''appel sera mis en place : un professionnel de santé répondra 24 heures sur 24 et pourra, si nécessaire, envoyer une ambulance. Un bilan de ce dispositif sera présenté au printemps.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est le changement principal annoncé ?', ARRAY['A) L''orientation des patients selon la gravité','B) La fermeture des urgences aux adultes pendant la nuit','C) Un paiement selon la durée d''attente des patients','D) Un accueil des enfants après tous les adultes présents'], 'A', 'Une infirmière évaluera la gravité de chaque situation et orientera le patient.', NULL),
    (v_scenario_0, 2, 'Quel était le défaut de l''ancienne organisation ?', ARRAY['A) Le personnel refusait certains patients à l''entrée','B) Peu de médecins généralistes étaient présents sur place','C) L''ordre d''arrivée retardait des cas sérieux','D) Le coût des soins était trop élevé pour les familles'], 'C', 'Des cas plus sérieux devaient attendre leur tour derrière des cas peu graves.', NULL),
    (v_scenario_0, 3, 'Quel est le rôle du généraliste installé à côté des urgences ?', ARRAY['A) Remplacer l''infirmière d''accueil pendant les heures de nuit','B) Assurer les soins immédiats des situations les plus graves','C) Répondre au numéro d''appel ouvert jour et nuit','D) Recevoir les consultations non urgentes'], 'D', 'Ce circuit non urgent doit libérer les équipes pour les cas graves.', NULL),
    (v_scenario_0, 4, 'Qu''est-ce qui reste inchangé ?', ARRAY['A) La durée d''attente pour l''ensemble des patients','B) La priorité des enfants et des femmes enceintes','C) L''ordre d''arrivée pour les cas les moins graves','D) Le lieu de consultation des patients sans urgence'], 'B', 'La prise en charge des enfants et des femmes enceintes reste prioritaire.', NULL),
    (v_scenario_0, 5, 'Que recommande l''hôpital aux personnes sans urgence vitale ?', ARRAY['A) Se présenter aux urgences en fin de journée','B) Joindre d''abord leur médecin traitant','C) Attendre le bilan prévu au printemps prochain','D) Se rendre à l''hôpital pour prendre rendez-vous'], 'B', 'L''hôpital leur recommande de contacter d''abord leur médecin ou un service de garde.', NULL);

  -- Sujet 2 : Le télétravail : un bilan nuancé (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'B2', 'Le télétravail : un bilan nuancé', 'Depuis la généralisation du télétravail, de nombreuses entreprises dressent un premier bilan. Les salariés apprécient d''abord les heures ___________ (1) sur les trajets, qu''ils consacrent souvent à leur famille ou à leurs loisirs. Ils soulignent aussi une meilleure concentration lorsque le travail demande de la réflexion. Certains y voient aussi un moyen de mieux organiser leur journée et de réduire la fatigue liée aux transports en commun. ___________ (2) le télétravail soit apprécié, il fragilise parfois le lien entre collègues : les échanges informels de la pause-café disparaissent, et les nouveaux arrivants ont du mal à s''intégrer ; l''entreprise perd alors une partie de sa mémoire collective. Pour y remédier, les entreprises multiplient les journées en présentiel, afin que les équipes ___________ (3) maintenir une véritable cohésion. Beaucoup d''entre elles expérimentent ainsi un rythme mixte, ___________ (4) deux jours à distance et trois jours au bureau. Les syndicats, de leur côté, insistent sur l''équité : tous les postes ne peuvent pas être exercés à distance, et les salariés concernés ne doivent pas se sentir moins bien traités que les autres. Reste à savoir si ce modèle durera. ___________ (5), une chose semble acquise : la plupart des salariés ne souhaitent plus revenir à l''ancienne organisation, et les candidats comparent désormais les offres d''emploi en fonction de la place qu''elles laissent au travail à distance.', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) gagnés','B) gagnées','C) gagnée','D) gagné'], 'B', '« Heures » est féminin pluriel : le participe employé comme adjectif s''accorde, « gagnées ».', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) Même si','B) Parce que','C) Bien que','D) Puisque'], 'C', 'Le verbe « soit » est au subjonctif : seule la conjonction « bien que » est suivie du subjonctif ici et exprime la concession.', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) peuvent','B) pourront','C) pouvaient','D) puissent'], 'D', 'Après « afin que », on emploie le subjonctif : « puissent ».', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) alterner','B) alternant','C) alterné','D) alternent'], 'B', 'Le participe présent « alternant » précise la façon dont le rythme mixte est organisé.', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) Quoi qu''il en soit','B) C''est pourquoi','C) Par exemple','D) Autrement dit'], 'A', 'L''expression signifie « dans tous les cas » : elle relie l''incertitude sur l''avenir à ce qui semble acquis.', 5);

  -- Sujet 3 : Quatre offres d'abonnement internet et mobile (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'B2', 'Quatre offres d''abonnement internet et mobile', NULL, '[{"label": "Forfait mobile sans engagement", "content": "Ce forfait comprend 20 Go de données et des appels illimités en France, pour 9,99 € par mois. Il peut être résilié à tout moment, sans frais, dès le mois suivant la demande. Attention toutefois : après douze mois, le tarif passe à 14,99 € par mois, sauf si le client change lui-même d''offre. Aucun téléphone n''est proposé avec ce forfait, qui s''adresse aux personnes qui possèdent déjà un appareil."}, {"label": "Forfait mobile Confort", "content": "Avec 100 Go de données et des appels illimités en France et depuis l''étranger, ce forfait coûte 19,99 € par mois. Il est proposé avec un smartphone à prix réduit, à condition de s''engager pour vingt-quatre mois. En cas de résiliation avant la fin de cette période, le client doit payer les mensualités restantes du téléphone, ainsi que des frais de dossier."}, {"label": "Forfait Famille", "content": "Quatre lignes mobiles de 30 Go chacune sont incluses pour 34,99 € par mois, sur un seul contrat et avec une facture unique. L''abonnement est sans engagement, mais il est au nom d''un seul titulaire, responsable des paiements pour tous. Une carte SIM supplémentaire peut être ajoutée pour trois euros par mois, dans la limite de six lignes."}, {"label": "Box Fibre Plus", "content": "Cette offre associe un accès à Internet très haut débit et plus de cent chaînes de télévision pour 29,99 € par mois. Elle n''est disponible que dans les quartiers déjà raccordés à la fibre. L''engagement est de douze mois, mais les frais d''installation sont offerts. L''offre ne comprend aucun forfait mobile, qui reste à souscrire séparément."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Je ne veux pas être lié par un contrat, je possède déjà un téléphone et quelques Go de données me suffisent pour mes messages et mes cartes. Quelle offre peut me convenir ?', ARRAY['A) Forfait mobile Confort','B) Forfait Famille','C) Forfait mobile sans engagement','D) Box Fibre Plus'], 'C', 'Ce forfait de 20 Go est résiliable à tout moment et s''adresse à ceux qui ont déjà un appareil.', NULL),
    (v_scenario_2, 2, 'J''ai besoin de beaucoup de données pour travailler en déplacement, j''appelle souvent depuis l''étranger et je veux changer de smartphone à prix réduit. Quelle offre peut me convenir ?', ARRAY['A) Forfait mobile Confort','B) Forfait mobile sans engagement','C) Forfait Famille','D) Box Fibre Plus'], 'A', 'Il offre 100 Go, les appels depuis l''étranger et un smartphone à prix réduit.', NULL),
    (v_scenario_2, 3, 'Nous sommes quatre à la maison et nous voulons une seule facture pour tous les membres du foyer, sans nous lier sur la durée. Quelle offre peut nous convenir ?', ARRAY['A) Forfait mobile sans engagement','B) Forfait mobile Confort','C) Box Fibre Plus','D) Forfait Famille'], 'D', 'Quatre lignes, un seul contrat, une facture unique et aucun engagement.', NULL),
    (v_scenario_2, 4, 'Je veux surtout un accès à Internet très rapide à la maison, avec la télévision, et j''habite dans un quartier récemment raccordé. Quelle offre peut me convenir ?', ARRAY['A) Forfait mobile sans engagement','B) Box Fibre Plus','C) Forfait mobile Confort','D) Forfait Famille'], 'B', 'Cette offre comprend Internet très haut débit et la télévision, dans les zones raccordées à la fibre.', NULL),
    (v_scenario_2, 5, 'J''accepte de m''engager deux ans pour obtenir un téléphone moins cher, en sachant que je paierai des frais si je résilie plus tôt. Quelle offre peut me convenir ?', ARRAY['A) Forfait mobile Confort','B) Forfait mobile sans engagement','C) Forfait Famille','D) Box Fibre Plus'], 'A', 'L''engagement de vingt-quatre mois donne droit au smartphone, avec des frais en cas de résiliation anticipée.', NULL);

  -- Sujet 4 : Réponse d'un assureur après un dégât des eaux (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'B2', 'Réponse d''un assureur après un dégât des eaux', E'Objet : votre déclaration de sinistre du 14 septembre — dégât des eaux\n\nMadame, Monsieur,\n\nNous avons bien enregistré votre déclaration de sinistre concernant un dégât des eaux survenu dans votre salle de bain. Après examen de votre dossier, nous vous informons que ce sinistre est couvert par votre contrat d''assurance habitation, sous réserve des conditions ci-dessous.\n\nUn expert missionné par nos soins se rendra à votre domicile afin d''évaluer les dommages. Il vous contactera dans un délai de dix jours pour convenir d''un rendez-vous ; vous devrez alors être présent ou vous faire représenter par une personne de confiance. Avant sa visite, nous vous demandons de ne procéder à aucune réparation définitive, mais de conserver les objets endommagés, de les photographier et de prendre en charge les mesures d''urgence nécessaires, comme la fermeture de l''arrivée d''eau. Les factures correspondantes vous seront remboursées sur présentation des justificatifs.\n\nConformément à votre contrat, une franchise de 150 euros restera à votre charge et sera déduite de l''indemnité. Celle-ci vous sera versée dans les quinze jours suivant la remise du rapport de l''expert, si vous l''acceptez. Si vous contestez le montant proposé, vous disposez d''un délai de trente jours pour nous adresser vos observations par courrier ; une contre-expertise pourra alors être envisagée, à vos frais dans un premier temps.\n\nLe service des sinistres', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Quel est l''objet principal de ce courrier ?', ARRAY['A) Refuser la prise en charge d''un dégât des eaux dans le logement','B) Demander à l''assuré de faire réparer lui-même tous les dégâts','C) Annoncer une augmentation du prix du contrat d''assurance habitation','D) Confirmer la prise en charge du sinistre et expliquer la suite'], 'D', 'L''assureur confirme que le sinistre est couvert puis explique les étapes suivantes.', NULL),
    (v_scenario_3, 2, 'Que doit faire l''assuré avant la visite de l''expert ?', ARRAY['A) Faire réparer immédiatement la salle de bain par un artisan','B) Ne pas réparer et garder les preuves des dommages','C) Jeter les objets abîmés pour empêcher l''humidité de s''étendre','D) Envoyer à l''assureur un devis détaillé de réparation'], 'B', 'Il ne doit pas faire de réparation définitive, mais conserver et photographier les objets endommagés.', NULL),
    (v_scenario_3, 3, 'Que deviennent les dépenses d''urgence engagées par l''assuré ?', ARRAY['A) Elles sont remboursées sur présentation de justificatifs','B) Elles restent à sa charge pour cette fois','C) Elles sont ajoutées au montant de la franchise de 150 euros','D) Elles sont couvertes seulement après une contre-expertise'], 'A', 'Les factures des mesures d''urgence sont remboursées sur justificatifs.', NULL),
    (v_scenario_3, 4, 'Comment l''indemnité sera-t-elle calculée ?', ARRAY['A) Le prix des réparations, augmenté de frais de dossier','B) Un montant fixe prévu au contrat, quel que soit le dommage','C) Les dommages évalués, moins la franchise de 150 euros','D) La moyenne des devis fournis par l''assuré lui-même'], 'C', 'La franchise reste à la charge de l''assuré et est déduite de l''indemnité.', NULL),
    (v_scenario_3, 5, 'Que peut faire l''assuré en désaccord avec le montant proposé ?', ARRAY['A) Refuser le rapport et attendre un nouvel appel de l''expert','B) Écrire sous trente jours pour contester le montant','C) Faire réaliser les travaux et demander un remboursement total','D) Saisir directement la justice sans passer par l''assureur'], 'B', 'Il peut adresser ses observations par courrier sous trente jours ; une contre-expertise est alors envisageable.', NULL);

  -- Sujet 5 : Vieillir chez soi (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'B2', 'Vieillir chez soi', E'Avec l''âge, beaucoup de personnes souhaitent continuer à vivre chez elles, y compris lorsque leur autonomie diminue. Cette préférence pousse les pouvoirs publics à développer le maintien à domicile : aides pour aménager le logement, interventions d''auxiliaires de vie, portage de repas. Les avantages sont nombreux. Rester dans un environnement familier préserve les repères des personnes âgées et retarde souvent l''entrée en établissement spécialisé, dont le coût mensuel est nettement supérieur à celui de quelques heures d''aide à domicile.\n\nCette solution n''est cependant pas sans limites. D''abord, elle repose largement sur les proches, souvent des enfants qui travaillent encore et s''épuisent à concilier leur vie professionnelle et l''accompagnement d''un parent. Ensuite, les services d''aide à domicile manquent de personnel : les salaires sont bas, les horaires fragmentés, et de nombreux postes restent vacants. Enfin, l''isolement guette ceux dont la famille vit loin : une auxiliaire de vie passe parfois vingt minutes, ce qui suffit pour la toilette ou le repas, mais pas pour une conversation.\n\nDes initiatives tentent de répondre à ces difficultés. Certaines communes financent des visites régulières de bénévoles, d''autres favorisent l''habitat partagé, où plusieurs seniors vivent sous le même toit avec des services communs. Les spécialistes s''accordent toutefois sur un point : sans revalorisation des métiers de l''aide à domicile, le maintien à domicile risque de rester un choix théorique pour beaucoup de familles.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Quel constat l''article établit-il ?', ARRAY['A) Les familles préfèrent les établissements spécialisés','B) Le maintien à domicile est devenu obligatoire pour tous','C) Beaucoup de seniors préfèrent rester chez eux','D) Les aides publiques ont été supprimées récemment'], 'C', 'Beaucoup de personnes souhaitent continuer à vivre chez elles, ce qui pousse à développer les aides.', NULL),
    (v_scenario_4, 2, 'Quel avantage du maintien à domicile est cité ?', ARRAY['A) Il conserve les repères et coûte souvent moins cher','B) Il évite toute fatigue aux proches des personnes âgées','C) Il garantit la présence permanente d''un soignant','D) Il permet d''accueillir plus de personnes en établissement'], 'A', 'Rester chez soi préserve les repères et retarde l''entrée en établissement, plus coûteux.', NULL),
    (v_scenario_4, 3, 'Quelle difficulté concerne les proches ?', ARRAY['A) Ils n''ont pas le droit d''aider leurs parents âgés','B) Ils sont trop nombreux pour bien s''organiser entre eux','C) Ils habitent le plus souvent dans la même ville','D) Ils peinent à concilier travail et aide à un parent'], 'D', 'Les proches s''épuisent à concilier vie professionnelle et accompagnement.', NULL),
    (v_scenario_4, 4, 'Pourquoi une visite de vingt minutes est-elle jugée insuffisante ?', ARRAY['A) Elle empêche de préparer correctement les repas','B) Elle suffit aux soins mais pas à un échange','C) Elle coûte plus cher qu''une visite plus longue','D) Elle n''est pas autorisée par les communes'], 'B', 'Ce temps suffit pour la toilette ou le repas, mais pas pour une conversation.', NULL),
    (v_scenario_4, 5, 'Que soulignent les spécialistes en conclusion ?', ARRAY['A) L''habitat partagé doit remplacer toutes les aides existantes de l''État','B) L''avenir du dispositif dépend de la valorisation des métiers','C) Les bénévoles suffisent pour répondre à l''ensemble des besoins','D) Les familles doivent financer seules le dispositif d''aide'], 'B', 'Sans revalorisation des métiers de l''aide à domicile, le dispositif restera théorique pour beaucoup.', NULL);

END $$;
