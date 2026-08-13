-- Recalibration qualité CE — exam-1 (A2-B1, vie administrative quotidienne).
--
-- Corrige un défaut systémique identifié par Olivier sur la 1ère version du contenu
-- (item 5/6 du plan précédent) : la bonne réponse était une quasi-citation verbatim
-- du texte, rendant les questions résolubles par simple reconnaissance de mots-clés
-- sans compréhension réelle. Recalibré à partir de captures PrepMyFuture montrant le
-- corrigé détaillé (EXPLICATION/CONTEXTE) :
--   - trous : distracteurs sémantiquement proches (même registre), jamais aléatoires
--   - multi_texte : chaque sous-texte couvre un thème réellement distinct
--   - long_admin/article_presse : la bonne réponse reformule toujours le texte (jamais
--     de citation directe) ; les questions portent souvent sur la fonction/l'intention
--     du document plutôt que sur un simple repérage de détail isolé
--
-- Même répartition de formats que la version précédente (4/4/2/5/5=20), order_index
-- 20-39 conservé.

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
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 20, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'La mairie annexe du quartier Nord sera fermée pendant deux semaines pour cause de travaux. Les usagers ayant une démarche urgente à effectuer sont invités à se présenter à l''accueil du bâtiment principal, place de la République.',
    'Que doivent faire les habitants pour une démarche urgente pendant les travaux ?',
    ARRAY['A) Patienter jusqu''à la réouverture','B) Se rendre dans un autre bâtiment municipal','C) Contacter la préfecture','D) Envoyer un dossier par courrier'], 'B', 'court'),
  (v_exam_id, 'CE', 21, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Pour renouveler une pièce d''identité, il est désormais obligatoire de prendre rendez-vous en ligne. Aucune demande ne sera traitée si le rendez-vous n''a pas été réservé au préalable sur le site de l''agence nationale des titres sécurisés.',
    'Que se passe-t-il si une personne se présente sans avoir réservé de créneau ?',
    ARRAY['A) Sa demande est traitée en priorité','B) Sa demande n''est pas prise en compte','C) Elle reçoit une amende','D) Elle doit revenir le lendemain matin'], 'B', 'court'),
  (v_exam_id, 'CE', 22, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Le service des cartes grises informe les usagers que le délai de traitement des dossiers est actuellement d''environ trois semaines, en raison d''un afflux important de demandes depuis la rentrée.',
    'Pourquoi le traitement des dossiers prend-il plus de temps que d''habitude ?',
    ARRAY['A) Le service est en sous-effectif','B) De nombreuses demandes ont été déposées récemment','C) Le système informatique est en panne','D) Le service est fermé pour congés'], 'B', 'court'),
  (v_exam_id, 'CE', 23, 'text', 'Lisez attentivement le texte et répondez à la question.',
    'Les usagers souhaitant obtenir un acte de naissance peuvent désormais effectuer leur demande directement en ligne, sans avoir à se déplacer, sauf les personnes nées à l''étranger.',
    'Qui doit obligatoirement se déplacer pour cette démarche ?',
    ARRAY['A) Les personnes nées à l''étranger','B) Les personnes de plus de 60 ans','C) Les personnes sans connexion internet','D) Personne, tout se fait en ligne'], 'A', 'court');

  -- ===================== TROUS — 4 questions (order_index 24-27) =====================
  -- Distracteurs sémantiquement proches (même registre/même construction grammaticale),
  -- le bon choix se départage par le sens précis dans le contexte, pas par élimination.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format, highlight_gap)
  VALUES
  (v_exam_id, 'CE', 24, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Pour faciliter les démarches des usagers, la préfecture a mis en place un numéro unique permettant d''___________ (1) directement à un conseiller, sans passer par plusieurs services différents. Cette mesure vise à ___________ (2) les délais d''attente, souvent jugés trop longs par les usagers.',
    '(1)',
    ARRAY['A) accéder','B) renoncer','C) recourir','D) échapper'], 'A', 'trous', 1),
  (v_exam_id, 'CE', 25, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Pour faciliter les démarches des usagers, la préfecture a mis en place un numéro unique permettant d''___________ (1) directement à un conseiller, sans passer par plusieurs services différents. Cette mesure vise à ___________ (2) les délais d''attente, souvent jugés trop longs par les usagers.',
    '(2)',
    ARRAY['A) réduire','B) prolonger','C) maintenir','D) doubler'], 'A', 'trous', 2),
  (v_exam_id, 'CE', 26, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Les allocataires doivent impérativement ___________ (1) leur déclaration de ressources chaque trimestre, sous peine de voir leurs droits ___________ (2) temporairement.',
    '(1)',
    ARRAY['A) actualiser','B) consulter','C) imprimer','D) archiver'], 'A', 'trous', 1),
  (v_exam_id, 'CE', 27, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Les allocataires doivent impérativement ___________ (1) leur déclaration de ressources chaque trimestre, sous peine de voir leurs droits ___________ (2) temporairement.',
    '(2)',
    ARRAY['A) suspendus','B) doublés','C) transférés','D) publiés'], 'A', 'trous', 2);

  -- ===================== MULTI_TEXTE — 2 questions (order_index 28-29) =====================
  -- Chaque sous-texte couvre un thème distinct : il faut les lire tous pour identifier
  -- lequel répond précisément à la situation posée, pas juste repérer un mot-clé isolé.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, question, options, correct_answer, ce_format, sub_texts)
  VALUES
  (v_exam_id, 'CE', 28, 'text', 'Lisez les documents et répondez à la question.',
    'Je viens de me marier et j''ai besoin d''une copie de mon acte de mariage. Quel service dois-je contacter ?',
    ARRAY['A) Service 1','B) Service 2','C) Service 3','D) Service 4'], 'B', 'multi_texte',
    '[
      {"label": "Service 1", "content": "Le service des naturalisations accompagne les candidats à la nationalité française tout au long de leur dossier, de la constitution des pièces justificatives jusqu''à l''entretien final."},
      {"label": "Service 2", "content": "Le service de l''état civil délivre les actes de naissance, de mariage et de décès, ainsi que les copies intégrales nécessaires pour de nombreuses démarches."},
      {"label": "Service 3", "content": "Le service des étrangers traite les demandes de titres de séjour, leur renouvellement, ainsi que les changements de statut administratif."},
      {"label": "Service 4", "content": "Le service du logement social gère les dossiers de demande de HLM et informe les usagers sur les critères d''attribution."}
    ]'::jsonb),
  (v_exam_id, 'CE', 29, 'text', 'Lisez les documents et répondez à la question.',
    'Je cherche un emploi et j''ai besoin d''aide pour préparer ma candidature. Quel atelier me convient le mieux ?',
    ARRAY['A) Atelier 1','B) Atelier 2','C) Atelier 3','D) Atelier 4'], 'C', 'multi_texte',
    '[
      {"label": "Atelier 1", "content": "Atelier d''initiation à l''informatique, pour les personnes n''ayant jamais utilisé d''ordinateur, tous les mardis matin."},
      {"label": "Atelier 2", "content": "Atelier de conversation en français, pour progresser à l''oral dans un cadre convivial, ouvert à tous les niveaux, le jeudi après-midi."},
      {"label": "Atelier 3", "content": "Atelier d''aide à la rédaction de CV et lettres de motivation, sur rendez-vous individuel uniquement."},
      {"label": "Atelier 4", "content": "Atelier de soutien scolaire pour les collégiens, tous les mercredis après-midi, animé par des bénévoles retraités."}
    ]'::jsonb);

  -- ===================== LONG_ADMIN — 5 questions (order_index 30-34) =====================
  -- Les réponses reformulent toujours le passage pertinent (jamais de citation directe).
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 30, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'La Caisse d''Allocations Familiales accuse réception de votre dossier de demande d''aide au logement, déposé le 3 février. Après une première vérification, il apparaît que votre dossier est incomplet : l''attestation de loyer signée par votre bailleur n''a pas été jointe.\n\nNous vous invitons à nous transmettre ce document dans les meilleurs délais afin que l''instruction de votre demande puisse se poursuivre. Sans réponse de votre part sous deux mois, votre demande sera considérée comme abandonnée.',
    'Pourquoi le dossier ne peut-il pas être instruit pour l''instant ?',
    ARRAY['A) Le demandeur n''a pas de propriétaire','B) Un document obligatoire n''a pas été fourni','C) Le dossier a été envoyé après la date limite','D) Le montant de l''aide n''a pas été calculé'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 31, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'La Caisse d''Allocations Familiales accuse réception de votre dossier de demande d''aide au logement, déposé le 3 février. Après une première vérification, il apparaît que votre dossier est incomplet : l''attestation de loyer signée par votre bailleur n''a pas été jointe.\n\nNous vous invitons à nous transmettre ce document dans les meilleurs délais afin que l''instruction de votre demande puisse se poursuivre. Sans réponse de votre part sous deux mois, votre demande sera considérée comme abandonnée.',
    'Que risque le demandeur s''il ne répond pas dans les deux mois ?',
    ARRAY['A) Une pénalité financière','B) La clôture automatique de sa demande','C) Une convocation en préfecture','D) Le renouvellement automatique du dossier'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 32, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le service des naturalisations vous informe que votre entretien d''assimilation, initialement prévu le 14 mars, est reporté au 28 mars à 9h30, en raison d''un empêchement de l''agent instructeur.\n\nMerci de vous présenter avec l''ensemble des pièces justificatives déjà transmises, ainsi qu''une pièce d''identité en cours de validité. Tout retard supérieur à quinze minutes entraînera l''annulation du rendez-vous.',
    'Pourquoi la date de l''entretien a-t-elle changé ?',
    ARRAY['A) Le demandeur a annulé le rendez-vous','B) L''agent en charge du dossier n''était pas disponible','C) Le dossier était incomplet','D) Le service est fermé pour travaux'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 33, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le service des naturalisations vous informe que votre entretien d''assimilation, initialement prévu le 14 mars, est reporté au 28 mars à 9h30, en raison d''un empêchement de l''agent instructeur.\n\nMerci de vous présenter avec l''ensemble des pièces justificatives déjà transmises, ainsi qu''une pièce d''identité en cours de validité. Tout retard supérieur à quinze minutes entraînera l''annulation du rendez-vous.',
    'Que se passe-t-il si le candidat arrive avec plus de quinze minutes de retard ?',
    ARRAY['A) Il doit attendre la fin des autres entretiens','B) Le rendez-vous n''est plus maintenu','C) Il reçoit un avertissement écrit','D) L''entretien est simplement raccourci'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 34, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Note de service — Direction de l''accueil du public\n\nÀ compter du 1er avril, les usagers ne pourront plus déposer de dossier au guichet sans rendez-vous préalable, quel que soit le motif de leur visite. Cette mesure vise à réduire le temps d''attente en salle et à mieux répartir les agents sur les différents services.',
    'Quel est l''objectif de cette nouvelle mesure ?',
    ARRAY['A) Réduire le nombre d''agents d''accueil','B) Améliorer l''organisation et diminuer l''attente','C) Fermer certains guichets définitivement','D) Limiter le nombre de dossiers traités chaque jour'], 'B', 'long_admin');

  -- ===================== ARTICLE_PRESSE — 5 questions (order_index 35-39) =====================
  -- Questions de synthèse/fonction du document plutôt que de simple repérage de détail.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 35, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Face à la complexité croissante des démarches administratives, de plus en plus de communes mettent en place des « maisons France Services », des guichets uniques où les usagers peuvent être accompagnés dans leurs démarches liées à la carte grise, aux impôts ou encore à la retraite.\n\nCes structures, souvent installées dans des zones rurales éloignées des grandes administrations, permettent de lutter contre ce que certains observateurs appellent la « fracture administrative », qui touche particulièrement les personnes âgées ou peu à l''aise avec les outils numériques.',
    'Quel est le rôle principal des maisons France Services ?',
    ARRAY['A) Remplacer complètement les administrations','B) Accompagner les usagers dans leurs démarches','C) Former les fonctionnaires aux outils numériques','D) Contrôler les dossiers administratifs'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 36, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'Face à la complexité croissante des démarches administratives, de plus en plus de communes mettent en place des « maisons France Services », des guichets uniques où les usagers peuvent être accompagnés dans leurs démarches liées à la carte grise, aux impôts ou encore à la retraite.\n\nCes structures, souvent installées dans des zones rurales éloignées des grandes administrations, permettent de lutter contre ce que certains observateurs appellent la « fracture administrative », qui touche particulièrement les personnes âgées ou peu à l''aise avec les outils numériques.',
    'Qui est le plus concerné par la « fracture administrative » évoquée dans l''article ?',
    ARRAY['A) Les habitants des grandes villes','B) Les jeunes actifs connectés','C) Les personnes âgées ou peu familières du numérique','D) Les fonctionnaires eux-mêmes'], 'C', 'article_presse'),
  (v_exam_id, 'CE', 37, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'La dématérialisation des services publics, censée simplifier la vie des usagers, est parfois vécue comme un obstacle supplémentaire par une partie de la population. Selon une enquête récente, près d''un usager sur cinq renonce à effectuer une démarche en ligne faute de maîtriser suffisamment les outils numériques.\n\nPour répondre à cette difficulté, plusieurs associations proposent désormais des permanences gratuites d''aide aux démarches en ligne, animées par des bénévoles formés spécifiquement à cet effet.',
    'Que révèle l''enquête citée dans l''article ?',
    ARRAY['A) La majorité des usagers préfère les démarches en ligne','B) Une partie des usagers abandonne certaines démarches par manque de compétences numériques','C) Les associations remplacent les services publics','D) Les démarches en ligne sont plus rapides qu''avant'], 'B', 'article_presse'),
  (v_exam_id, 'CE', 38, 'text', 'Lisez attentivement l''article et répondez à la question.',
    E'La dématérialisation des services publics, censée simplifier la vie des usagers, est parfois vécue comme un obstacle supplémentaire par une partie de la population. Selon une enquête récente, près d''un usager sur cinq renonce à effectuer une démarche en ligne faute de maîtriser suffisamment les outils numériques.\n\nPour répondre à cette difficulté, plusieurs associations proposent désormais des permanences gratuites d''aide aux démarches en ligne, animées par des bénévoles formés spécifiquement à cet effet.',
    'Comment les associations tentent-elles de résoudre cette difficulté ?',
    ARRAY['A) En proposant des formations payantes','B) En simplifiant les sites administratifs','C) En offrant un accompagnement gratuit par des bénévoles','D) En remplaçant les agents administratifs'], 'C', 'article_presse'),
  (v_exam_id, 'CE', 39, 'text', 'Lisez attentivement l''article et répondez à la question.',
    'Un nouveau service de médiation administrative a été lancé dans plusieurs départements, permettant aux usagers en litige avec une administration de trouver une solution amiable avant d''engager une procédure judiciaire, souvent longue et coûteuse.',
    'À quoi sert ce nouveau service de médiation ?',
    ARRAY['A) À remplacer les tribunaux administratifs','B) À résoudre les conflits sans passer par la justice','C) À sanctionner les administrations fautives','D) À accélérer les procédures judiciaires en cours'], 'B', 'article_presse');

END $$;
