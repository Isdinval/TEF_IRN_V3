-- Recalibration qualité CE — exam-3 (B1-B2, vie sociale, santé, logement).
-- Applique les 8 règles de docs/ce-content-calibration-rules.md dès la conception initiale.
-- Niveau B1-B2 (règle 6) : questions de synthèse/fonction plus fréquentes sur article_presse,
-- distracteurs avec nuance (ex. "avancée positive mais limitée" plutôt qu'un jugement tranché).
--
-- Même répartition de formats (4/4/2/5/5=20), order_index 20-39.

DO $$
DECLARE
  v_exam_id uuid;
BEGIN
  SELECT id INTO v_exam_id FROM public.exams WHERE slug = 'exam-3';

  IF v_exam_id IS NULL THEN
    RAISE EXCEPTION 'Exam with slug exam-3 not found';
  END IF;

  DELETE FROM public.exam_questions WHERE exam_id = v_exam_id AND section = 'CE';

  -- ===================== COURT — 4 questions (order_index 20-23) =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 20, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Le centre médical du quartier propose désormais des rendez-vous en téléconsultation pour le renouvellement d''ordonnances courantes, sans avance de frais pour les patients bénéficiant d''une prise en charge à 100%.',
    'Qui peut bénéficier de la téléconsultation sans avance de frais ?',
    ARRAY['A) Tous les patients du quartier','B) Les patients pris en charge à 100%','C) Uniquement les enfants','D) Les personnes de plus de 70 ans'], 'B', 'court'),
  (v_exam_id, 'CE', 21, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'La résidence Les Glycines propose deux appartements de type T3 encore disponibles à la location. Le stationnement, réservé aux locataires, est compris dans le montant du loyer mensuel.',
    'Que comprend le loyer mensuel de ces appartements ?',
    ARRAY['A) Les charges d''électricité','B) Une place de stationnement','C) Un accès à internet','D) L''entretien des parties communes'], 'B', 'court'),
  (v_exam_id, 'CE', 22, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'L''association du quartier organise chaque premier samedi du mois un vide-grenier dont l''intégralité des bénéfices est reversée à une structure locale de distribution alimentaire.',
    'Que devient l''argent récolté lors du vide-grenier ?',
    ARRAY['A) Il finance les activités de l''association','B) Il est reversé à une structure d''aide alimentaire','C) Il sert à payer les organisateurs','D) Il est redistribué à la mairie'], 'B', 'court'),
  (v_exam_id, 'CE', 23, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Ce week-end, la pharmacie assurant la garde est celle du boulevard Voltaire. Elle reste accessible toute la journée du samedi, mais ses horaires sont réduits le dimanche, de 10h à 13h uniquement.',
    'Quels sont les horaires d''ouverture de la pharmacie de garde le dimanche ?',
    ARRAY['A) Toute la journée','B) De 10h à 13h seulement','C) Fermée toute la journée','D) Uniquement le matin avant 9h'], 'B', 'court');

  -- ===================== TROUS — texte à trous (24-25) + 2 phrases à trous (26-27) =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format, highlight_gap)
  VALUES
  (v_exam_id, 'CE', 24, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Votre mutuelle vous ___________ (1) le remboursement de vos frais d''optique, dans la limite de 150 euros par an. Pour ___________ (2) ce remboursement, il suffit de nous transmettre votre facture accompagnée de l''ordonnance correspondante.',
    '(1)',
    ARRAY['A) garantit','B) refuse','C) annule','D) ignore'], 'A', 'trous', 1),
  (v_exam_id, 'CE', 25, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Votre mutuelle vous ___________ (1) le remboursement de vos frais d''optique, dans la limite de 150 euros par an. Pour ___________ (2) ce remboursement, il suffit de nous transmettre votre facture accompagnée de l''ordonnance correspondante.',
    '(2)',
    ARRAY['A) obtenir','B) refuser','C) annuler','D) effacer'], 'A', 'trous', 2);

  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format, highlight_gap)
  VALUES
  (v_exam_id, 'CE', 26, 'text', 'Lisez la phrase et choisissez le mot qui la complète.',
    'Le médecin a conseillé au patient de ___________ (1) un rendez-vous chez un spécialiste dans les meilleurs délais.',
    '(1)',
    ARRAY['A) prendre','B) annuler','C) manquer','D) reporter'], 'A', 'trous', 1),
  (v_exam_id, 'CE', 27, 'text', 'Lisez la phrase et choisissez le mot qui la complète.',
    'Le locataire doit ___________ (1) son propriétaire de tout dégât constaté dans le logement.',
    '(1)',
    ARRAY['A) informer','B) ignorer','C) accuser','D) remercier'], 'A', 'trous', 1);

  -- ===================== MULTI_TEXTE — 2 questions (order_index 28-29) =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, question, options, correct_answer, ce_format, sub_texts)
  VALUES
  (v_exam_id, 'CE', 28, 'text', 'Lisez les documents et répondez à la question.',
    'J''ai une douleur dentaire un samedi et je n''ai pas de rendez-vous. Quel cabinet puis-je contacter ?',
    ARRAY['A) Cabinet 1','B) Cabinet 2','C) Cabinet 3','D) Cabinet 4'], 'B', 'multi_texte',
    '[
      {"label": "Cabinet 1", "content": "Médecine générale, uniquement sur rendez-vous, du lundi au vendredi de 9h à 18h."},
      {"label": "Cabinet 2", "content": "Soins dentaires d''urgence, accueil possible sans rendez-vous le samedi matin de 9h à 12h."},
      {"label": "Cabinet 3", "content": "Kinésithérapie, sur rendez-vous exclusivement, fermé le week-end."},
      {"label": "Cabinet 4", "content": "Ophtalmologie, sur rendez-vous uniquement, délai d''attente d''environ deux mois."}
    ]'::jsonb),
  (v_exam_id, 'CE', 29, 'text', 'Lisez les documents et répondez à la question.',
    'Je cherche un logement adapté à une famille avec deux jeunes enfants scolarisés, avec un espace extérieur. Lequel me conviendrait le mieux ?',
    ARRAY['A) Logement 1','B) Logement 2','C) Logement 3','D) Logement 4'], 'B', 'multi_texte',
    '[
      {"label": "Logement 1", "content": "T2, centre-ville, proche des commerces, situé au 5e étage sans ascenseur."},
      {"label": "Logement 2", "content": "T4, quartier résidentiel calme, école à proximité immédiate, jardin partagé."},
      {"label": "Logement 3", "content": "Studio meublé, proche du campus universitaire, idéal pour un étudiant."},
      {"label": "Logement 4", "content": "T3, en périphérie, à environ 15 minutes en voiture des commerces les plus proches."}
    ]'::jsonb);

  -- ===================== LONG_ADMIN — règle 8 : 1 générale + 1 précise par document =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 30, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'La Caisse Primaire d''Assurance Maladie vous informe que votre demande de prise en charge à 100% au titre d''une affection de longue durée a été acceptée pour une période de cinq ans, renouvelable sur avis de votre médecin traitant.\n\nCette prise en charge couvre l''ensemble des soins, examens et traitements en lien direct avec la pathologie reconnue. Les soins sans rapport avec cette affection continuent d''être remboursés selon les modalités habituelles.',
    'Quel est l''objet principal de ce courrier ?',
    ARRAY['A) Refuser une demande de remboursement','B) Confirmer une prise en charge à taux plein pour une durée déterminée','C) Informer d''un changement de médecin traitant','D) Annoncer la fin des remboursements habituels'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 31, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'La Caisse Primaire d''Assurance Maladie vous informe que votre demande de prise en charge à 100% au titre d''une affection de longue durée a été acceptée pour une période de cinq ans, renouvelable sur avis de votre médecin traitant.\n\nCette prise en charge couvre l''ensemble des soins, examens et traitements en lien direct avec la pathologie reconnue. Les soins sans rapport avec cette affection continuent d''être remboursés selon les modalités habituelles.',
    'Que se passe-t-il pour les soins sans lien avec la pathologie reconnue ?',
    ARRAY['A) Ils ne sont plus remboursés du tout','B) Ils restent remboursés selon le régime habituel','C) Ils sont aussi pris en charge à 100%','D) Ils nécessitent une nouvelle demande'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 32, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le présent contrat de location est conclu pour une durée de trois ans, renouvelable par tacite reconduction sauf préavis contraire. Le dépôt de garantie, équivalent à un mois de loyer hors charges, sera restitué dans un délai maximal de deux mois après la remise des clés, déduction faite des éventuelles réparations locatives.\n\nToute dégradation constatée lors de l''état des lieux de sortie devra être justifiée par des photographies datées, faute de quoi le locataire ne pourra la contester.',
    'Quel est l''objet principal de ce document ?',
    ARRAY['A) Fixer les conditions de location et de restitution du dépôt de garantie','B) Annoncer une augmentation de loyer','C) Informer d''une résiliation du bail','D) Détailler les charges locatives mensuelles'], 'A', 'long_admin'),
  (v_exam_id, 'CE', 33, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le présent contrat de location est conclu pour une durée de trois ans, renouvelable par tacite reconduction sauf préavis contraire. Le dépôt de garantie, équivalent à un mois de loyer hors charges, sera restitué dans un délai maximal de deux mois après la remise des clés, déduction faite des éventuelles réparations locatives.\n\nToute dégradation constatée lors de l''état des lieux de sortie devra être justifiée par des photographies datées, faute de quoi le locataire ne pourra la contester.',
    'Comment une dégradation doit-elle être justifiée lors de l''état des lieux ?',
    ARRAY['A) Par un témoignage oral','B) Par des photographies datées','C) Par une déclaration sur l''honneur','D) Par un constat d''huissier obligatoire'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 34, 'text', 'Lisez attentivement le document et répondez à la question.',
    'Le centre de vaccination municipal informe les habitants âgés de plus de 65 ans qu''une campagne de vaccination contre la grippe saisonnière débutera le 15 octobre. La prise de rendez-vous s''effectue exclusivement via le site internet de la mairie.',
    'Comment les habitants concernés doivent-ils prendre rendez-vous ?',
    ARRAY['A) Par téléphone','B) Uniquement en ligne','C) Directement sur place','D) Par courrier postal'], 'B', 'long_admin');

  -- ===================== ARTICLE_PRESSE — 5 questions (order_index 35-39) =====================
  -- Niveau B1-B2 : questions de synthèse privilégiées (règle 6), distracteurs nuancés.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 35, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Le montant des loyers ne cesse de grimper dans les grandes métropoles françaises, rendant l''accès à un premier logement de plus en plus difficile pour les jeunes actifs. À l''inverse, certaines villes moyennes gagnent en attractivité, portées par des loyers plus abordables et un cadre de vie jugé plus agréable.\n\nCe mouvement, accéléré par la généralisation du télétravail, pousse un nombre croissant de ménages à quitter les grandes agglomérations pour s''installer dans des villes de taille intermédiaire.',
    'Que révèle cet article sur l''évolution du marché du logement ?',
    ARRAY['A) Les loyers baissent partout en France','B) Les grandes villes deviennent plus accessibles aux jeunes actifs','C) Un rééquilibrage s''opère entre grandes métropoles et villes moyennes','D) Le télétravail a fait disparaître la demande de logement'], 'C', 'article_presse'),
  (v_exam_id, 'CE', 36, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Le montant des loyers ne cesse de grimper dans les grandes métropoles françaises, rendant l''accès à un premier logement de plus en plus difficile pour les jeunes actifs. À l''inverse, certaines villes moyennes gagnent en attractivité, portées par des loyers plus abordables et un cadre de vie jugé plus agréable.\n\nCe mouvement, accéléré par la généralisation du télétravail, pousse un nombre croissant de ménages à quitter les grandes agglomérations pour s''installer dans des villes de taille intermédiaire.',
    'Qu''est-ce qui explique en partie ce mouvement vers les villes moyennes ?',
    ARRAY['A) La fermeture des grandes entreprises','B) La généralisation du télétravail','C) La hausse des impôts locaux dans les métropoles','D) Une politique gouvernementale de délocalisation'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 37, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'De plus en plus de Français franchissent le pas de consulter un psychologue, une démarche longtemps taboue mais aujourd''hui plus largement acceptée. Depuis 2022, un dispositif permet à certains patients de bénéficier de séances remboursées par l''Assurance Maladie, sur orientation du médecin traitant.\n\nLes associations spécialisées saluent cette avancée, tout en pointant des délais d''attente qui restent importants dans plusieurs régions, en particulier pour les patients les plus jeunes.',
    'Quel bilan les associations spécialisées dressent-elles de ce dispositif ?',
    ARRAY['A) Un échec total à corriger','B) Une avancée positive mais encore limitée par les délais','C) Un dispositif inutile pour les jeunes patients','D) Une mesure réservée aux grandes villes'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 38, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'De plus en plus de Français franchissent le pas de consulter un psychologue, une démarche longtemps taboue mais aujourd''hui plus largement acceptée. Depuis 2022, un dispositif permet à certains patients de bénéficier de séances remboursées par l''Assurance Maladie, sur orientation du médecin traitant.\n\nLes associations spécialisées saluent cette avancée, tout en pointant des délais d''attente qui restent importants dans plusieurs régions, en particulier pour les patients les plus jeunes.',
    'Depuis quand ce dispositif de remboursement existe-t-il ?',
    ARRAY['A) Depuis 2010','B) Depuis 2022','C) Il n''existe pas encore','D) Depuis toujours'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 39, 'text', 'Lisez attentivement l''article et répondez à la question.',
    'Un nouveau jardin partagé vient d''ouvrir dans le quartier des Écoles, offrant aux habitants la possibilité de cultiver des légumes en commun tout en favorisant les échanges entre voisins de tous âges.',
    'Quel est l''objectif principal de ce jardin partagé ?',
    ARRAY['A) Vendre des légumes aux habitants','B) Créer du lien social entre voisins','C) Former des jardiniers professionnels','D) Réduire les impôts locaux'], 'B', 'article_presse');

END $$;
