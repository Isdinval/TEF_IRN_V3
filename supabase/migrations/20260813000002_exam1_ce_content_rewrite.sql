-- Item 5 du plan "Refonte CE examen blanc" : réécriture des 20 questions CE de exam-1
-- selon la répartition validée avec Olivier (docs/tef-irn-reference.md) :
--   4 court / 4 trous (2 textes x 2 lacunes) / 2 multi_texte / 5 long_admin / 5 article_presse
--
-- Remplace l'ancien contenu (10 textes courts x 2 questions, tout en ce_format='court')
-- par les 5 formats introduits aux items 1-4. order_index 20-39 conservé pour ne pas
-- perturber la numérotation globale de l'examen (CO=0-19, CE=20-39, EE/EO ensuite).

DO $$
DECLARE
  v_exam_id uuid;
BEGIN
  SELECT id INTO v_exam_id FROM public.exams WHERE slug = 'exam-1';

  IF v_exam_id IS NULL THEN
    RAISE EXCEPTION 'Exam with slug exam-1 not found';
  END IF;

  DELETE FROM public.exam_questions WHERE exam_id = v_exam_id AND section = 'CE';

  -- ===================== COURT — 4 questions (order_index 20-23) =====================
  -- 4 textes distincts, 1 question chacun, format inchangé par rapport à l'existant.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 20, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Le local à vélos de la résidence sera fermé pour travaux de peinture du 3 au 10 septembre. Merci de stationner votre vélo ailleurs durant cette période.',
    'Que doivent faire les résidents pendant les travaux ?',
    ARRAY['A) Garer leur vélo ailleurs','B) Ne plus utiliser leur vélo','C) Attendre la fin du mois','D) Demander une autorisation'], 'A', 'court'),
  (v_exam_id, 'CE', 21, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Boulangerie Marchetti recherche un apprenti pour la préparation du pain, du mardi au samedi, de 5h à 12h. Se présenter directement en boutique avec un CV.',
    'Comment faut-il postuler à cette offre ?',
    ARRAY['A) Envoyer un CV par mail','B) Se présenter en boutique','C) Téléphoner le matin','D) Passer un entretien en ligne'], 'B', 'court'),
  (v_exam_id, 'CE', 22, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'La piscine municipale sera accessible gratuitement le premier dimanche de chaque mois, de 9h à 13h, pour tous les habitants de la commune sur présentation d''un justificatif de domicile.',
    'Que faut-il présenter pour profiter de la gratuité ?',
    ARRAY['A) Une carte d''identité','B) Un justificatif de domicile','C) Un certificat médical','D) Une carte de piscine'], 'B', 'court'),
  (v_exam_id, 'CE', 23, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'En raison d''une coupure d''eau programmée, aucune distribution ne sera assurée dans le quartier des Tilleuls le jeudi 12 entre 8h et 16h. Pensez à faire une réserve d''eau la veille.',
    'Que conseille ce message aux habitants ?',
    ARRAY['A) De quitter le quartier','B) De faire une réserve d''eau','C) D''appeler la mairie','D) De fermer les fenêtres'], 'B', 'court');

  -- ===================== TROUS — 4 questions (order_index 24-27) =====================
  -- 2 textes partagés x 2 lacunes chacun. Les 2 questions d'un même texte partagent le
  -- même `texte` (avec les 2 lacunes visibles) ; `highlight_gap` distingue laquelle est active.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format, highlight_gap)
  VALUES
  (v_exam_id, 'CE', 24, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'L''association Les Mains Tendues ___________ (1) chaque année une collecte de vêtements chauds pour les personnes sans-abri. Les dons peuvent être ___________ (2) directement à l''accueil de la mairie jusqu''au 30 novembre.',
    '(1)',
    ARRAY['A) organise','B) annule','C) refuse','D) ferme'], 'A', 'trous', 1),
  (v_exam_id, 'CE', 25, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'L''association Les Mains Tendues ___________ (1) chaque année une collecte de vêtements chauds pour les personnes sans-abri. Les dons peuvent être ___________ (2) directement à l''accueil de la mairie jusqu''au 30 novembre.',
    '(2)',
    ARRAY['A) vendus','B) déposés','C) jetés','D) empruntés'], 'B', 'trous', 2),
  (v_exam_id, 'CE', 26, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Depuis la crise sanitaire, de nombreuses entreprises ___________ (1) désormais deux jours de télétravail par semaine à leurs salariés. Cette organisation permet de ___________ (2) le temps de trajet tout en maintenant les liens avec l''équipe.',
    '(1)',
    ARRAY['A) interdisent','B) proposent','C) suppriment','D) ignorent'], 'B', 'trous', 1),
  (v_exam_id, 'CE', 27, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Depuis la crise sanitaire, de nombreuses entreprises ___________ (1) désormais deux jours de télétravail par semaine à leurs salariés. Cette organisation permet de ___________ (2) le temps de trajet tout en maintenant les liens avec l''équipe.',
    '(2)',
    ARRAY['A) augmenter','B) réduire','C) compliquer','D) doubler'], 'B', 'trous', 2);

  -- ===================== MULTI_TEXTE — 2 questions (order_index 28-29) =====================
  -- `texte` reste NULL, le contenu vit dans `sub_texts` (grille affichée au candidat).
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, question, options, correct_answer, ce_format, sub_texts)
  VALUES
  (v_exam_id, 'CE', 28, 'text', 'Lisez les documents et répondez à la question.',
    'Quelle offre propose du télétravail ?',
    ARRAY['A) Offre 1','B) Offre 2','C) Offre 3','D) Offre 4'], 'B', 'multi_texte',
    '[
      {"label": "Offre 1", "content": "Restaurant Le Petit Jardin recherche un cuisinier expérimenté, CDI temps plein, travail le week-end."},
      {"label": "Offre 2", "content": "Cabinet comptable cherche assistant administratif, CDD 6 mois, télétravail possible 2 jours/semaine."},
      {"label": "Offre 3", "content": "Salle de sport recrute coach sportif, temps partiel, disponibilités le soir en semaine."},
      {"label": "Offre 4", "content": "Crèche municipale recherche auxiliaire de puériculture, CDI, horaires du matin uniquement."}
    ]'::jsonb),
  (v_exam_id, 'CE', 29, 'text', 'Lisez les documents et répondez à la question.',
    'Quelle annonce convient à une personne en fauteuil roulant recherchant un logement accessible ?',
    ARRAY['A) Annonce 1','B) Annonce 2','C) Annonce 3','D) Annonce 4'], 'B', 'multi_texte',
    '[
      {"label": "Annonce 1", "content": "Studio 20m², centre-ville, sans ascenseur, charges comprises, 480€/mois."},
      {"label": "Annonce 2", "content": "T2 avec balcon, proche gare, 3e étage avec ascenseur, 650€/mois hors charges."},
      {"label": "Annonce 3", "content": "Chambre chez l''habitant, salle de bain partagée, 350€/mois toutes charges comprises."},
      {"label": "Annonce 4", "content": "T3 avec jardin, quartier résidentiel, parking inclus, 850€/mois."}
    ]'::jsonb);

  -- ===================== LONG_ADMIN — 5 questions (order_index 30-34) =====================
  -- 2 documents x 2 questions + 1 document x 1 question.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 30, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Madame, Monsieur,\n\nSuite à votre demande d''aide au logement déposée le 14 mars, votre dossier est actuellement en cours d''instruction. Il manque toutefois une pièce justificative : une attestation de loyer signée par votre propriétaire.\n\nMerci de nous transmettre ce document sous quinze jours, faute de quoi votre dossier sera classé sans suite. Vous pouvez l''envoyer par courrier ou le déposer directement à l''accueil de nos bureaux, du lundi au vendredi de 9h à 16h30.',
    'Que manque-t-il dans le dossier ?',
    ARRAY['A) Une pièce d''identité','B) Une attestation de loyer','C) Un relevé bancaire','D) Un contrat de travail'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 31, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Madame, Monsieur,\n\nSuite à votre demande d''aide au logement déposée le 14 mars, votre dossier est actuellement en cours d''instruction. Il manque toutefois une pièce justificative : une attestation de loyer signée par votre propriétaire.\n\nMerci de nous transmettre ce document sous quinze jours, faute de quoi votre dossier sera classé sans suite. Vous pouvez l''envoyer par courrier ou le déposer directement à l''accueil de nos bureaux, du lundi au vendredi de 9h à 16h30.',
    'Que se passe-t-il si le document n''est pas envoyé à temps ?',
    ARRAY['A) Le dossier est automatiquement validé','B) Le dossier sera classé sans suite','C) Une amende sera appliquée','D) Un rendez-vous sera programmé'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 32, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le conseil syndical rappelle à l''ensemble des copropriétaires que les parties communes de l''immeuble doivent rester libres de tout encombrement, conformément au règlement de copropriété.\n\nLes poussettes, vélos et cartons ne peuvent en aucun cas être entreposés dans les couloirs ou sur les paliers. Un local à vélos est mis à disposition au sous-sol à cet effet. Tout objet laissé dans les parties communes après le 1er du mois prochain sera retiré par le gardien.',
    'Que ne peut-on pas laisser dans les couloirs ?',
    ARRAY['A) Rien de particulier','B) Poussettes, vélos et cartons','C) Uniquement les vélos','D) Les meubles anciens'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 33, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le conseil syndical rappelle à l''ensemble des copropriétaires que les parties communes de l''immeuble doivent rester libres de tout encombrement, conformément au règlement de copropriété.\n\nLes poussettes, vélos et cartons ne peuvent en aucun cas être entreposés dans les couloirs ou sur les paliers. Un local à vélos est mis à disposition au sous-sol à cet effet. Tout objet laissé dans les parties communes après le 1er du mois prochain sera retiré par le gardien.',
    'Que fera le gardien après le 1er du mois prochain ?',
    ARRAY['A) Il enverra un avertissement','B) Il retirera les objets restants','C) Il convoquera une réunion','D) Il fermera le local à vélos'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 34, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Note de service — À l''attention de l''ensemble du personnel\n\nÀ compter du mois prochain, les demandes de congés devront être soumises exclusivement via la plateforme en ligne RH Connect, au moins trois semaines avant la date souhaitée. Les demandes transmises par mail ou en version papier ne seront plus traitées.',
    'Comment faut-il désormais demander un congé ?',
    ARRAY['A) Par mail','B) En version papier','C) Via une plateforme en ligne','D) Par téléphone au service RH'], 'C', 'long_admin');

  -- ===================== ARTICLE_PRESSE — 5 questions (order_index 35-39) =====================
  -- 2 articles x 2 questions + 1 article x 1 question.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 35, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Le télétravail, plébiscité par de nombreux salariés depuis quelques années, continue de transformer l''organisation des entreprises françaises. Selon une étude récente, près d''un salarié sur trois travaille désormais au moins une journée par semaine depuis son domicile.\n\nSi cette pratique séduit par la flexibilité qu''elle offre, elle soulève aussi des interrogations sur le lien social au sein des équipes. Plusieurs entreprises ont ainsi mis en place des journées obligatoires de présence au bureau, afin de maintenir une cohésion entre collègues.',
    'D''après l''article, combien de salariés télétravaillent au moins un jour par semaine ?',
    ARRAY['A) Un sur dix','B) Un sur trois','C) La moitié','D) La quasi-totalité'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 36, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Le télétravail, plébiscité par de nombreux salariés depuis quelques années, continue de transformer l''organisation des entreprises françaises. Selon une étude récente, près d''un salarié sur trois travaille désormais au moins une journée par semaine depuis son domicile.\n\nSi cette pratique séduit par la flexibilité qu''elle offre, elle soulève aussi des interrogations sur le lien social au sein des équipes. Plusieurs entreprises ont ainsi mis en place des journées obligatoires de présence au bureau, afin de maintenir une cohésion entre collègues.',
    'Pourquoi certaines entreprises imposent-elles des jours de présence obligatoire ?',
    ARRAY['A) Pour réduire les coûts','B) Pour maintenir la cohésion d''équipe','C) Pour respecter la loi','D) Pour économiser l''électricité'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 37, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'De plus en plus de municipalités françaises investissent dans le développement de pistes cyclables sécurisées, dans l''espoir de réduire la place de la voiture en centre-ville. Ces aménagements s''accompagnent souvent de la mise en place de vélos en libre-service, accessibles via une simple application mobile.\n\nSi les résultats sont encourageants dans les grandes villes, certains élus de zones rurales estiment que ces politiques restent peu adaptées aux longues distances qui séparent les habitants des commerces et services.',
    'Que mettent en place plusieurs villes pour accompagner les pistes cyclables ?',
    ARRAY['A) Des parkings gratuits','B) Des vélos en libre-service','C) Des voies réservées aux bus','D) Des zones piétonnes uniquement'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 38, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'De plus en plus de municipalités françaises investissent dans le développement de pistes cyclables sécurisées, dans l''espoir de réduire la place de la voiture en centre-ville. Ces aménagements s''accompagnent souvent de la mise en place de vélos en libre-service, accessibles via une simple application mobile.\n\nSi les résultats sont encourageants dans les grandes villes, certains élus de zones rurales estiment que ces politiques restent peu adaptées aux longues distances qui séparent les habitants des commerces et services.',
    'Quelle réserve expriment certains élus ruraux ?',
    ARRAY['A) Le coût est trop élevé','B) Les distances sont trop longues pour le vélo','C) Les habitants n''aiment pas le vélo','D) Les pistes cyclables sont dangereuses'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 39, 'text', 'Lisez attentivement l''article et répondez à la question.',
    'Une association lyonnaise propose depuis peu des cours de français gratuits aux nouveaux arrivants, animés par des bénévoles retraités. L''initiative, saluée par la mairie, a déjà permis à plus de deux cents personnes de progresser rapidement dans leur apprentissage de la langue.',
    'Qui anime les cours de français proposés par l''association ?',
    ARRAY['A) Des professeurs certifiés','B) Des bénévoles retraités','C) Des étudiants en langues','D) Des fonctionnaires municipaux'], 'B', 'article_presse');

END $$;
