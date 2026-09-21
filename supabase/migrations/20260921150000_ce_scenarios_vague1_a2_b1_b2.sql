-- Pratique CE — vague 1 (12 sujets, 60 questions) : 1 sujet par couple niveau × format.
-- A2 : court, trous, multi_texte, long_admin, article_presse | B1 : court, long_admin | B2 : les 5 formats.
-- (B1 trous/multi_texte/article_presse existent déjà.) Généré avec le skill llamakusi-ce-scenario-content.
-- À exécuter UNE seule fois (garde-fou ci-dessous).

DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.ce_scenarios WHERE title = 'Changement d''horaires sur la ligne 12') THEN RAISE EXCEPTION 'Vague 1 CE déjà appliquée'; END IF; END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : A2 | Thématique : Vie quotidienne : transport, logement, santé, école, culture locale | 5 sujet(s)
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
  -- Sujet 1 : Changement d'horaires sur la ligne 12 (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'A2', 'Changement d''horaires sur la ligne 12', 'Information voyageurs — Ligne de bus 12. À partir du lundi 5 octobre, le bus 12 passera plus souvent le matin : un bus toutes les dix minutes entre 7 h et 9 h. En revanche, le dernier bus partira à 21 h 30 au lieu de 22 h 30. Le dimanche, il n''y a pas de changement. L''arrêt « Mairie » est déplacé de cinquante mètres, devant la pharmacie, à cause de travaux sur la place. Vous pouvez acheter votre ticket dans le bus ou sur l''application de la ville.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est le but principal de ce message ?', ARRAY['A) Vendre un nouvel abonnement mensuel de bus','B) Prévenir les voyageurs d''une grève des chauffeurs','C) Informer des changements sur la ligne 12','D) Annoncer la création d''une nouvelle ligne'], 'C', 'C''est une information voyageurs : elle présente ce qui change à partir du 5 octobre pour le bus 12.', NULL),
    (v_scenario_0, 2, 'Que change le matin, à partir du 5 octobre ?', ARRAY['A) Il y aura plus de bus entre 7 h et 9 h','B) Le premier bus partira une heure plus tard','C) Le ticket sera moins cher le matin','D) Il n''y aura plus de bus avant 9 h'], 'A', 'Le texte annonce un bus toutes les dix minutes entre 7 h et 9 h, donc plus de passages le matin.', NULL),
    (v_scenario_0, 3, 'À quelle heure partira le dernier bus après le changement ?', ARRAY['A) 22 h 30','B) 21 h 00','C) 22 h 00','D) 21 h 30'], 'D', 'Le dernier bus partira à 21 h 30. L''heure 22 h 30 est l''ancien horaire.', NULL),
    (v_scenario_0, 4, 'Où sera l''arrêt « Mairie » après le changement ?', ARRAY['A) Au milieu de la place, devant l''école','B) Devant la pharmacie, un peu plus loin','C) Près de la gare, à côté du parking','D) À l''entrée de la rue principale'], 'B', 'L''arrêt est déplacé de cinquante mètres, devant la pharmacie, à cause des travaux.', NULL),
    (v_scenario_0, 5, 'Quelle affirmation est vraie ?', ARRAY['A) Le dimanche, les horaires ne changent pas','B) On ne peut pas acheter de ticket dans le bus','C) Le dernier bus partira plus tard le soir','D) Les changements ne concernent que l''application'], 'A', 'Le texte précise que le dimanche il n''y a pas de changement.', NULL);

  -- Sujet 2 : Un message pour mon propriétaire (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'A2', 'Un message pour mon propriétaire', 'Bonjour Monsieur Garnier, je vous écris parce que j''ai un ___________ (1) dans mon appartement. ___________ (2) lundi, il y a une fuite d''eau dans la salle de bain et le plafond est humide. J''ai déjà ___________ (3) le plombier de la résidence, mais il n''a pas répondu. Je suis au travail tous les jours de 8 heures ___________ (4) 17 heures, mais je suis à la maison le soir et le samedi. C''est urgent, ___________ (5) l''eau tombe chez mon voisin du dessous. Merci de me répondre rapidement. Cordialement, Karim Benali', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) voisin','B) contrat','C) problème','D) loyer'], 'C', 'Le locataire signale une fuite : il a un problème dans son appartement. Les autres mots n''ont pas de sens ici.', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) Depuis','B) Pendant','C) Dans','D) Pour'], 'A', '« Depuis lundi » indique le point de départ d''une situation qui continue aujourd''hui.', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) appeler','B) appelle','C) appelant','D) appelé'], 'D', 'Après « j''ai déjà », on utilise le participe passé : « j''ai déjà appelé ».', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) de','B) à','C) en','D) par'], 'B', 'L''expression « de 8 heures à 17 heures » indique le début et la fin d''une période.', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) donc','B) mais','C) parce que','D) ou'], 'C', 'La fuite est urgente parce que l''eau tombe chez le voisin : « parce que » donne la raison.', 5);

  -- Sujet 3 : Quatre services de santé près de chez vous (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'A2', 'Quatre services de santé près de chez vous', NULL, '[{"label": "Pharmacie du Marché", "content": "La pharmacie du Marché est ouverte tous les dimanches de 9 h à 19 h, et la nuit sur appel en cas d''urgence. Vous pouvez y retirer vos médicaments avec une ordonnance ou demander un conseil au pharmacien, sans rendez-vous."}, {"label": "Centre de vaccination", "content": "Le centre municipal propose des vaccins gratuits aux enfants et aux adultes le mercredi après-midi. Il faut prendre rendez-vous par téléphone et apporter son carnet de santé le jour de la vaccination."}, {"label": "Cabinet du docteur Lambert", "content": "Le docteur Lambert reçoit les patients le samedi matin, de 8 h à 12 h, sans rendez-vous. On passe dans l''ordre d''arrivée. La consultation est payante, comme chez tous les médecins."}, {"label": "Aide sociale à la mairie annexe", "content": "Une assistante sociale vous aide à remplir vos dossiers d''assurance maladie et de mutuelle le jeudi matin, à la mairie annexe. Le service est gratuit, mais il faut prendre rendez-vous à l''accueil."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'J''ai très mal à la gorge, mon médecin est absent et je n''ai pas de rendez-vous. Nous sommes samedi matin. Quel service peut m''aider ?', ARRAY['A) Pharmacie du Marché','B) Centre de vaccination','C) Cabinet du docteur Lambert','D) Aide sociale à la mairie annexe'], 'C', 'Le cabinet reçoit sans rendez-vous le samedi matin, dans l''ordre d''arrivée.', NULL),
    (v_scenario_2, 2, 'Mon fils a six ans et je veux mettre ses vaccins à jour, mais je ne travaille pas le mercredi. Quel service peut m''aider ?', ARRAY['A) Centre de vaccination','B) Cabinet du docteur Lambert','C) Pharmacie du Marché','D) Aide sociale à la mairie annexe'], 'A', 'Le centre vaccine gratuitement le mercredi après-midi, sur rendez-vous, et accepte les enfants.', NULL),
    (v_scenario_2, 3, 'J''ai reçu un courrier de mon assurance maladie et je ne comprends pas comment remplir le dossier. Quel service peut m''aider ?', ARRAY['A) Cabinet du docteur Lambert','B) Centre de vaccination','C) Pharmacie du Marché','D) Aide sociale à la mairie annexe'], 'D', 'L''assistante sociale aide à remplir les dossiers de santé le jeudi matin, gratuitement.', NULL),
    (v_scenario_2, 4, 'C''est dimanche matin et je dois récupérer un médicament avec mon ordonnance. Quel service peut m''aider ?', ARRAY['A) Centre de vaccination','B) Pharmacie du Marché','C) Cabinet du docteur Lambert','D) Aide sociale à la mairie annexe'], 'B', 'La pharmacie est ouverte le dimanche de 9 h à 19 h et délivre les médicaments sur ordonnance.', NULL),
    (v_scenario_2, 5, 'Il est deux heures du matin et mon fils est malade : j''ai besoin d''un médicament en urgence. Quel service peut m''aider ?', ARRAY['A) Aide sociale à la mairie annexe','B) Pharmacie du Marché','C) Cabinet du docteur Lambert','D) Centre de vaccination'], 'B', 'La pharmacie fonctionne aussi la nuit sur appel, en cas d''urgence.', NULL);

  -- Sujet 4 : Inscription à la cantine scolaire (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'A2', 'Inscription à la cantine scolaire', E'Objet : inscription à la cantine scolaire pour la rentrée de janvier\n\nMadame, Monsieur,\n\nLa mairie vous informe que les inscriptions à la cantine des écoles de la ville sont ouvertes du 1er au 20 novembre. Vous pouvez remplir le formulaire en ligne sur le site de la mairie ou venir au service Éducation, du lundi au vendredi, de 9 h à 12 h. Pour inscrire votre enfant, apportez un justificatif de domicile de moins de trois mois et le carnet de santé de votre enfant. Le prix du repas dépend de vos revenus. Après le 20 novembre, aucune inscription ne sera possible avant le mois de mars, sauf cas exceptionnel. Merci de respecter cette date.\n\nLe service Éducation', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Quel est l''objet principal de ce courrier ?', ARRAY['A) Annoncer une hausse du prix des repas','B) Expliquer comment inscrire son enfant à la cantine','C) Inviter les parents à une réunion à l''école','D) Proposer de nouvelles activités le soir après la classe'], 'B', 'Le courrier donne les dates, la méthode et les documents pour s''inscrire à la cantine.', NULL),
    (v_scenario_3, 2, 'Comment peut-on inscrire son enfant ?', ARRAY['A) Par téléphone, auprès du service Éducation de la mairie','B) Auprès du directeur de l''école','C) Par courrier envoyé à la mairie','D) En ligne ou en se rendant au service Éducation'], 'D', 'Le texte propose un formulaire en ligne ou une visite au service Éducation.', NULL),
    (v_scenario_3, 3, 'Quels documents faut-il apporter ?', ARRAY['A) Une preuve d''adresse récente et le carnet de santé','B) Une carte d''identité et un bulletin de salaire','C) Un certificat médical récent et une photo de l''enfant','D) Un avis d''impôt et un acte de naissance'], 'A', 'Il faut un justificatif de domicile de moins de trois mois et le carnet de santé de l''enfant.', NULL),
    (v_scenario_3, 4, 'Que se passe-t-il si un parent s''inscrit après le 20 novembre ?', ARRAY['A) Il doit payer le repas plus cher que les autres','B) Son enfant est inscrit automatiquement à la cantine du quartier','C) Il doit attendre mars, sauf situation particulière','D) Il doit s''adresser à une autre ville'], 'C', 'Après cette date, l''inscription n''est possible qu''en mars, sauf cas exceptionnel.', NULL),
    (v_scenario_3, 5, 'De quoi dépend le prix du repas ?', ARRAY['A) De l''âge de l''enfant','B) De l''école choisie','C) Du nombre de repas par semaine','D) Des revenus de la famille'], 'D', 'Le courrier indique que le prix du repas dépend des revenus.', NULL);

  -- Sujet 5 : Une nouvelle bibliothèque dans le quartier (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'A2', 'Une nouvelle bibliothèque dans le quartier', 'Depuis samedi, les habitants du quartier des Lilas ont une nouvelle bibliothèque, installée dans l''ancienne poste. Elle propose plus de cinq mille livres, des journaux et des jeux pour les enfants. L''entrée est gratuite, mais il faut une carte pour emprunter des livres : elle coûte cinq euros par an. Le maire explique que le quartier n''avait plus de lieu culturel depuis longtemps. La bibliothèque organise aussi des activités : le mercredi, une bénévole lit des histoires aux enfants, et le vendredi soir, des cours de français sont proposés aux adultes. Certains habitants sont contents, mais d''autres trouvent que les horaires sont trop courts : la bibliothèque ferme à 17 h en semaine.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Quelle nouvelle annonce cet article ?', ARRAY['A) La fermeture définitive de la poste du centre-ville','B) Le déménagement d''une école primaire','C) L''ouverture d''une bibliothèque dans un quartier','D) L''arrivée d''un nouveau maire'], 'C', 'Le journal raconte l''ouverture d''une nouvelle bibliothèque dans l''ancienne poste.', NULL),
    (v_scenario_4, 2, 'Pourquoi le maire est-il content de cette ouverture ?', ARRAY['A) La ville va gagner de l''argent avec les cartes','B) Il manquait un lieu culturel dans le quartier','C) Les écoles avaient besoin de livres neufs','D) La poste coûtait trop cher à la commune'], 'B', 'Le maire explique que le quartier n''avait plus de lieu culturel depuis longtemps.', NULL),
    (v_scenario_4, 3, 'Qu''est-ce qui est gratuit à la bibliothèque ?', ARRAY['A) L''entrée dans le bâtiment','B) L''emprunt des livres à la maison','C) La carte de lecteur pour un an','D) Les jeux à emporter chez soi'], 'A', 'L''entrée est gratuite, mais la carte nécessaire pour emprunter coûte cinq euros par an.', NULL),
    (v_scenario_4, 4, 'Que propose la bibliothèque le vendredi soir ?', ARRAY['A) Une lecture d''histoires pour les enfants','B) Des cours d''informatique pour les seniors','C) Un concert dans la salle principale','D) Des cours de français pour les adultes'], 'D', 'Le mercredi, on lit des histoires aux enfants ; le vendredi soir, ce sont des cours de français pour adultes.', NULL),
    (v_scenario_4, 5, 'Quel reproche font certains habitants ?', ARRAY['A) Le prix de la carte de lecteur est trop élevé','B) La bibliothèque ferme trop tôt en semaine','C) Il n''y a pas assez de livres pour les enfants','D) Le bâtiment est trop loin du centre-ville'], 'B', 'Certains habitants trouvent les horaires trop courts, car elle ferme à 17 h en semaine.', NULL);

