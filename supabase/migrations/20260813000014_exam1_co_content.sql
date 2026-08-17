-- Recalibration CO — exam-1 (A2-B1, vie administrative quotidienne, cohérent avec la CE
-- du même examen). Item 3 du plan.
--
-- Répartition : 4 annonce / 4 repondeur / 6 chronique (indépendantes) / 6 micro_trottoir
-- (2 groupes de 3, audio partagé). order_index 0-19 conservé (plage CO existante).
--
-- audio_url pointe vers le bucket Supabase Storage 'co-audio' créé par Olivier — chemins
-- prévus, les fichiers seront uploadés après génération TTS (item 4). transcription contient
-- le script complet (jamais montré pendant l'examen, uniquement en revue de correction,
-- cohérent avec le fonctionnement déjà en place). max_plays=1 partout (standardisation,
-- l'épreuve réelle ne permet pas de réécoute — corrige l'incohérence 2/1 de l'ancien contenu).

DO $$
DECLARE
  v_exam_id uuid;
BEGIN
  SELECT id INTO v_exam_id FROM public.exams WHERE slug = 'exam-1';
  IF v_exam_id IS NULL THEN
    RAISE EXCEPTION 'Exam with slug exam-1 not found';
  END IF;

  DELETE FROM public.exam_questions WHERE exam_id = v_exam_id AND section = 'CO';

  -- ===================== ANNONCE — 4 questions (order_index 0-3) =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, audio_url, max_plays, transcription, question, options, correct_answer, co_format, explanation)
  VALUES
  (v_exam_id, 'CO', 0, 'audio', 'Écoutez l''annonce et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/0.mp3', 1,
    'Mesdames, messieurs, en raison d''une opération de maintenance, l''accueil du service des cartes grises sera fermé demain matin. Merci de vous présenter à partir de treize heures pour toute démarche.',
    'Ce message annonce...',
    ARRAY['A) une fermeture définitive du service','B) une fermeture temporaire du matin','C) un changement d''adresse du service','D) une augmentation des tarifs'], 'B', 'annonce',
    'Le message précise que l''accueil sera fermé « demain matin » et rouvrira « à partir de treize heures » — c''est donc une fermeture temporaire, limitée à la matinée.'),
  (v_exam_id, 'CO', 1, 'audio', 'Écoutez l''annonce et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/1.mp3', 1,
    'Attention, votre attention s''il vous plaît. En raison d''un afflux exceptionnel de visiteurs ce matin, un ticket d''attente est désormais obligatoire pour toute demande de titre de séjour. Retirez votre ticket à l''accueil avant de patienter.',
    'Ce message annonce...',
    ARRAY['A) la suppression des tickets d''attente','B) l''obligation de prendre un ticket avant de patienter','C) la fermeture du service des titres de séjour','D) un changement d''horaires d''ouverture'], 'B', 'annonce',
    'Le message indique qu''« un ticket d''attente est désormais obligatoire » — c''est donc bien une nouvelle obligation, pas une suppression.'),
  (v_exam_id, 'CO', 2, 'audio', 'Écoutez l''annonce et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/2.mp3', 1,
    'Votre attention s''il vous plaît, la bibliothèque municipale fermera exceptionnellement ses portes à seize heures aujourd''hui en raison d''une réunion du personnel. Merci de votre compréhension.',
    'Ce message annonce...',
    ARRAY['A) une fermeture anticipée exceptionnelle','B) une fermeture définitive','C) un changement de jour d''ouverture','D) une réunion publique'], 'A', 'annonce',
    'Le message précise que la fermeture à 16h est exceptionnelle, « aujourd''hui », en raison d''une réunion interne du personnel — pas une fermeture définitive ni un changement de jour.'),
  (v_exam_id, 'CO', 3, 'audio', 'Écoutez l''annonce et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/3.mp3', 1,
    'Mesdames, messieurs, nous vous informons que la mairie annexe du quartier Nord est actuellement fermée pour travaux. Les usagers sont invités à se rendre au bâtiment principal, place de la République, pour toute démarche urgente.',
    'Ce message annonce...',
    ARRAY['A) la fermeture définitive de la mairie annexe','B) des travaux temporaires à la mairie annexe','C) un changement d''adresse de la mairie principale','D) une grève du personnel municipal'], 'B', 'annonce',
    'Le message parle de travaux en cours à la mairie annexe, avec une solution de repli (le bâtiment principal) — c''est donc temporaire, pas une fermeture définitive.');

  -- ===================== REPONDEUR — 4 questions (order_index 4-7) =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, audio_url, max_plays, transcription, question, options, correct_answer, co_format, explanation)
  VALUES
  (v_exam_id, 'CO', 4, 'audio', 'Écoutez le message et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/4.mp3', 1,
    'Bonjour, je vous appelle au sujet de mon dossier de demande de carte de séjour, déposé le mois dernier. Je voudrais savoir s''il vous manque des documents avant de passer vous voir. Merci de me rappeler au plus vite.',
    'La personne appelle pour...',
    ARRAY['A) annuler sa demande','B) vérifier si son dossier est complet','C) prendre un rendez-vous d''entretien','D) signaler la perte de ses papiers'], 'B', 'repondeur',
    'La personne demande explicitement s''il « manque des documents » avant de se déplacer — elle cherche donc à vérifier que son dossier est complet.'),
  (v_exam_id, 'CO', 5, 'audio', 'Écoutez le message et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/5.mp3', 1,
    'Bonjour, c''est de la part de l''agence immobilière Papin. Je vous contacte pour l''appartement que vous avez visité hier. Le propriétaire a accepté votre dossier, merci de me recontacter pour finaliser la signature du bail.',
    'La personne appelle pour...',
    ARRAY['A) proposer une nouvelle visite','B) informer d''un refus de dossier','C) informer de l''acceptation du dossier','D) demander une pièce manquante'], 'C', 'repondeur',
    'Le message dit clairement que « le propriétaire a accepté votre dossier » — c''est donc une bonne nouvelle, pas un refus.'),
  (v_exam_id, 'CO', 6, 'audio', 'Écoutez le message et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/6.mp3', 1,
    'Bonjour, je vous appelle car j''ai un empêchement pour notre rendez-vous prévu jeudi matin à la préfecture. Serait-il possible de le décaler à la semaine prochaine ? Merci de me confirmer par retour d''appel.',
    'La personne appelle pour...',
    ARRAY['A) confirmer sa présence au rendez-vous','B) demander à reporter un rendez-vous','C) annuler définitivement un dossier','D) obtenir une nouvelle adresse'], 'B', 'repondeur',
    'La personne a « un empêchement » et demande à « décaler » son rendez-vous — c''est donc une demande de report, pas une confirmation ni une annulation définitive.'),
  (v_exam_id, 'CO', 7, 'audio', 'Écoutez le message et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/7.mp3', 1,
    'Bonjour, ici le service des impôts. Nous avons bien reçu votre déclaration mais il manque un justificatif de domicile pour finaliser votre dossier. Merci de nous le transmettre rapidement par courrier ou en ligne.',
    'La personne appelle pour...',
    ARRAY['A) réclamer un paiement en retard','B) signaler un document manquant','C) annoncer un remboursement','D) fixer un rendez-vous en agence'], 'B', 'repondeur',
    'Le message précise qu''« il manque un justificatif de domicile » pour finaliser le dossier — c''est donc un document manquant à signaler.');

  -- ===================== CHRONIQUE — 6 questions indépendantes (order_index 8-13) =====================
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, audio_url, max_plays, transcription, question, options, correct_answer, co_format, explanation)
  VALUES
  (v_exam_id, 'CO', 8, 'audio', 'Écoutez la chronique et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/8.mp3', 1,
    'Aujourd''hui, de plus en plus de communes proposent des permanences numériques pour aider les habitants à effectuer leurs démarches administratives en ligne. Cette aide est particulièrement appréciée par les personnes âgées, souvent moins à l''aise avec les outils numériques.',
    'La chronique explique que l''aide numérique est surtout appréciée par...',
    ARRAY['A) les jeunes actifs','B) les personnes âgées','C) les fonctionnaires','D) les nouveaux arrivants'], 'B', 'chronique',
    'La chronique précise que cette aide est « particulièrement appréciée par les personnes âgées, souvent moins à l''aise avec les outils numériques ».'),
  (v_exam_id, 'CO', 9, 'audio', 'Écoutez la chronique et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/9.mp3', 1,
    'Selon une étude récente, le nombre de demandes de titres de séjour a fortement augmenté cette année dans plusieurs préfectures françaises, entraînant des délais d''attente plus longs pour les usagers.',
    'Que révèle cette étude ?',
    ARRAY['A) une baisse des demandes de titres de séjour','B) une hausse des demandes entraînant plus d''attente','C) une réduction des délais de traitement','D) la fermeture de plusieurs préfectures'], 'B', 'chronique',
    'L''étude parle d''une augmentation des demandes « entraînant des délais d''attente plus longs » — donc une hausse, pas une baisse.'),
  (v_exam_id, 'CO', 10, 'audio', 'Écoutez la chronique et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/10.mp3', 1,
    'De nombreuses associations proposent aujourd''hui des cours de français gratuits pour les personnes récemment arrivées en France, afin de faciliter leur intégration et leurs démarches du quotidien.',
    'Quel est l''objectif de ces cours de français gratuits ?',
    ARRAY['A) Préparer un diplôme universitaire','B) Faciliter l''intégration et les démarches quotidiennes','C) Former de futurs professeurs','D) Remplacer les cours à l''école'], 'B', 'chronique',
    'La chronique indique que ces cours visent à « faciliter leur intégration et leurs démarches du quotidien ».'),
  (v_exam_id, 'CO', 11, 'audio', 'Écoutez la chronique et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/11.mp3', 1,
    'Les horaires d''ouverture de plusieurs services publics ont été élargis en soirée, afin de permettre aux personnes qui travaillent la journée d''effectuer leurs démarches sans devoir poser de congé.',
    'Pourquoi les horaires ont-ils été élargis ?',
    ARRAY['A) Pour réduire les effectifs','B) Pour permettre aux actifs de venir en soirée','C) Pour fermer plus tôt le matin','D) Pour répondre à une obligation légale'], 'B', 'chronique',
    'La chronique précise que l''objectif est de permettre aux actifs de « venir en soirée » sans poser de congé.'),
  (v_exam_id, 'CO', 12, 'audio', 'Écoutez la chronique et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/12.mp3', 1,
    'Un nouveau service en ligne permet désormais de suivre en temps réel l''avancement de son dossier administratif, sans avoir à se déplacer ni à téléphoner pour obtenir des nouvelles.',
    'Quel avantage offre ce nouveau service ?',
    ARRAY['A) Il accélère automatiquement les dossiers','B) Il permet de suivre son dossier sans se déplacer','C) Il remplace complètement l''accueil physique','D) Il est réservé aux professionnels'], 'B', 'chronique',
    'Le service permet de « suivre en temps réel l''avancement de son dossier... sans avoir à se déplacer » — un gain de suivi, pas une accélération automatique du traitement.'),
  (v_exam_id, 'CO', 13, 'audio', 'Écoutez la chronique et répondez à la question.',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/13.mp3', 1,
    'Plusieurs grandes villes expérimentent un accompagnement personnalisé pour les usagers en difficulté avec les démarches en ligne, avec un rendez-vous individuel proposé gratuitement.',
    'En quoi consiste cet accompagnement ?',
    ARRAY['A) Un remboursement des frais de dossier','B) Un rendez-vous individuel gratuit pour aider aux démarches','C) Une formation obligatoire de plusieurs mois','D) Un service payant réservé aux entreprises'], 'B', 'chronique',
    'La chronique précise qu''il s''agit d''« un rendez-vous individuel proposé gratuitement » pour aider aux démarches en ligne.');

  -- ===================== MICRO_TROTTOIR — 2 groupes de 3 (order_index 14-19) =====================
  -- Groupe A : même audio_url et transcription (script complet des 3 personnes) sur les 3 lignes.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, audio_url, max_plays, transcription, question, options, correct_answer, co_format, explanation)
  VALUES
  (v_exam_id, 'CO', 14, 'audio', 'Écoutez les trois personnes et répondez aux questions (mêmes options pour chacune).',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/mt-14.mp3', 1,
    E'« Êtes-vous favorable à la généralisation des démarches administratives en ligne ? »\n\nPersonne 1 : Moi, je trouve que c''est une catastrophe, ces démarches en ligne. On perd le contact humain, et pour les personnes âgées, c''est très compliqué. Je suis clairement contre.\n\nPersonne 2 : C''est pratique, on gagne du temps, c''est vrai. Mais il faudrait garder un accueil physique pour ceux qui en ont besoin. Donc je suis plutôt pour, mais pas à cent pour cent.\n\nPersonne 3 : Franchement, c''est une excellente évolution ! On évite les files d''attente, on peut faire ses démarches depuis chez soi à n''importe quelle heure. Je suis complètement pour.',
    'Personne 1 — la personne interrogée...',
    ARRAY['A) est totalement pour','B) est plutôt pour, mais avec des réserves','C) est totalement contre','D) ne se prononce pas'], 'C', 'micro_trottoir',
    'La personne 1 utilise des mots forts comme « catastrophe » et affirme être « clairement contre » — c''est un rejet total, pas une réserve nuancée.'),
  (v_exam_id, 'CO', 15, 'audio', 'Écoutez les trois personnes et répondez aux questions (mêmes options pour chacune).',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/mt-14.mp3', 1,
    E'« Êtes-vous favorable à la généralisation des démarches administratives en ligne ? »\n\nPersonne 1 : Moi, je trouve que c''est une catastrophe, ces démarches en ligne. On perd le contact humain, et pour les personnes âgées, c''est très compliqué. Je suis clairement contre.\n\nPersonne 2 : C''est pratique, on gagne du temps, c''est vrai. Mais il faudrait garder un accueil physique pour ceux qui en ont besoin. Donc je suis plutôt pour, mais pas à cent pour cent.\n\nPersonne 3 : Franchement, c''est une excellente évolution ! On évite les files d''attente, on peut faire ses démarches depuis chez soi à n''importe quelle heure. Je suis complètement pour.',
    'Personne 2 — la personne interrogée...',
    ARRAY['A) est totalement pour','B) est plutôt pour, mais avec des réserves','C) est totalement contre','D) ne se prononce pas'], 'B', 'micro_trottoir',
    'La personne 2 reconnaît les avantages (« c''est pratique ») mais nuance avec « il faudrait garder un accueil physique » — un avis favorable mais avec réserves.'),
  (v_exam_id, 'CO', 16, 'audio', 'Écoutez les trois personnes et répondez aux questions (mêmes options pour chacune).',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/mt-14.mp3', 1,
    E'« Êtes-vous favorable à la généralisation des démarches administratives en ligne ? »\n\nPersonne 1 : Moi, je trouve que c''est une catastrophe, ces démarches en ligne. On perd le contact humain, et pour les personnes âgées, c''est très compliqué. Je suis clairement contre.\n\nPersonne 2 : C''est pratique, on gagne du temps, c''est vrai. Mais il faudrait garder un accueil physique pour ceux qui en ont besoin. Donc je suis plutôt pour, mais pas à cent pour cent.\n\nPersonne 3 : Franchement, c''est une excellente évolution ! On évite les files d''attente, on peut faire ses démarches depuis chez soi à n''importe quelle heure. Je suis complètement pour.',
    'Personne 3 — la personne interrogée...',
    ARRAY['A) est totalement pour','B) est plutôt pour, mais avec des réserves','C) est totalement contre','D) ne se prononce pas'], 'A', 'micro_trottoir',
    'La personne 3 emploie un ton enthousiaste (« excellente évolution », « complètement pour ») sans aucune réserve exprimée.');

  -- Groupe B
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, audio_url, max_plays, transcription, question, options, correct_answer, co_format, explanation)
  VALUES
  (v_exam_id, 'CO', 17, 'audio', 'Écoutez les trois personnes et répondez aux questions (mêmes options pour chacune).',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/mt-17.mp3', 1,
    E'« Que pensez-vous du télétravail généralisé dans les administrations ? »\n\nPersonne 1 : Je ne suis pas favorable à ça. Un agent qui reçoit du public doit être présent physiquement, sinon le service devient impersonnel. Je suis contre.\n\nPersonne 2 : Ça peut être une bonne chose pour certaines tâches, mais pas pour l''accueil du public je pense. Donc oui, plutôt pour, avec des limites.\n\nPersonne 3 : C''est une très bonne chose, ça réduit les trajets et améliore la qualité de vie des agents. Je suis totalement pour cette évolution.',
    'Personne 1 — la personne interrogée...',
    ARRAY['A) est totalement pour','B) est plutôt pour, mais avec des réserves','C) est totalement contre','D) ne se prononce pas'], 'C', 'micro_trottoir',
    'La personne 1 affirme ne pas être « favorable à ça » et conclut « je suis contre » — un rejet net du télétravail généralisé.'),
  (v_exam_id, 'CO', 18, 'audio', 'Écoutez les trois personnes et répondez aux questions (mêmes options pour chacune).',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/mt-17.mp3', 1,
    E'« Que pensez-vous du télétravail généralisé dans les administrations ? »\n\nPersonne 1 : Je ne suis pas favorable à ça. Un agent qui reçoit du public doit être présent physiquement, sinon le service devient impersonnel. Je suis contre.\n\nPersonne 2 : Ça peut être une bonne chose pour certaines tâches, mais pas pour l''accueil du public je pense. Donc oui, plutôt pour, avec des limites.\n\nPersonne 3 : C''est une très bonne chose, ça réduit les trajets et améliore la qualité de vie des agents. Je suis totalement pour cette évolution.',
    'Personne 2 — la personne interrogée...',
    ARRAY['A) est totalement pour','B) est plutôt pour, mais avec des réserves','C) est totalement contre','D) ne se prononce pas'], 'B', 'micro_trottoir',
    'La personne 2 nuance : favorable « pour certaines tâches » mais « pas pour l''accueil du public » — un avis favorable avec des limites.'),
  (v_exam_id, 'CO', 19, 'audio', 'Écoutez les trois personnes et répondez aux questions (mêmes options pour chacune).',
    'https://jksrmyyfllitrkarvgvk.supabase.co/storage/v1/object/public/co-audio/exam-1/mt-17.mp3', 1,
    E'« Que pensez-vous du télétravail généralisé dans les administrations ? »\n\nPersonne 1 : Je ne suis pas favorable à ça. Un agent qui reçoit du public doit être présent physiquement, sinon le service devient impersonnel. Je suis contre.\n\nPersonne 2 : Ça peut être une bonne chose pour certaines tâches, mais pas pour l''accueil du public je pense. Donc oui, plutôt pour, avec des limites.\n\nPersonne 3 : C''est une très bonne chose, ça réduit les trajets et améliore la qualité de vie des agents. Je suis totalement pour cette évolution.',
    'Personne 3 — la personne interrogée...',
    ARRAY['A) est totalement pour','B) est plutôt pour, mais avec des réserves','C) est totalement contre','D) ne se prononce pas'], 'A', 'micro_trottoir',
    'La personne 3 est enthousiaste et sans réserve : « très bonne chose », « totalement pour cette évolution ».');

END $$;
