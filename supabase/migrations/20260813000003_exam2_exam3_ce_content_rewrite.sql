-- Item 6 du plan "Refonte CE examen blanc" : réécriture des 20 questions CE de exam-2
-- et exam-3, même répartition de formats que exam-1 (item 5), mais contenu et thématique
-- alignés sur le niveau et le thème propres à chaque examen (précisés par Olivier) :
--   exam-2 : Niveau B1 - Vie professionnelle & recherche d'emploi
--   exam-3 : Niveau B1-B2 - Vie sociale, santé, logement
--
-- Répartition identique à exam-1 : 4 court / 4 trous (2 textes x 2 lacunes) / 2 multi_texte
-- / 5 long_admin / 5 article_presse. Contenu 100% original.

DO $$
DECLARE
  v_exam2_id uuid;
  v_exam3_id uuid;
BEGIN
  SELECT id INTO v_exam2_id FROM public.exams WHERE slug = 'exam-2';
  SELECT id INTO v_exam3_id FROM public.exams WHERE slug = 'exam-3';

  IF v_exam2_id IS NULL THEN
    RAISE EXCEPTION 'Exam with slug exam-2 not found';
  END IF;
  IF v_exam3_id IS NULL THEN
    RAISE EXCEPTION 'Exam with slug exam-3 not found';
  END IF;

  DELETE FROM public.exam_questions WHERE exam_id = v_exam2_id AND section = 'CE';
  DELETE FROM public.exam_questions WHERE exam_id = v_exam3_id AND section = 'CE';

  -- =========================================================================
  -- EXAM-2 — Niveau B1 — Vie professionnelle & recherche d'emploi
  -- =========================================================================

  -- COURT (20-23)
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam2_id, 'CE', 20, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'L''agence Intérim Plus recrute des manutentionnaires pour la période des fêtes, du 1er au 24 décembre. Permis B souhaité, formation assurée sur place.',
    'Quel document est souhaité pour ce poste ?',
    ARRAY['A) Un CV détaillé','B) Le permis de conduire','C) Un diplôme universitaire','D) Une lettre de motivation'], 'B', 'court'),
  (v_exam2_id, 'CE', 21, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Votre entretien d''embauche est confirmé pour le mardi 15 à 10h dans nos locaux. Merci de vous munir d''une pièce d''identité et d''apporter deux exemplaires de votre CV.',
    'Que doit apporter le candidat le jour de l''entretien ?',
    ARRAY['A) Un chèque de caution','B) Une pièce d''identité et deux CV','C) Un contrat signé','D) Une attestation Pôle emploi'], 'B', 'court'),
  (v_exam2_id, 'CE', 22, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'La convention collective de la branche prévoit une prime d''ancienneté à partir de trois ans de présence dans l''entreprise, versée automatiquement chaque mois.',
    'À partir de quand un salarié touche-t-il la prime d''ancienneté ?',
    ARRAY['A) Dès son embauche','B) Après trois ans','C) Après cinq ans','D) Uniquement sur demande'], 'B', 'court'),
  (v_exam2_id, 'CE', 23, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Le service des ressources humaines informe le personnel que les entretiens annuels d''évaluation se dérouleront entre le 3 et le 21 mars. Un créneau sera proposé par email à chaque salarié.',
    'Comment les salariés seront-ils informés de leur créneau d''entretien ?',
    ARRAY['A) Par affichage','B) Par téléphone','C) Par email','D) Lors d''une réunion générale'], 'C', 'court');

  -- TROUS (24-27)
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format, highlight_gap)
  VALUES
  (v_exam2_id, 'CE', 24, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Suite à votre annonce parue sur le site de l''entreprise, je me ___________ (1) auprès de vous pour le poste d''assistant commercial. Fort de trois années d''expérience dans un poste similaire, je suis convaincu de pouvoir rapidement m''___________ (2) à votre équipe.',
    '(1)',
    ARRAY['A) permets','B) présente','C) excuse','D) réjouis'], 'B', 'trous', 1),
  (v_exam2_id, 'CE', 25, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Suite à votre annonce parue sur le site de l''entreprise, je me ___________ (1) auprès de vous pour le poste d''assistant commercial. Fort de trois années d''expérience dans un poste similaire, je suis convaincu de pouvoir rapidement m''___________ (2) à votre équipe.',
    '(2)',
    ARRAY['A) adapter','B) opposer','C) éloigner','D) excuser'], 'A', 'trous', 2),
  (v_exam2_id, 'CE', 26, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Le taux de chômage continue de ___________ (1) dans le secteur du numérique, où les entreprises peinent à ___________ (2) des profils qualifiés malgré des salaires attractifs.',
    '(1)',
    ARRAY['A) augmenter','B) baisser','C) stagner','D) exploser'], 'B', 'trous', 1),
  (v_exam2_id, 'CE', 27, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Le taux de chômage continue de ___________ (1) dans le secteur du numérique, où les entreprises peinent à ___________ (2) des profils qualifiés malgré des salaires attractifs.',
    '(2)',
    ARRAY['A) recruter','B) licencier','C) former','D) ignorer'], 'A', 'trous', 2);

  -- MULTI_TEXTE (28-29)
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, question, options, correct_answer, ce_format, sub_texts)
  VALUES
  (v_exam2_id, 'CE', 28, 'text', 'Lisez les documents et répondez à la question.',
    'Quelle offre exige la maîtrise de l''anglais ?',
    ARRAY['A) Offre 1','B) Offre 2','C) Offre 3','D) Offre 4'], 'A', 'multi_texte',
    '[
      {"label": "Offre 1", "content": "Traducteur juridique (h/f), CDI, maîtrise de l''anglais indispensable, expérience en cabinet d''avocats appréciée."},
      {"label": "Offre 2", "content": "Magasinier (h/f), CDD 3 mois, port de charges, permis CACES apprécié."},
      {"label": "Offre 3", "content": "Assistant comptable (h/f), CDI, maîtrise d''Excel exigée, poste basé à Lyon."},
      {"label": "Offre 4", "content": "Chauffeur-livreur (h/f), CDI temps plein, permis B obligatoire depuis plus de 2 ans."}
    ]'::jsonb),
  (v_exam2_id, 'CE', 29, 'text', 'Lisez les documents et répondez à la question.',
    'Quel candidat peut commencer à travailler le plus rapidement, avec de l''expérience en gestion de projet ?',
    ARRAY['A) Candidat 1','B) Candidat 2','C) Candidat 3','D) Candidat 4'], 'A', 'multi_texte',
    '[
      {"label": "Candidat 1", "content": "5 ans d''expérience en gestion de projet, anglais courant, disponible immédiatement."},
      {"label": "Candidat 2", "content": "Débutant, diplômé en communication, très bon niveau rédactionnel, disponible dans un mois."},
      {"label": "Candidat 3", "content": "10 ans d''expérience en comptabilité, maîtrise des logiciels SAP, disponible sous préavis de 3 mois."},
      {"label": "Candidat 4", "content": "3 ans d''expérience en vente, permis B, véhicule personnel, disponible immédiatement."}
    ]'::jsonb);

  -- LONG_ADMIN (30-34)
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam2_id, 'CE', 30, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le présent avenant au contrat de travail a pour objet de modifier la durée hebdomadaire de travail de Madame Dubois, actuellement fixée à 35 heures, qui passera à 28 heures à compter du 1er septembre, à sa demande.\n\nCette modification n''entraîne aucun changement de qualification ni de rémunération horaire. La salariée conserve l''ensemble de ses droits à congés payés, calculés au prorata du nouveau temps de travail.',
    'Que change cet avenant ?',
    ARRAY['A) Le salaire horaire','B) La durée hebdomadaire de travail','C) Le poste occupé','D) Le lieu de travail'], 'B', 'long_admin'),
  (v_exam2_id, 'CE', 31, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le présent avenant au contrat de travail a pour objet de modifier la durée hebdomadaire de travail de Madame Dubois, actuellement fixée à 35 heures, qui passera à 28 heures à compter du 1er septembre, à sa demande.\n\nCette modification n''entraîne aucun changement de qualification ni de rémunération horaire. La salariée conserve l''ensemble de ses droits à congés payés, calculés au prorata du nouveau temps de travail.',
    'Qui est à l''origine de cette modification ?',
    ARRAY['A) L''employeur','B) L''inspection du travail','C) La salariée elle-même','D) Le syndicat'], 'C', 'long_admin'),
  (v_exam2_id, 'CE', 32, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'France Travail vous informe que vous êtes convoqué le 22 avril à 14h pour un entretien de suivi dans le cadre de votre recherche d''emploi. Cet entretien est obligatoire et vise à faire le point sur vos démarches.\n\nEn cas d''absence non justifiée, votre dossier pourra faire l''objet d''une radiation temporaire de la liste des demandeurs d''emploi. Merci de vous munir de votre justificatif d''identité.',
    'Que se passe-t-il en cas d''absence non justifiée ?',
    ARRAY['A) Rien de particulier','B) Une radiation temporaire est possible','C) Une amende est appliquée','D) Un nouvel entretien est automatiquement fixé'], 'B', 'long_admin'),
  (v_exam2_id, 'CE', 33, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'France Travail vous informe que vous êtes convoqué le 22 avril à 14h pour un entretien de suivi dans le cadre de votre recherche d''emploi. Cet entretien est obligatoire et vise à faire le point sur vos démarches.\n\nEn cas d''absence non justifiée, votre dossier pourra faire l''objet d''une radiation temporaire de la liste des demandeurs d''emploi. Merci de vous munir de votre justificatif d''identité.',
    'Quel document faut-il apporter à l''entretien ?',
    ARRAY['A) Un CV','B) Un justificatif d''identité','C) Un relevé bancaire','D) Une lettre de motivation'], 'B', 'long_admin'),
  (v_exam2_id, 'CE', 34, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Note interne — Direction des ressources humaines\n\nDans le cadre de la mise en place du télétravail, chaque salarié éligible devra signer une charte précisant les jours de présence obligatoire au bureau, fixés à deux jours minimum par semaine.',
    'Combien de jours de présence au bureau sont exigés au minimum ?',
    ARRAY['A) Un jour','B) Deux jours','C) Trois jours','D) Aucun'], 'B', 'long_admin');

  -- ARTICLE_PRESSE (35-39)
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam2_id, 'CE', 35, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'De nombreux secteurs peinent aujourd''hui à recruter, notamment la restauration et le bâtiment, malgré des offres d''emploi en nette augmentation. Les employeurs pointent du doigt un manque de candidats formés aux métiers manuels.\n\nPour attirer de nouveaux profils, certaines entreprises proposent désormais des formations internes rémunérées, permettant à des candidats sans expérience d''apprendre le métier tout en étant salariés dès le premier jour.',
    'Quels secteurs sont cités comme ayant des difficultés de recrutement ?',
    ARRAY['A) Le numérique et la finance','B) La restauration et le bâtiment','C) L''éducation et la santé','D) Le commerce en ligne'], 'B', 'article_presse'),
  (v_exam2_id, 'CE', 36, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'De nombreux secteurs peinent aujourd''hui à recruter, notamment la restauration et le bâtiment, malgré des offres d''emploi en nette augmentation. Les employeurs pointent du doigt un manque de candidats formés aux métiers manuels.\n\nPour attirer de nouveaux profils, certaines entreprises proposent désormais des formations internes rémunérées, permettant à des candidats sans expérience d''apprendre le métier tout en étant salariés dès le premier jour.',
    'Comment certaines entreprises attirent-elles de nouveaux candidats ?',
    ARRAY['A) En augmentant les salaires uniquement','B) En proposant des formations internes rémunérées','C) En réduisant le temps de travail','D) En supprimant les entretiens d''embauche'], 'B', 'article_presse'),
  (v_exam2_id, 'CE', 37, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'De plus en plus d''actifs choisissent de se reconvertir en cours de carrière, souvent après plusieurs années dans un même secteur. Le compte personnel de formation permet de financer tout ou partie de ces nouveaux parcours.\n\nLes métiers manuels et artisanaux séduisent particulièrement les candidats à la reconversion, en quête de sens et d''un travail plus concret que celui exercé auparavant.',
    'Qu''est-ce qui permet de financer une reconversion professionnelle ?',
    ARRAY['A) Le compte personnel de formation','B) Une aide de la mairie','C) Un prêt bancaire uniquement','D) L''assurance chômage exclusivement'], 'A', 'article_presse'),
  (v_exam2_id, 'CE', 38, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'De plus en plus d''actifs choisissent de se reconvertir en cours de carrière, souvent après plusieurs années dans un même secteur. Le compte personnel de formation permet de financer tout ou partie de ces nouveaux parcours.\n\nLes métiers manuels et artisanaux séduisent particulièrement les candidats à la reconversion, en quête de sens et d''un travail plus concret que celui exercé auparavant.',
    'Quels métiers attirent particulièrement les candidats à la reconversion ?',
    ARRAY['A) Les métiers du numérique','B) Les métiers manuels et artisanaux','C) Les métiers de la finance','D) Les métiers de la fonction publique'], 'B', 'article_presse'),
  (v_exam2_id, 'CE', 39, 'text', 'Lisez attentivement l''article et répondez à la question.',
    'Un job dating organisé la semaine dernière dans la métropole a permis à une trentaine de candidats de rencontrer directement des recruteurs de plusieurs entreprises locales, sans passer par un CV classique.',
    'Comment les candidats ont-ils pu rencontrer les recruteurs ?',
    ARRAY['A) Uniquement par CV','B) Lors d''un job dating','C) Par candidature spontanée','D) Via une agence d''intérim'], 'B', 'article_presse');

  -- =========================================================================
  -- EXAM-3 — Niveau B1-B2 — Vie sociale, santé, logement
  -- =========================================================================

  -- COURT (20-23)
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam3_id, 'CE', 20, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Le centre médical du quartier propose désormais des rendez-vous en téléconsultation pour les renouvellements d''ordonnance, sans avance de frais pour les patients en ALD.',
    'Qui bénéficie de la téléconsultation sans avance de frais ?',
    ARRAY['A) Tous les patients','B) Les patients en ALD','C) Les enfants uniquement','D) Les personnes âgées uniquement'], 'B', 'court'),
  (v_exam3_id, 'CE', 21, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'La résidence Les Glycines dispose encore de deux appartements T3 disponibles à la location, avec parking privatif inclus dans le loyer.',
    'Qu''est-ce qui est inclus dans le loyer ?',
    ARRAY['A) L''électricité','B) Le parking privatif','C) Internet','D) Les charges de copropriété'], 'B', 'court'),
  (v_exam3_id, 'CE', 22, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'L''association de quartier organise un vide-grenier solidaire le premier samedi de chaque mois, les bénéfices étant reversés à une association d''aide alimentaire.',
    'Où vont les bénéfices du vide-grenier ?',
    ARRAY['A) À la mairie','B) À une association d''aide alimentaire','C) Aux organisateurs','D) À l''école du quartier'], 'B', 'court'),
  (v_exam3_id, 'CE', 23, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'La pharmacie de garde ce week-end est celle du boulevard Voltaire, ouverte de 9h à 20h le samedi et de 10h à 13h le dimanche.',
    'Quels sont les horaires d''ouverture le dimanche ?',
    ARRAY['A) 9h-20h','B) 10h-13h','C) Fermé','D) 24h/24'], 'B', 'court');

  -- TROUS (24-27)
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format, highlight_gap)
  VALUES
  (v_exam3_id, 'CE', 24, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Votre mutuelle vous ___________ (1) le remboursement de vos frais d''optique dans la limite de 150 euros par an. Pour en bénéficier, il suffit de nous ___________ (2) votre facture accompagnée de votre ordonnance.',
    '(1)',
    ARRAY['A) garantit','B) refuse','C) annule','D) ignore'], 'A', 'trous', 1),
  (v_exam3_id, 'CE', 25, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Votre mutuelle vous ___________ (1) le remboursement de vos frais d''optique dans la limite de 150 euros par an. Pour en bénéficier, il suffit de nous ___________ (2) votre facture accompagnée de votre ordonnance.',
    '(2)',
    ARRAY['A) cacher','B) transmettre','C) vendre','D) détruire'], 'B', 'trous', 2),
  (v_exam3_id, 'CE', 26, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Le nouveau règlement de copropriété ___________ (1) désormais l''installation de bacs à compost individuels sur les balcons, afin de ___________ (2) le tri des déchets organiques dans l''immeuble.',
    '(1)',
    ARRAY['A) interdit','B) autorise','C) ignore','D) déconseille'], 'B', 'trous', 1),
  (v_exam3_id, 'CE', 27, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Le nouveau règlement de copropriété ___________ (1) désormais l''installation de bacs à compost individuels sur les balcons, afin de ___________ (2) le tri des déchets organiques dans l''immeuble.',
    '(2)',
    ARRAY['A) freiner','B) encourager','C) supprimer','D) compliquer'], 'B', 'trous', 2);

  -- MULTI_TEXTE (28-29)
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, question, options, correct_answer, ce_format, sub_texts)
  VALUES
  (v_exam3_id, 'CE', 28, 'text', 'Lisez les documents et répondez à la question.',
    'Quel cabinet accueille les patients sans rendez-vous le week-end ?',
    ARRAY['A) Cabinet 1','B) Cabinet 2','C) Cabinet 3','D) Cabinet 4'], 'B', 'multi_texte',
    '[
      {"label": "Cabinet 1", "content": "Médecine générale, sur rendez-vous uniquement, du lundi au vendredi 9h-18h."},
      {"label": "Cabinet 2", "content": "Urgences dentaires, accueil sans rendez-vous le samedi matin de 9h à 12h."},
      {"label": "Cabinet 3", "content": "Kinésithérapie, sur rendez-vous, fermé le week-end."},
      {"label": "Cabinet 4", "content": "Ophtalmologie, sur rendez-vous uniquement, délai d''attente de 2 mois."}
    ]'::jsonb),
  (v_exam3_id, 'CE', 29, 'text', 'Lisez les documents et répondez à la question.',
    'Quel logement convient le mieux à une famille avec deux enfants scolarisés ?',
    ARRAY['A) Logement 1','B) Logement 2','C) Logement 3','D) Logement 4'], 'B', 'multi_texte',
    '[
      {"label": "Logement 1", "content": "T2, centre-ville, proche commerces, 5e étage sans ascenseur."},
      {"label": "Logement 2", "content": "T4, quartier résidentiel calme, école à 200 mètres, jardin partagé."},
      {"label": "Logement 3", "content": "Studio meublé, proche université, idéal étudiant."},
      {"label": "Logement 4", "content": "T3, en périphérie, 15 minutes en voiture des commerces les plus proches."}
    ]'::jsonb);

  -- LONG_ADMIN (30-34)
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam3_id, 'CE', 30, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'La Caisse Primaire d''Assurance Maladie vous informe que votre dossier de prise en charge à 100% au titre d''une affection de longue durée a été accepté pour une durée de cinq ans, renouvelable sur avis de votre médecin traitant.\n\nCette prise en charge concerne l''ensemble des soins, examens et traitements directement liés à votre pathologie. Les soins sans lien avec l''affection reconnue restent remboursés selon le régime habituel.',
    'Pour combien de temps la prise en charge est-elle accordée ?',
    ARRAY['A) Un an','B) Cinq ans','C) À vie','D) Trois mois'], 'B', 'long_admin'),
  (v_exam3_id, 'CE', 31, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'La Caisse Primaire d''Assurance Maladie vous informe que votre dossier de prise en charge à 100% au titre d''une affection de longue durée a été accepté pour une durée de cinq ans, renouvelable sur avis de votre médecin traitant.\n\nCette prise en charge concerne l''ensemble des soins, examens et traitements directement liés à votre pathologie. Les soins sans lien avec l''affection reconnue restent remboursés selon le régime habituel.',
    'Que se passe-t-il pour les soins sans lien avec la pathologie reconnue ?',
    ARRAY['A) Ils ne sont plus remboursés du tout','B) Ils restent remboursés selon le régime habituel','C) Ils sont pris en charge à 100% aussi','D) Ils nécessitent une nouvelle demande'], 'B', 'long_admin'),
  (v_exam3_id, 'CE', 32, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le présent contrat de location est conclu pour une durée de trois ans, renouvelable par tacite reconduction. Le dépôt de garantie, équivalent à un mois de loyer hors charges, sera restitué dans un délai maximal de deux mois après la remise des clés, déduction faite des éventuelles réparations locatives.\n\nToute dégradation constatée lors de l''état des lieux de sortie devra être justifiée par des photographies datées, faute de quoi le locataire ne pourra les contester.',
    'Dans quel délai le dépôt de garantie est-il restitué ?',
    ARRAY['A) Immédiatement','B) Deux mois maximum','C) Six mois','D) Un an'], 'B', 'long_admin'),
  (v_exam3_id, 'CE', 33, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le présent contrat de location est conclu pour une durée de trois ans, renouvelable par tacite reconduction. Le dépôt de garantie, équivalent à un mois de loyer hors charges, sera restitué dans un délai maximal de deux mois après la remise des clés, déduction faite des éventuelles réparations locatives.\n\nToute dégradation constatée lors de l''état des lieux de sortie devra être justifiée par des photographies datées, faute de quoi le locataire ne pourra les contester.',
    'Comment une dégradation doit-elle être justifiée ?',
    ARRAY['A) Par un témoin','B) Par des photographies datées','C) Par une déclaration sur l''honneur','D) Par un constat d''huissier obligatoire'], 'B', 'long_admin'),
  (v_exam3_id, 'CE', 34, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le centre de vaccination municipal informe les habitants de plus de 65 ans qu''une campagne de vaccination contre la grippe saisonnière débutera le 15 octobre. La prise de rendez-vous se fait uniquement en ligne, via le site de la mairie.',
    'Comment prendre rendez-vous pour la vaccination ?',
    ARRAY['A) Par téléphone','B) En ligne uniquement','C) Directement sur place','D) Par courrier'], 'B', 'long_admin');

  -- ARTICLE_PRESSE (35-39)
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam3_id, 'CE', 35, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Le prix des loyers continue de grimper dans les grandes métropoles françaises, rendant l''accès au logement de plus en plus difficile pour les jeunes actifs. Certaines villes moyennes, en revanche, voient leur attractivité augmenter grâce à des loyers plus abordables et un cadre de vie jugé plus agréable.\n\nCe phénomène, accéléré par la généralisation du télétravail, pousse de nombreux ménages à quitter les grandes agglomérations pour s''installer dans des villes de taille intermédiaire.',
    'Que se passe-t-il avec les loyers dans les grandes métropoles ?',
    ARRAY['A) Ils baissent','B) Ils continuent d''augmenter','C) Ils restent stables','D) Ils sont supprimés'], 'B', 'article_presse'),
  (v_exam3_id, 'CE', 36, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Le prix des loyers continue de grimper dans les grandes métropoles françaises, rendant l''accès au logement de plus en plus difficile pour les jeunes actifs. Certaines villes moyennes, en revanche, voient leur attractivité augmenter grâce à des loyers plus abordables et un cadre de vie jugé plus agréable.\n\nCe phénomène, accéléré par la généralisation du télétravail, pousse de nombreux ménages à quitter les grandes agglomérations pour s''installer dans des villes de taille intermédiaire.',
    'Qu''est-ce qui accélère le départ des ménages vers les villes moyennes ?',
    ARRAY['A) La hausse des impôts locaux','B) La généralisation du télétravail','C) La fermeture des écoles','D) Le manque de transports'], 'B', 'article_presse'),
  (v_exam3_id, 'CE', 37, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'De plus en plus de Français consultent un psychologue, une pratique longtemps considérée comme taboue mais aujourd''hui davantage acceptée socialement. Depuis 2022, un dispositif permet même de bénéficier de séances remboursées par l''Assurance Maladie, sur orientation du médecin traitant.\n\nLes associations spécialisées notent toutefois que les délais d''attente restent longs dans certaines régions, en particulier pour les jeunes patients.',
    'Depuis quand certaines séances de psychologue sont-elles remboursées ?',
    ARRAY['A) Depuis 2022','B) Depuis 2010','C) Depuis toujours','D) Ce n''est pas encore le cas'], 'A', 'article_presse'),
  (v_exam3_id, 'CE', 38, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'De plus en plus de Français consultent un psychologue, une pratique longtemps considérée comme taboue mais aujourd''hui davantage acceptée socialement. Depuis 2022, un dispositif permet même de bénéficier de séances remboursées par l''Assurance Maladie, sur orientation du médecin traitant.\n\nLes associations spécialisées notent toutefois que les délais d''attente restent longs dans certaines régions, en particulier pour les jeunes patients.',
    'Quel problème persiste selon les associations spécialisées ?',
    ARRAY['A) Le manque de psychologues','B) Les délais d''attente longs','C) Le coût trop élevé','D) Le manque d''information'], 'B', 'article_presse'),
  (v_exam3_id, 'CE', 39, 'text', 'Lisez attentivement l''article et répondez à la question.',
    'Un nouveau jardin partagé a ouvert ses portes dans le quartier des Écoles, permettant aux habitants de cultiver des légumes en commun tout en créant du lien entre voisins de tous âges.',
    'Quel est l''objectif principal de ce jardin partagé ?',
    ARRAY['A) Vendre des légumes','B) Créer du lien entre voisins','C) Former des jardiniers professionnels','D) Réduire les impôts locaux'], 'B', 'article_presse');

END $$;