END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : B1 | Thématique : Travail et logement | 2 sujet(s)
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
BEGIN
  -- Sujet 1 : Nouvelle organisation des congés d'été (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'B1', 'Nouvelle organisation des congés d''été', E'Note interne — Organisation des congés d''été\n\nChers collègues,\n\nPour éviter les difficultés des années précédentes, la direction modifie la façon de demander les congés d''été. Désormais, chaque salarié devra déposer sa demande sur l''intranet avant le 15 mars, en indiquant deux périodes possibles. Les responsables d''équipe étudieront les demandes en tenant compte des besoins du service : au moins la moitié de chaque équipe devra être présente en juillet et en août. En cas de désaccord entre plusieurs collègues, la priorité sera donnée à ceux qui n''ont pas obtenu leurs dates préférées l''année précédente, puis aux salariés qui ont des enfants scolarisés. Les réponses seront communiquées avant la fin du mois d''avril. Il sera encore possible de modifier ses dates après cette réponse, mais seulement pour une raison sérieuse, à condition de prévenir son responsable un mois à l''avance.\n\nLa direction des ressources humaines', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est le but de cette note ?', ARRAY['A) Annoncer la fermeture de l''entreprise en août','B) Expliquer comment poser ses congés d''été','C) Remplacer les congés par du télétravail','D) Diminuer le nombre de jours de congé'], 'B', 'La note explique comment déposer et traiter les demandes de congés d''été à partir de cette année.', NULL),
    (v_scenario_0, 2, 'Que doit faire un salarié avant le 15 mars ?', ARRAY['A) Choisir une seule période avec son responsable','B) Envoyer une lettre à la direction','C) Signer un avenant à son contrat','D) Indiquer deux choix de dates sur l''intranet'], 'D', 'Chaque salarié dépose sa demande sur l''intranet en indiquant deux périodes possibles.', NULL),
    (v_scenario_0, 3, 'Qui est prioritaire quand plusieurs collègues veulent les mêmes dates ?', ARRAY['A) Celui qui n''avait pas eu ses dates l''an dernier','B) Le collègue qui a le plus d''ancienneté dans l''entreprise','C) Celui qui a déposé sa demande le plus tôt sur l''intranet','D) Le responsable de l''équipe concernée'], 'A', 'La priorité va d''abord à ceux qui n''ont pas obtenu leurs dates préférées l''année précédente.', NULL),
    (v_scenario_0, 4, 'Dans quelle situation peut-on changer ses dates après la réponse ?', ARRAY['A) Si toute l''équipe est d''accord','B) Si la demande est faite avant le mois d''avril','C) Pour un motif important, un mois avant','D) Si un collègue accepte d''échanger ses dates'], 'C', 'Le changement reste possible pour une raison sérieuse, avec un préavis d''un mois.', NULL),
    (v_scenario_0, 5, 'Quelle affirmation correspond à la note ?', ARRAY['A) Les congés seront refusés aux parents d''enfants scolarisés','B) Une partie de chaque équipe doit rester présente en été','C) Les demandes seront acceptées dans l''ordre d''arrivée','D) La direction choisira seule les dates de chacun'], 'B', 'Au moins la moitié de chaque équipe doit être présente en juillet et en août.', NULL);

  -- Sujet 2 : Travaux de rénovation dans la résidence (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'B1', 'Travaux de rénovation dans la résidence', E'Objet : travaux de rénovation des façades\n\nMadame, Monsieur,\n\nNous vous informons que des travaux de rénovation des façades de la résidence « Les Tilleuls » auront lieu du 12 octobre à la fin du mois de décembre. Une entreprise spécialisée installera des échafaudages autour du bâtiment ; pendant cette période, les fenêtres donnant sur la rue ne pourront pas être ouvertes entre 8 h et 17 h, du lundi au vendredi. Nous vous demandons de retirer avant le 9 octobre les objets placés sur vos balcons, notamment les plantes, les meubles et les vélos, afin de ne pas les abîmer et de faciliter le travail des ouvriers. Les entrées de l''immeuble resteront accessibles, mais l''ascenseur sera parfois arrêté en fin de journée. Une réunion d''information est prévue le jeudi 1er octobre à 18 h 30 dans la salle commune, où le responsable du chantier répondra à vos questions. Pour toute difficulté particulière (personne à mobilité réduite, télétravail, etc.), vous pouvez contacter le gardien de l''immeuble, qui transmettra votre demande à l''agence. Nous vous remercions de votre compréhension.\n\nL''agence de gestion', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel est l''objet de ce courrier ?', ARRAY['A) Annoncer une augmentation des charges de la résidence','B) Demander aux habitants de quitter leur logement','C) Prévenir les habitants de travaux à l''extérieur du bâtiment','D) Informer d''un changement de gardien'], 'C', 'Le courrier annonce des travaux de rénovation des façades et explique leurs conséquences.', NULL),
    (v_scenario_1, 2, 'Que doivent faire les habitants avant le 9 octobre ?', ARRAY['A) Enlever les objets posés sur leurs balcons','B) Fermer les volets de toutes leurs fenêtres','C) Signaler leurs dates de vacances au gardien','D) Signer un document à l''agence'], 'A', 'L''agence demande de retirer plantes, meubles et vélos des balcons avant le 9 octobre.', NULL),
    (v_scenario_1, 3, 'Qu''est-ce qui sera difficile pendant les travaux ?', ARRAY['A) Entrer dans l''immeuble par la porte principale','B) Utiliser l''eau chaude dans la matinée','C) Se garer devant la résidence','D) Ouvrir les fenêtres côté rue en journée'], 'D', 'Les fenêtres donnant sur la rue ne pourront pas être ouvertes entre 8 h et 17 h en semaine.', NULL),
    (v_scenario_1, 4, 'À quoi sert la réunion du 1er octobre ?', ARRAY['A) À voter le budget des travaux de la résidence','B) À poser ses questions au responsable du chantier','C) À choisir la couleur des nouvelles façades','D) À rencontrer les nouveaux voisins de la résidence'], 'B', 'Le responsable du chantier répondra aux questions des habitants lors de cette réunion.', NULL),
    (v_scenario_1, 5, 'Que peut faire un habitant qui a une difficulté particulière ?', ARRAY['A) Téléphoner à l''entreprise chargée des travaux','B) Demander un logement temporaire à l''agence','C) S''adresser au gardien, qui préviendra l''agence','D) Écrire directement au maire de la commune concernée'], 'C', 'Le gardien transmet à l''agence les demandes liées à une situation particulière.', NULL);

