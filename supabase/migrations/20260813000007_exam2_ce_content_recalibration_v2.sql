-- Recalibration qualité CE — exam-2 (B1, vie professionnelle & recherche d'emploi).
-- Applique les 8 règles de docs/ce-content-calibration-rules.md dès la conception initiale
-- (contrairement à exam-1 qui a nécessité une révision ultérieure pour les règles 7-8) :
--   - trous : mix texte à trous (2 lacunes partagées) + 2 phrases à trous indépendantes
--   - long_admin : 1 question générale (message principal/objet) + 1 précise par document
--
-- Même répartition de formats (4/4/2/5/5=20), order_index 20-39.

DO $$
DECLARE
  v_exam_id uuid;
BEGIN
  SELECT id INTO v_exam_id FROM public.exams WHERE slug = 'exam-2';

  IF v_exam_id IS NULL THEN
    RAISE EXCEPTION 'Exam with slug exam-2 not found';
  END IF;

  DELETE FROM public.exam_questions WHERE exam_id = v_exam_id AND section = 'CE';

  -- ===================== COURT — 4 questions (order_index 20-23) =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 20, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'L''agence Intérim Plus recherche des manutentionnaires pour renforcer ses équipes durant la période des fêtes de fin d''année. Aucune expérience préalable n''est exigée, une formation interne est assurée avant la prise de poste.',
    'Que doit avoir le candidat pour postuler à cette offre ?',
    ARRAY['A) Une expérience confirmée en logistique','B) Aucune expérience particulière','C) Un diplôme spécifique','D) Une formation externe déjà validée'], 'B', 'court'),
  (v_exam_id, 'CE', 21, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Votre entretien d''embauche est fixé au mardi 15 à 10h. Nous vous demandons de vous présenter avec les originaux de vos diplômes ainsi qu''une copie de votre carte d''identité.',
    'Quels documents le candidat doit-il apporter le jour de l''entretien ?',
    ARRAY['A) Uniquement une pièce d''identité','B) Ses diplômes en version originale et un justificatif d''identité','C) Un extrait de casier judiciaire','D) Une attestation de domicile'], 'B', 'court'),
  (v_exam_id, 'CE', 22, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'La convention collective applicable prévoit une prime de treizième mois, versée en une seule fois au mois de décembre, sous condition d''un an d''ancienneté minimum.',
    'À quelle condition un salarié touche-t-il la prime de treizième mois ?',
    ARRAY['A) Avoir signé un CDI','B) Justifier d''une année de présence dans l''entreprise','C) Avoir suivi une formation interne','D) Travailler à temps plein'], 'B', 'court'),
  (v_exam_id, 'CE', 23, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Le comité d''entreprise informe les salariés que les inscriptions pour la mutuelle collective sont ouvertes jusqu''au 30 novembre. Passé ce délai, il ne sera plus possible d''adhérer avant l''année suivante.',
    'Que se passe-t-il pour un salarié qui ne s''inscrit pas avant le 30 novembre ?',
    ARRAY['A) Il doit payer une pénalité','B) Il devra attendre l''année suivante pour adhérer','C) Son contrat de travail est suspendu','D) Il perd son emploi'], 'B', 'court');

  -- ===================== TROUS — texte à trous (24-25) + 2 phrases à trous (26-27) =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format, highlight_gap)
  VALUES
  (v_exam_id, 'CE', 24, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Suite à notre entretien téléphonique, je vous ___________ (1) ma candidature pour le poste d''assistant commercial, accompagnée de mon curriculum vitae. Je reste à votre entière ___________ (2) pour tout complément d''information.',
    '(1)',
    ARRAY['A) transmets','B) refuse','C) annule','D) retire'], 'A', 'trous', 1),
  (v_exam_id, 'CE', 25, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Suite à notre entretien téléphonique, je vous ___________ (1) ma candidature pour le poste d''assistant commercial, accompagnée de mon curriculum vitae. Je reste à votre entière ___________ (2) pour tout complément d''information.',
    '(2)',
    ARRAY['A) disposition','B) obligation','C) intention','D) exigence'], 'A', 'trous', 2);

  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format, highlight_gap)
  VALUES
  (v_exam_id, 'CE', 26, 'text', 'Lisez la phrase et choisissez le mot qui la complète.',
    'Avant de signer le contrat, le candidat doit ___________ (1) attentivement chaque clause.',
    '(1)',
    ARRAY['A) lire','B) jeter','C) oublier','D) vendre'], 'A', 'trous', 1),
  (v_exam_id, 'CE', 27, 'text', 'Lisez la phrase et choisissez le mot qui la complète.',
    'L''employeur a décidé de ___________ (1) le salarié pour ses excellents résultats.',
    '(1)',
    ARRAY['A) féliciter','B) licencier','C) ignorer','D) punir'], 'A', 'trous', 1);

  -- ===================== MULTI_TEXTE — 2 questions (order_index 28-29) =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, question, options, correct_answer, ce_format, sub_texts)
  VALUES
  (v_exam_id, 'CE', 28, 'text', 'Lisez les documents et répondez à la question.',
    'Quelle offre permet de travailler entièrement depuis son domicile ?',
    ARRAY['A) Offre 1','B) Offre 2','C) Offre 3','D) Offre 4'], 'B', 'multi_texte',
    '[
      {"label": "Offre 1", "content": "Chargé de clientèle bancaire, CDI, formation de deux mois assurée en interne avant la prise de poste, aucun diplôme bancaire requis."},
      {"label": "Offre 2", "content": "Développeur web junior, CDD 6 mois renouvelable, télétravail total possible, maîtrise de JavaScript exigée."},
      {"label": "Offre 3", "content": "Responsable de magasin, CDI, expérience de management d''au moins 3 ans indispensable, primes sur objectifs."},
      {"label": "Offre 4", "content": "Agent d''entretien, CDD temps partiel, horaires flexibles le matin, aucune qualification requise."}
    ]'::jsonb),
  (v_exam_id, 'CE', 29, 'text', 'Lisez les documents et répondez à la question.',
    'Je veux un poste qui respecte une séparation stricte entre vie professionnelle et vie personnelle. Quel avis correspond le mieux à cette attente ?',
    ARRAY['A) Avis 1','B) Avis 2','C) Avis 3','D) Avis 4'], 'B', 'multi_texte',
    '[
      {"label": "Avis 1", "content": "Ambiance conviviale, mais les délais sont parfois très serrés en période de forte activité, ce qui demande une grande disponibilité."},
      {"label": "Avis 2", "content": "Rémunération correcte, horaires fixes respectés à la lettre, aucune sollicitation en dehors du temps de travail."},
      {"label": "Avis 3", "content": "Beaucoup d''opportunités d''évolution interne, mais le rythme est soutenu et les déplacements fréquents."},
      {"label": "Avis 4", "content": "Équipe dynamique, télétravail encouragé, mais les outils informatiques restent parfois datés."}
    ]'::jsonb);

  -- ===================== LONG_ADMIN — règle 8 : 1 générale + 1 précise par document =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 30, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le présent avenant a pour objet de porter la rémunération brute mensuelle de Monsieur Lefèvre de 2100 à 2350 euros, à compter du 1er mai, suite à son passage au poste de chef d''équipe.\n\nLes autres clauses du contrat de travail initial demeurent inchangées. Cet avenant devra être retourné signé dans un délai de quinze jours, faute de quoi il sera réputé refusé.',
    'Quel est l''objet principal de cet avenant ?',
    ARRAY['A) Modifier les horaires de travail','B) Augmenter la rémunération suite à un changement de poste','C) Mettre fin au contrat de travail','D) Accorder un jour de congé supplémentaire'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 31, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le présent avenant a pour objet de porter la rémunération brute mensuelle de Monsieur Lefèvre de 2100 à 2350 euros, à compter du 1er mai, suite à son passage au poste de chef d''équipe.\n\nLes autres clauses du contrat de travail initial demeurent inchangées. Cet avenant devra être retourné signé dans un délai de quinze jours, faute de quoi il sera réputé refusé.',
    'Que se passe-t-il si l''avenant n''est pas retourné signé dans les quinze jours ?',
    ARRAY['A) Il est automatiquement accepté','B) Il est considéré comme rejeté','C) Le salarié est licencié','D) Le délai est prolongé d''un mois'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 32, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'France Travail vous rappelle que la déclaration mensuelle de situation doit impérativement être effectuée entre le 28 et le 31 de chaque mois, faute de quoi le versement de vos allocations sera interrompu jusqu''à régularisation.\n\nEn cas de reprise d''activité, même de courte durée, celle-ci doit être signalée dans les mêmes délais, sous peine de devoir rembourser les sommes perçues à tort.',
    'Quel est l''objet principal de ce message ?',
    ARRAY['A) Rappeler une obligation déclarative mensuelle','B) Annoncer la fin des allocations','C) Proposer une offre d''emploi','D) Convoquer à un entretien'], 'A', 'long_admin'),
  (v_exam_id, 'CE', 33, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'France Travail vous rappelle que la déclaration mensuelle de situation doit impérativement être effectuée entre le 28 et le 31 de chaque mois, faute de quoi le versement de vos allocations sera interrompu jusqu''à régularisation.\n\nEn cas de reprise d''activité, même de courte durée, celle-ci doit être signalée dans les mêmes délais, sous peine de devoir rembourser les sommes perçues à tort.',
    'Que doit faire un demandeur d''emploi qui retrouve un travail de courte durée ?',
    ARRAY['A) Ne rien signaler si c''est temporaire','B) Le déclarer dans les mêmes délais que la situation mensuelle','C) Attendre la fin du contrat pour le signaler','D) Informer uniquement son futur employeur'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 34, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Note de service — Direction générale\n\nDans le cadre du plan de mobilité interne, les salariés souhaitant candidater à un poste ouvert dans un autre service doivent en informer leur manager actuel avant de déposer leur candidature auprès des ressources humaines.',
    'Que doit faire un salarié avant de candidater à un poste dans un autre service ?',
    ARRAY['A) Attendre l''accord écrit de la direction générale','B) Prévenir son manager actuel','C) Suivre une formation obligatoire','D) Démissionner de son poste actuel'], 'B', 'long_admin');

  -- ===================== ARTICLE_PRESSE — 5 questions (order_index 35-39) =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 35, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Plusieurs entreprises françaises expérimentent depuis quelques mois la semaine de quatre jours, sans réduction de salaire mais avec une réorganisation du temps de travail. Les premiers retours sont globalement positifs, les salariés rapportant une meilleure conciliation entre vie professionnelle et personnelle.\n\nCertains dirigeants restent toutefois prudents, redoutant une perte de productivité sur le long terme, en particulier dans les secteurs nécessitant une présence continue auprès des clients.',
    'Que révèlent les premiers retours sur la semaine de quatre jours ?',
    ARRAY['A) Une baisse générale de la motivation','B) Un meilleur équilibre entre vie professionnelle et personnelle','C) Une hausse immédiate des salaires','D) Un désintérêt des salariés pour cette organisation'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 36, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Plusieurs entreprises françaises expérimentent depuis quelques mois la semaine de quatre jours, sans réduction de salaire mais avec une réorganisation du temps de travail. Les premiers retours sont globalement positifs, les salariés rapportant une meilleure conciliation entre vie professionnelle et personnelle.\n\nCertains dirigeants restent toutefois prudents, redoutant une perte de productivité sur le long terme, en particulier dans les secteurs nécessitant une présence continue auprès des clients.',
    'Quelle inquiétude expriment certains dirigeants ?',
    ARRAY['A) Une possible baisse de productivité à long terme','B) Un coût trop élevé pour l''entreprise','C) Un manque d''intérêt des candidats','D) Une difficulté à recruter de nouveaux salariés'], 'A', 'article_presse'),
  (v_exam_id, 'CE', 37, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Malgré la multiplication des offres d''emploi dans le numérique, de nombreuses entreprises peinent à trouver des candidats maîtrisant les compétences recherchées, notamment en cybersécurité et en intelligence artificielle. Ce décalage s''explique en partie par un système de formation qui peine à suivre l''évolution rapide de ces métiers.\n\nPour y remédier, certaines grandes écoles nouent des partenariats directs avec des entreprises afin d''adapter plus rapidement leurs programmes aux besoins du marché.',
    'Pourquoi les entreprises ont-elles du mal à recruter dans le numérique ?',
    ARRAY['A) Les salaires proposés sont trop bas','B) La formation ne suit pas assez vite l''évolution des métiers','C) Les candidats préfèrent d''autres secteurs','D) Les entreprises n''investissent pas dans le numérique'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 38, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Malgré la multiplication des offres d''emploi dans le numérique, de nombreuses entreprises peinent à trouver des candidats maîtrisant les compétences recherchées, notamment en cybersécurité et en intelligence artificielle. Ce décalage s''explique en partie par un système de formation qui peine à suivre l''évolution rapide de ces métiers.\n\nPour y remédier, certaines grandes écoles nouent des partenariats directs avec des entreprises afin d''adapter plus rapidement leurs programmes aux besoins du marché.',
    'Comment certaines grandes écoles tentent-elles de résoudre ce problème ?',
    ARRAY['A) En réduisant la durée des études','B) En collaborant directement avec des entreprises','C) En augmentant les frais de scolarité','D) En supprimant certaines filières'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 39, 'text', 'Lisez attentivement l''article et répondez à la question.',
    'Un forum de l''emploi dédié aux métiers manuels a réuni la semaine dernière plus de quarante entreprises et près de trois cents visiteurs, désireux de découvrir des secteurs parfois méconnus comme la plomberie ou l''ébénisterie.',
    'Quel était l''objectif de ce forum ?',
    ARRAY['A) Recruter uniquement des cadres','B) Faire découvrir des métiers manuels peu connus','C) Former les visiteurs à un métier','D) Vendre des équipements professionnels'], 'B', 'article_presse');

END $$;