END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : B2 | Thématique : Citoyenneté, société, emploi, éducation, consommation | 5 sujet(s)
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
  -- Sujet 1 : Consultation sur la place du Marché (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'B2', 'Consultation sur la place du Marché', 'La commune lance une consultation ouverte à tous les habitants sur le futur aménagement de la place du Marché. Le projet actuel prévoit de réduire le stationnement de moitié afin d''agrandir l''espace piéton, de planter une vingtaine d''arbres et d''installer une aire de jeux. Ses partisans espèrent ainsi attirer plus de visiteurs et améliorer la qualité de l''air ; les commerçants, eux, redoutent une baisse de leur clientèle si les voitures sont moins nombreuses. Pour concilier ces intérêts, la municipalité s''engage à étudier des solutions complémentaires, comme un parking relais à proximité, à condition que les habitants les jugent utiles. Chacun peut donner son avis jusqu''au 30 novembre, soit sur le site de la commune, soit en déposant un formulaire papier à l''accueil de la mairie, soit lors de l''une des deux réunions publiques. Les avis reçus seront rendus publics en janvier, mais la décision finale reviendra au conseil municipal, qui n''est pas obligé de suivre l''opinion majoritaire. La participation n''est pas réservée aux électeurs : les habitants étrangers, les jeunes de moins de dix-huit ans et les propriétaires de commerces peuvent aussi s''exprimer.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est l''objectif de cette annonce ?', ARRAY['A) Annoncer le début des travaux sur la place du Marché','B) Inviter les habitants à donner leur avis sur un projet','C) Présenter les résultats d''un vote organisé en ville','D) Recruter des bénévoles pour planter des arbres en ville'], 'B', 'La commune ouvre une consultation pour recueillir l''avis des habitants sur l''aménagement de la place.', NULL),
    (v_scenario_0, 2, 'Pourquoi les commerçants s''inquiètent-ils ?', ARRAY['A) Ils redoutent une place trop bruyante pour leurs clients','B) Ils veulent payer moins d''impôts locaux cette année','C) Ils refusent que des arbres soient plantés devant leurs vitrines','D) Ils craignent de perdre des clients avec moins de voitures'], 'D', 'Les commerçants redoutent une baisse de leur clientèle si les voitures deviennent moins nombreuses.', NULL),
    (v_scenario_0, 3, 'Que promet la municipalité pour répondre à ces inquiétudes ?', ARRAY['A) Étudier d''autres solutions, comme un parking à proximité','B) Supprimer le projet d''aire de jeux pour rassurer les commerçants','C) Aider financièrement les commerçants pendant la durée des travaux','D) Conserver tous les emplacements de stationnement actuels'], 'A', 'Elle s''engage à étudier des solutions complémentaires, par exemple un parking relais, si les habitants les jugent utiles.', NULL),
    (v_scenario_0, 4, 'Que révèle le texte sur la décision finale ?', ARRAY['A) Elle sera prise par un vote de tous les habitants','B) Elle dépend de l''accord des commerçants concernés','C) Elle peut s''écarter de l''opinion de la majorité','D) Elle a déjà été prise avant la consultation'], 'C', 'Le conseil municipal décidera et n''est pas obligé de suivre l''opinion majoritaire.', NULL),
    (v_scenario_0, 5, 'Qui peut participer à la consultation ?', ARRAY['A) Aussi bien les mineurs que les habitants étrangers','B) Les électeurs inscrits sur les listes de la commune','C) Les propriétaires de logements de la commune','D) Les habitants de plus de dix-huit ans'], 'A', 'La participation n''est pas réservée aux électeurs : étrangers, jeunes de moins de dix-huit ans et commerçants peuvent s''exprimer.', NULL);

  -- Sujet 2 : La colocation entre générations (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'B2', 'La colocation entre générations', 'Face à la hausse des loyers et à l''isolement de nombreuses personnes âgées, la colocation intergénérationnelle séduit un nombre croissant de villes. Le principe est simple : un étudiant occupe une chambre à petit prix chez un senior, en échange d''une présence régulière et de quelques services. Le propriétaire ___________ (1) ainsi d''une présence rassurante, notamment le soir, et parfois d''un coup de main pour les courses ou l''informatique. Les étudiants cherchent avant tout un logement abordable, ___________ (2) les seniors recherchent surtout de la compagnie. Certains seniors, il est vrai, hésitent à ouvrir leur porte à un inconnu par crainte de perdre leur intimité ; les associations organisent donc une première rencontre autour d''un repas avant toute décision. Elles étudient aussi soigneusement chaque profil, ___________ (3) chacun sait à quoi s''attendre avant de s''engager. Il faut enfin des règles claires, ___________ (4) dépend en grande partie la réussite de la cohabitation : horaires, invités, partage des tâches ménagères. Une charte signée par les deux parties précise les droits de chacun ainsi que la durée de l''accord, généralement d''une année scolaire. Certaines villes proposent en outre un suivi régulier, avec un référent joignable en cas de difficulté. Les premiers bilans sont encourageants, mais l''offre reste inférieure à la demande. ___________ (5) les efforts de ces associations, beaucoup d''étudiants restent sur liste d''attente, faute de familles d''accueil suffisamment nombreuses.', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) manque','B) se plaint','C) bénéficie','D) se méfie'], 'C', 'Le propriétaire profite de la présence de l''étudiant : « bénéficie d''une présence » est cohérent avec « ainsi ». Manquer, se plaindre ou se méfier de cette présence contredirait l''idée d''un avantage.', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) tandis que','B) parce que','C) pourvu que','D) avant que'], 'A', 'La phrase oppose ce que cherchent les étudiants à ce que cherchent les seniors : « tandis que » exprime cette opposition.', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) afin que','B) bien que','C) à moins que','D) de sorte que'], 'D', 'Le verbe « sait » est à l''indicatif. Seul « de sorte que » peut exprimer une conséquence avec l''indicatif ; les autres conjonctions demandent le subjonctif.', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) que','B) dont','C) où','D) qui'], 'B', 'On dit « dépendre de » : le pronom relatif « dont » remplace « de » + les règles claires.', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) Malgré','B) Grâce à','C) À cause de','D) En raison de'], 'A', 'L''offre reste insuffisante malgré les efforts des associations : « malgré » exprime cette opposition. Les autres expressions donnent une cause, ce qui n''a pas de sens ici.', 5);

  -- Sujet 3 : Quatre dispositifs pour évoluer professionnellement (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'B2', 'Quatre dispositifs pour évoluer professionnellement', NULL, '[{"label": "Bilan de compétences", "content": "Ce dispositif s''adresse aux salariés qui s''interrogent sur leur avenir professionnel sans savoir quelle voie choisir. Sur une période de deux à trois mois, un conseiller analyse avec vous vos acquis, vos motivations et vos limites, puis vous aide à élaborer un projet réaliste. Les entretiens ont lieu en dehors des horaires de travail et leur contenu reste confidentiel : votre employeur n''en reçoit pas le détail."}, {"label": "Validation des acquis", "content": "Vous exercez un métier depuis plusieurs années, mais vous ne possédez pas le diplôme correspondant ? Ce parcours permet de faire reconnaître votre expérience devant un jury, à condition de justifier d''au moins trois ans d''activité en rapport avec le diplôme visé. Il faut constituer un dossier détaillé et préparer un entretien ; un accompagnement est proposé, mais il est souvent payant."}, {"label": "Formation en alternance", "content": "Cette formule combine des cours dans un établissement et des périodes en entreprise, avec un contrat de travail et un salaire. Elle convient à ceux qui veulent apprendre un métier en travaillant, mais elle est en général réservée aux personnes de moins de trente ans, sauf situations particulières. Les places sont limitées et les candidatures doivent être déposées plusieurs mois avant la rentrée."}, {"label": "Atelier de recherche d''emploi", "content": "Animé par un conseiller, cet atelier d''une demi-journée aide les demandeurs d''emploi à rédiger un CV, à préparer un entretien d''embauche et à utiliser efficacement les sites d''offres. Il est gratuit, ouvert sans condition de diplôme ni d''expérience, et il est possible de s''y inscrire la veille. En revanche, il ne débouche sur aucune qualification officielle : il constitue simplement un premier appui pour démarrer ses démarches."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Je fais le même métier depuis cinq ans sans avoir le diplôme correspondant, et je voudrais obtenir un titre officiel sans reprendre d''études. Quel dispositif peut me convenir ?', ARRAY['A) Bilan de compétences','B) Formation en alternance','C) Validation des acquis','D) Atelier de recherche d''emploi'], 'C', 'Ce parcours fait reconnaître l''expérience devant un jury, à partir de trois ans d''activité, sans retour en cours.', NULL),
    (v_scenario_2, 2, 'J''ai quarante-deux ans, je ne suis plus sûr de mon métier et je voudrais réfléchir à une reconversion sans que mon employeur connaisse le détail de mes réflexions. Quel dispositif peut me convenir ?', ARRAY['A) Bilan de compétences','B) Validation des acquis','C) Formation en alternance','D) Atelier de recherche d''emploi'], 'A', 'Le contenu du bilan reste confidentiel : l''employeur n''en reçoit pas le détail.', NULL),
    (v_scenario_2, 3, 'J''ai vingt-cinq ans et je veux apprendre le métier de menuisier tout en recevant un salaire pendant que j''étudie. Quel dispositif peut me convenir ?', ARRAY['A) Bilan de compétences','B) Validation des acquis','C) Atelier de recherche d''emploi','D) Formation en alternance'], 'D', 'L''alternance combine cours et périodes en entreprise, avec un contrat et un salaire, pour les moins de trente ans.', NULL),
    (v_scenario_2, 4, 'Je n''ai pas de travail depuis six mois, je n''ai aucun diplôme et je voudrais une aide rapide et gratuite pour écrire mon CV cette semaine. Quel dispositif peut me convenir ?', ARRAY['A) Bilan de compétences','B) Atelier de recherche d''emploi','C) Validation des acquis','D) Formation en alternance'], 'B', 'Cet atelier gratuit d''une demi-journée aide à rédiger un CV, sans condition de diplôme, avec inscription possible la veille.', NULL),
    (v_scenario_2, 5, 'J''ai plus de dix ans d''expérience et je suis prêt à payer un accompagnement pour préparer mon dossier devant un jury. Quel dispositif peut me convenir ?', ARRAY['A) Validation des acquis','B) Bilan de compétences','C) Formation en alternance','D) Atelier de recherche d''emploi'], 'A', 'La validation des acquis passe par un dossier détaillé et un entretien devant un jury ; l''accompagnement est souvent payant.', NULL);

  -- Sujet 4 : Inscription administrative à l'université (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'B2', 'Inscription administrative à l''université', E'Objet : inscription administrative pour l''année universitaire 2026-2027\n\nMadame, Monsieur,\n\nNous avons le plaisir de vous informer que votre candidature a été retenue. Pour finaliser votre situation, vous devez procéder à votre inscription administrative avant le 15 octobre, date limite impérative. Cette démarche s''effectue exclusivement en ligne, sur la plateforme de l''université, en trois étapes : création du compte, dépôt des pièces justificatives, puis paiement des droits d''inscription.\n\nLes pièces à fournir sont les suivantes : une pièce d''identité en cours de validité, le dernier diplôme obtenu accompagné de sa traduction officielle s''il n''est pas rédigé en français, ainsi qu''une attestation de couverture santé. Les étudiants qui ont obtenu leur diplôme à l''étranger peuvent bénéficier d''un délai supplémentaire de quinze jours, à condition d''en faire la demande écrite avant le 5 octobre auprès du service de la scolarité ; passé ce délai, le dossier ne pourra plus être accepté et la place sera proposée à un autre candidat.\n\nLe paiement des droits peut être effectué en une ou en trois fois. Les étudiants boursiers en sont dispensés, sur présentation de leur notification de bourse. Une fois l''inscription validée, la carte d''étudiant sera remise en personne, sur présentation d''une pièce d''identité, au bureau de la scolarité, ouvert du lundi au jeudi de 9 h à 16 h.\n\nPour toute question, une permanence téléphonique est assurée tous les après-midi.\n\nLe service de la scolarité', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Quel est l''objet principal de ce courrier ?', ARRAY['A) Expliquer à un candidat admis comment s''inscrire','B) Annoncer à un candidat que sa demande n''a pas été retenue','C) Proposer à un étudiant de changer de filière universitaire','D) Informer les étudiants d''une hausse des droits d''inscription'], 'A', 'Le courrier confirme l''admission et détaille la procédure d''inscription administrative.', NULL),
    (v_scenario_3, 2, 'Comment l''inscription doit-elle être réalisée ?', ARRAY['A) Au bureau de la scolarité, sur rendez-vous préalable','B) Par courrier, avec les pièces justificatives jointes','C) Sur la plateforme en ligne, en plusieurs étapes','D) Par téléphone, pendant la permanence de l''après-midi'], 'C', 'La démarche se fait exclusivement en ligne, en trois étapes : compte, pièces, paiement.', NULL),
    (v_scenario_3, 3, 'Que peut obtenir un étudiant diplômé à l''étranger ?', ARRAY['A) Une réduction du montant des droits d''inscription','B) La dispense de traduction officielle de son diplôme','C) Une inscription automatique sans pièces justificatives','D) Un délai supplémentaire, sur demande écrite'], 'D', 'Il peut avoir quinze jours de plus s''il en fait la demande écrite avant le 5 octobre.', NULL),
    (v_scenario_3, 4, 'Dans quel cas l''étudiant ne paie-t-il pas les droits d''inscription ?', ARRAY['A) Lorsqu''il s''inscrit bien avant le 5 octobre','B) Lorsqu''il présente une notification de bourse','C) Lorsqu''il choisit de payer en trois fois sans frais','D) Lorsqu''il vient d''un autre pays que la France'], 'B', 'Les étudiants boursiers sont dispensés, sur présentation de leur notification de bourse.', NULL),
    (v_scenario_3, 5, 'Que se passe-t-il si le dossier reste incomplet après le délai supplémentaire ?', ARRAY['A) Le candidat doit payer des frais de dossier en plus','B) Le dossier est transféré à une autre université','C) La place peut être proposée à un autre candidat','D) L''université envoie un nouveau courrier de rappel'], 'C', 'Passé ce délai, le dossier n''est plus accepté et la place est proposée à un autre candidat.', NULL);

  -- Sujet 5 : Réparer plutôt que racheter (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'B2', 'Réparer plutôt que racheter', E'Longtemps, jeter un appareil en panne pour en acheter un neuf semblait plus simple que le faire réparer. Cette logique s''inverse peu à peu. Dans plusieurs villes, des « cafés de réparation » ouvrent chaque mois leurs portes : des bénévoles y aident les visiteurs à remettre en état grille-pains, vêtements ou vélos. Selon les organisateurs, près de la moitié des objets apportés repartent en état de marche.\n\nCe mouvement s''explique d''abord par le prix : face à l''inflation, de nombreux ménages préfèrent prolonger la vie de leurs appareils. Il répond aussi à une inquiétude écologique, car la fabrication d''un appareil neuf consomme beaucoup de ressources. Enfin, certains fabricants affichent désormais une note de réparabilité sur leurs produits, ce qui pousse les consommateurs à s''intéresser à la question avant d''acheter.\n\nLe secteur se heurte toutefois à plusieurs obstacles. Les pièces détachées sont parfois introuvables ou vendues à un prix qui décourage la réparation. Les professionnels déplorent aussi un manque de main-d''œuvre qualifiée, alors que la demande augmente. Quant aux bénévoles, ils rappellent qu''ils ne remplacent pas les artisans : leur rôle est d''apprendre aux gens à réparer eux-mêmes, non de travailler à leur place.\n\nLes associations de consommateurs saluent cette évolution, mais nuancent leur enthousiasme : selon elles, tant que la disponibilité des pièces détachées ne sera pas mieux garantie, la réparation restera un choix réservé aux plus motivés.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Quelle évolution l''article décrit-il ?', ARRAY['A) Un recul des ventes d''appareils neufs dans les grandes villes','B) Un intérêt croissant pour la réparation d''objets','C) La disparition progressive des artisans et des bénévoles','D) L''interdiction de jeter les appareils qui ne fonctionnent plus'], 'B', 'L''article explique que la logique du « tout jeter » s''inverse et que la réparation attire de plus en plus.', NULL),
    (v_scenario_4, 2, 'Quelles raisons expliquent ce changement ?', ARRAY['A) Le prix, l''écologie et l''information sur la réparabilité','B) La baisse du prix des pièces détachées et de nouvelles aides publiques','C) La fermeture des magasins d''appareils neufs et un effet de mode','D) Des obligations imposées aux bénévoles et un besoin de convivialité'], 'A', 'Le texte cite le prix face à l''inflation, l''inquiétude écologique et la note de réparabilité affichée par certains fabricants.', NULL),
    (v_scenario_4, 3, 'Que montrent les résultats des cafés de réparation ?', ARRAY['A) Beaucoup d''objets peuvent encore être sauvés','B) Très peu d''objets peuvent être remis en état','C) Les bénévoles peuvent remplacer les artisans professionnels','D) La réparation coûte moins cher qu''un appareil neuf'], 'A', 'Près de la moitié des objets apportés repartent en état de marche : une part importante peut être sauvée.', NULL),
    (v_scenario_4, 4, 'Quel obstacle rencontrent les professionnels de la réparation ?', ARRAY['A) Une concurrence des bénévoles qui remplacent les artisans','B) Un manque de clients malgré l''intérêt du public pour le sujet','C) Des pièces difficiles à trouver et peu de personnel qualifié','D) Des règles sur les prix des services imposées par les fabricants'], 'C', 'Les pièces sont parfois introuvables ou trop chères et la main-d''œuvre qualifiée manque, alors que la demande augmente.', NULL),
    (v_scenario_4, 5, 'Quelle réserve les associations de consommateurs expriment-elles ?', ARRAY['A) Les cafés de réparation risquent de disparaître faute de bénévoles','B) Sans pièces plus disponibles, peu de gens feront réparer','C) Les fabricants refusent d''afficher la note de réparabilité','D) Les prix des appareils neufs vont encore baisser'], 'B', 'Selon elles, la réparation restera réservée aux plus motivés tant que la disponibilité des pièces ne sera pas mieux garantie.', NULL);

END $$;
