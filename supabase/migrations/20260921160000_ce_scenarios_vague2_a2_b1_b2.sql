-- Pratique CE — vague 2 (15 sujets, 75 questions) : 1 sujet supplémentaire par couple niveau × format (A2, B1, B2 × 5 formats).
-- Thèmes distincts de la vague 1. Généré avec le skill llamakusi-ce-scenario-content.
-- À exécuter UNE seule fois (garde-fou ci-dessous).

DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.ce_scenarios WHERE title = 'Collecte des encombrants') THEN RAISE EXCEPTION 'Vague 2 CE déjà appliquée'; END IF; END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : A2 | Thématique : Encombrants, candidature, loisirs, eau, marché | 5 sujet(s)
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
  -- Sujet 1 : Collecte des encombrants (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'A2', 'Collecte des encombrants', 'Information de la mairie — Collecte des encombrants. Le mardi 13 octobre, les agents de la ville passeront dans tout le quartier pour ramasser les gros objets : vieux meubles, matelas, vélos cassés ou appareils électriques. Il faut sortir vos objets sur le trottoir le lundi soir, après 19 h, et pas avant. Attention : on ne ramasse pas les déchets de travaux, les pneus ni les produits dangereux. Si vous ne pouvez pas porter un objet lourd, appelez le service propreté avant le vendredi 9 octobre pour prendre rendez-vous. Le service est gratuit pour les habitants de la ville.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est le but de ce message ?', ARRAY['A) Annoncer la fermeture d''un service de la mairie','B) Demander aux habitants de nettoyer leur rue','C) Proposer des meubles d''occasion aux habitants','D) Expliquer comment se débarrasser de gros objets'], 'D', 'La mairie explique comment et quand sortir les gros objets pour la collecte.', NULL),
    (v_scenario_0, 2, 'Quand faut-il sortir les objets sur le trottoir ?', ARRAY['A) Le mardi matin, avant le passage des agents','B) Le lundi soir, après 19 h','C) Le week-end précédent, dans la journée','D) Le mardi soir, après 19 h'], 'B', 'Les objets se sortent le lundi soir, après 19 h, et pas avant.', NULL),
    (v_scenario_0, 3, 'Quel objet ne sera pas ramassé ?', ARRAY['A) Des pneus de voiture','B) Un vieux matelas','C) Un vélo cassé','D) Un four électrique'], 'A', 'Le texte cite les pneus parmi les objets qu''on ne ramasse pas.', NULL),
    (v_scenario_0, 4, 'Que doit faire une personne qui ne peut pas porter un objet lourd ?', ARRAY['A) Laisser l''objet devant sa porte le mardi','B) Demander de l''aide directement au maire','C) Appeler le service propreté pour prendre rendez-vous','D) Payer une entreprise de déménagement'], 'C', 'Elle doit appeler le service propreté avant le 9 octobre.', NULL),
    (v_scenario_0, 5, 'Quelle affirmation est vraie ?', ARRAY['A) Il faut réserver un créneau pour tous les objets','B) Le service ne coûte rien aux habitants','C) La collecte a lieu dans toute la région','D) On peut sortir ses objets dès dimanche soir'], 'B', 'Le service est gratuit pour les habitants de la ville.', NULL);

  -- Sujet 2 : Une candidature par e-mail (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'A2', 'Une candidature par e-mail', 'Bonjour Madame, je m''appelle Nadia Rahmani et je vous écris ___________ (1) répondre à votre annonce de vendeuse. J''ai travaillé deux ans dans un magasin de vêtements et je ___________ (2) très bien avec les clients. J''ai aussi travaillé comme caissière pendant un été, et j''aime le contact avec les gens. Je parle français, arabe et un peu d''anglais. Je suis disponible du lundi ___________ (3) samedi, le matin et l''après-midi. Je peux commencer le travail dès la semaine ___________ (4). Je joins mon CV à ce message. J''espère que ma candidature vous ___________ (5) intéressée. Merci beaucoup et bonne journée. Cordialement, Nadia Rahmani', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) sans','B) avant','C) pour','D) après'], 'C', '« Je vous écris pour répondre » exprime le but du message.', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) m''entends','B) me trompe','C) me perds','D) m''ennuie'], 'A', '« Je m''entends bien avec les clients » est une qualité utile pour un poste de vendeuse.', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) à','B) de','C) en','D) au'], 'D', 'On dit « du lundi au samedi » pour donner le début et la fin d''une période.', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) passée','B) prochaine','C) dernière','D) précédente'], 'B', 'La candidate peut commencer dans le futur : « la semaine prochaine ».', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) a','B) est','C) était','D) sera'], 'A', 'Le verbe « intéresser » se conjugue avec « avoir » : « ma candidature vous a intéressée ».', 5);

  -- Sujet 3 : Quatre activités de sport et de loisirs (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'A2', 'Quatre activités de sport et de loisirs', NULL, '[{"label": "Natation pour adultes", "content": "Les cours ont lieu le mardi et le jeudi soir, de 19 h à 20 h, à la piscine municipale. Ils sont pour les adultes qui ne savent pas nager ou qui nagent peu. L''inscription se fait à l''accueil de la piscine."}, {"label": "Football pour enfants", "content": "Le club accueille les enfants de 6 à 12 ans le mercredi après-midi et le samedi matin. Les enfants ont besoin de chaussures de sport et d''un certificat médical. Le premier cours est gratuit pour essayer."}, {"label": "Atelier cuisine du monde", "content": "Un samedi par mois, les habitants cuisinent ensemble un plat d''un pays différent, puis mangent tous ensemble. L''atelier est ouvert aux familles et il coûte cinq euros par personne. Il faut réserver avant le jeudi."}, {"label": "Randonnée du dimanche", "content": "Un guide bénévole organise une marche tranquille dans la forêt un dimanche sur deux, de 9 h à 12 h. Le rendez-vous est devant la gare. Il n''y a pas besoin de s''inscrire, mais il faut de bonnes chaussures et de l''eau."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Je ne sais pas nager et je voudrais apprendre le soir, après mon travail. Quelle activité peut me convenir ?', ARRAY['A) Football pour enfants','B) Natation pour adultes','C) Atelier cuisine du monde','D) Randonnée du dimanche'], 'B', 'Les cours pour adultes ont lieu le mardi et le jeudi soir.', NULL),
    (v_scenario_2, 2, 'Mon fils a huit ans et il aime jouer avec un ballon. Il est libre le mercredi. Quelle activité peut lui convenir ?', ARRAY['A) Natation pour adultes','B) Atelier cuisine du monde','C) Randonnée du dimanche','D) Football pour enfants'], 'D', 'Le club accueille les enfants de 6 à 12 ans le mercredi après-midi.', NULL),
    (v_scenario_2, 3, 'Je veux rencontrer des voisins, découvrir des plats d''autres pays et venir avec toute ma famille. Quelle activité peut me convenir ?', ARRAY['A) Atelier cuisine du monde','B) Natation pour adultes','C) Football pour enfants','D) Randonnée du dimanche'], 'A', 'On y prépare ensemble un plat d''un autre pays ; l''atelier est ouvert aux familles.', NULL),
    (v_scenario_2, 4, 'J''aime marcher dans la nature en fin de semaine et je ne veux pas m''inscrire à l''avance. Quelle activité peut me convenir ?', ARRAY['A) Natation pour adultes','B) Football pour enfants','C) Randonnée du dimanche','D) Atelier cuisine du monde'], 'C', 'Il n''y a pas besoin de s''inscrire pour la marche du dimanche.', NULL),
    (v_scenario_2, 5, 'Je peux seulement venir un samedi, mais je dois prévenir avant jeudi et payer un petit prix. Quelle activité peut me convenir ?', ARRAY['A) Atelier cuisine du monde','B) Natation pour adultes','C) Football pour enfants','D) Randonnée du dimanche'], 'A', 'Il faut réserver avant le jeudi et payer cinq euros par personne.', NULL);

  -- Sujet 4 : Coupure d'eau dans le quartier (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'A2', 'Coupure d''eau dans le quartier', E'Objet : coupure d''eau dans votre quartier\n\nMadame, Monsieur,\n\nLe service des eaux de la ville vous informe qu''il y aura une coupure d''eau le jeudi 15 octobre, de 9 h à 15 h, dans les rues du Moulin, des Roses et de la Gare. Cette coupure est nécessaire pour changer un gros tuyau. Nous vous conseillons de remplir quelques bouteilles d''eau la veille pour boire et cuisiner. Après la coupure, l''eau peut être un peu marron ou avoir un goût différent : laissez-la couler quelques minutes avant de la boire. Si une personne est malade ou a besoin d''eau pour des soins à la maison, elle peut appeler le service des eaux avant mardi ; la ville lui apportera de l''eau. Merci de votre compréhension.\n\nLe service des eaux', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Quel est l''objet de ce courrier ?', ARRAY['A) Annoncer une augmentation du prix de l''eau','B) Demander de payer une facture d''eau en retard','C) Informer les habitants d''une coupure d''eau prévue','D) Proposer un nouveau contrat aux habitants'], 'C', 'Le courrier annonce une coupure d''eau le 15 octobre et donne des conseils.', NULL),
    (v_scenario_3, 2, 'Pendant combien de temps l''eau sera-t-elle coupée ?', ARRAY['A) Pendant six heures','B) Pendant trois heures','C) Pendant huit heures','D) Pendant deux jours'], 'A', 'La coupure dure de 9 h à 15 h, soit six heures.', NULL),
    (v_scenario_3, 3, 'Pourquoi l''eau est-elle coupée ?', ARRAY['A) Pour nettoyer les rues du quartier','B) Parce que des habitants n''ont pas payé','C) Pour mesurer la consommation de chaque foyer','D) Pour remplacer une grosse canalisation'], 'D', 'La coupure est nécessaire pour changer un gros tuyau.', NULL),
    (v_scenario_3, 4, 'Que conseille la ville la veille de la coupure ?', ARRAY['A) Fermer tous les robinets de la maison','B) Mettre de l''eau de côté dans des bouteilles','C) Prendre une douche avant midi','D) Acheter un filtre à eau'], 'B', 'Le courrier conseille de remplir des bouteilles d''eau pour boire et cuisiner.', NULL),
    (v_scenario_3, 5, 'Que peut faire une personne malade qui a besoin d''eau ?', ARRAY['A) Aller chercher de l''eau à la mairie jeudi matin','B) Quitter son logement pendant la coupure','C) Prévenir le service des eaux avant mardi','D) Appeler un plombier après la coupure'], 'C', 'Elle peut appeler avant mardi ; la ville lui apporte de l''eau.', NULL);

  -- Sujet 5 : Un marché de producteurs en centre-ville (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'A2', 'Un marché de producteurs en centre-ville', 'Tous les vendredis après-midi, un nouveau marché de producteurs s''installe place de la République, en centre-ville. Une quinzaine d''agriculteurs de la région y vendent des fruits, des légumes, du fromage et du pain. Tout est produit à moins de cinquante kilomètres de la ville. La mairie a lancé ce marché parce que beaucoup d''habitants voulaient acheter des produits frais sans aller au supermarché. Les prix sont un peu plus élevés qu''en grande surface, mais les clients disent que les produits sont meilleurs. Le marché est ouvert de 16 h à 20 h, ce qui permet de venir après le travail. Certains commerçants du centre-ville regrettent cependant que les clients achètent moins dans leurs magasins le vendredi.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Que raconte cet article ?', ARRAY['A) La fermeture d''un supermarché du centre-ville','B) L''ouverture d''un marché de producteurs locaux','C) La création d''un magasin de vêtements','D) Un concours de cuisine pour les habitants'], 'B', 'L''article présente un nouveau marché de producteurs, ouvert le vendredi.', NULL),
    (v_scenario_4, 2, 'Pourquoi la mairie a-t-elle créé ce marché ?', ARRAY['A) Beaucoup d''habitants souhaitaient des produits frais','B) Les agriculteurs demandaient plus de place','C) Les supermarchés étaient devenus trop chers','D) Les commerçants voulaient vendre le dimanche'], 'A', 'La mairie répond à des habitants qui voulaient acheter des produits frais.', NULL),
    (v_scenario_4, 3, 'D''où viennent les produits vendus ?', ARRAY['A) De plusieurs pays d''Europe','B) D''un grand magasin du centre-ville','C) D''une usine de la région','D) De fermes situées près de la ville'], 'D', 'Tout est produit à moins de cinquante kilomètres de la ville.', NULL),
    (v_scenario_4, 4, 'Pourquoi les horaires sont-ils pratiques ?', ARRAY['A) Le marché ouvre très tôt le matin','B) Le marché reste ouvert toute la nuit','C) On peut venir après le travail','D) Il n''y a personne le week-end'], 'C', 'Le marché est ouvert de 16 h à 20 h, après la journée de travail.', NULL),
    (v_scenario_4, 5, 'Que regrettent certains commerçants ?', ARRAY['A) Le marché fait trop de bruit','B) Le vendredi, les clients achètent moins chez eux','C) Les prix du marché sont trop bas','D) La mairie a fermé leurs magasins'], 'B', 'Ils constatent que les clients achètent moins dans leurs magasins le vendredi.', NULL);

END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : B1 | Thématique : Santé, formation, logement, assurance maladie, numérique | 5 sujet(s)
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
  -- Sujet 1 : Consignes avant une prise de sang (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'B1', 'Consignes avant une prise de sang', 'Information aux patients — Analyses sanguines. Si votre médecin vous a prescrit une prise de sang, voici les conseils du laboratoire. Pour certaines analyses, il faut être à jeun : ne mangez rien pendant les douze heures qui précèdent le prélèvement, mais vous pouvez boire de l''eau. Prenez vos médicaments habituels, sauf avis contraire de votre médecin. Le laboratoire est ouvert du lundi au vendredi de 7 h 30 à 12 h sans rendez-vous, et sur rendez-vous l''après-midi. Le matin, l''attente est parfois longue entre 8 h et 9 h ; si vous le pouvez, venez plutôt après 10 h. N''oubliez pas d''apporter votre ordonnance, votre carte vitale et votre carte de mutuelle. Les résultats sont disponibles au bout de deux jours ouvrables sur le site du laboratoire, ou par courrier si vous en faites la demande. En cas de résultat inquiétant, le laboratoire prévient directement votre médecin.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'À qui s''adresse cette information ?', ARRAY['A) Aux médecins qui prescrivent des analyses','B) Aux personnes qui cherchent un emploi au laboratoire','C) Aux personnes qui doivent faire une prise de sang','D) Aux patients qui sont hospitalisés depuis longtemps'], 'C', 'Le texte donne des conseils aux patients qui ont une prescription d''analyses sanguines.', NULL),
    (v_scenario_0, 2, 'Que faut-il faire pour certaines analyses ?', ARRAY['A) Ne pas manger pendant une demi-journée','B) Arrêter tous ses médicaments la veille','C) Boire beaucoup d''eau juste avant le prélèvement','D) Prendre un repas léger le matin même'], 'A', 'Pour certaines analyses, il faut être à jeun pendant douze heures.', NULL),
    (v_scenario_0, 3, 'Quand vaut-il mieux venir pour attendre moins longtemps ?', ARRAY['A) Dès l''ouverture du laboratoire, à 7 h 30','B) Entre 8 h et 9 h, quand il y a du monde','C) Le samedi matin, sans rendez-vous','D) Plus tard dans la matinée, après 10 h'], 'D', 'L''attente est plus longue entre 8 h et 9 h ; le laboratoire conseille de venir après 10 h.', NULL),
    (v_scenario_0, 4, 'Comment peut-on obtenir ses résultats ?', ARRAY['A) Sur place, le jour même du prélèvement','B) Sur le site du laboratoire, en principe sous deux jours','C) Par un appel du médecin le lendemain','D) Par un courrier envoyé automatiquement'], 'B', 'Les résultats sont en ligne au bout de deux jours ouvrables, ou par courrier sur demande.', NULL),
    (v_scenario_0, 5, 'Dans quel cas le laboratoire contacte-t-il le médecin ?', ARRAY['A) Quand le patient a oublié son ordonnance','B) Quand le patient n''était pas à jeun','C) Quand un résultat est préoccupant','D) Quand les résultats sont publiés en retard'], 'C', 'En cas de résultat inquiétant, le laboratoire prévient directement le médecin.', NULL);

  -- Sujet 2 : Reprendre des cours de français (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'B1', 'Reprendre des cours de français', 'Le mardi et le jeudi soir, une vingtaine d''adultes se retrouvent dans une salle de la mairie pour apprendre le français. Beaucoup suivent ces cours ___________ (1) ils veulent mieux communiquer au travail et aider leurs enfants avec les devoirs. Le professeur, très patient, donne des exercices ___________ (2) les élèves corrigent ensemble en classe. Amina, arrivée en France il y a deux ans, explique : « Depuis que je ___________ (3) ces cours, je n''ai plus peur de téléphoner à l''administration. » Elle reconnaît toutefois que la grammaire reste difficile : il faut souvent répéter une phrase plusieurs fois ___________ (4) de la retenir. Chaque année en juin, les élèves passent un examen ___________ (5) valider leur niveau et obtenir une attestation. Les places sont limitées, et la liste d''attente est déjà longue. La mairie cherche donc des bénévoles pour ouvrir un troisième groupe en janvier, afin de répondre à toutes les demandes.', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) mais','B) donc','C) car','D) pourtant'], 'C', '« Car » donne la raison : les élèves suivent les cours parce qu''ils veulent mieux communiquer.', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) qui','B) que','C) dont','D) où'], 'B', 'Les exercices sont le complément direct de « corrigent » : on utilise le pronom « que ».', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) suivrai','B) suivais','C) suivrais','D) suis'], 'D', 'Après « depuis que », l''action continue au présent : « je suis ces cours ».', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) avant','B) après','C) pendant','D) depuis'], 'A', 'On répète plusieurs fois une phrase avant de la retenir : « avant de » + infinitif.', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) sans','B) contre','C) pour','D) malgré'], 'C', '« Pour valider » exprime le but de l''examen.', 5);

  -- Sujet 3 : Quatre annonces de logement (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'B1', 'Quatre annonces de logement', NULL, '[{"label": "Studio près de la gare", "content": "Studio meublé de 25 m², au 3e étage avec ascenseur, à cinq minutes à pied de la gare. Loyer de 520 € charges comprises. Libre dès le 1er novembre. Animaux non acceptés. Contacter l''agence Horizon du lundi au vendredi."}, {"label": "Appartement avec jardin", "content": "Appartement de 65 m² avec petit jardin, dans un quartier calme, à vingt minutes du centre en bus. Loyer de 780 € par mois hors charges. Animaux acceptés. Idéal pour une famille. Visite possible le samedi sur rendez-vous."}, {"label": "Chambre en colocation", "content": "Chambre dans un appartement partagé avec deux autres personnes, cuisine et salon communs. Loyer de 390 € toutes charges comprises. Le colocataire recherché doit être non-fumeur et disponible pour un entretien avec les deux autres. Libre immédiatement."}, {"label": "Maison de 90 m² au village", "content": "Maison de 90 m² avec trois chambres et garage, dans un village à quinze kilomètres de la ville, sans transports en commun. Loyer de 900 € par mois. Un revenu net égal à trois fois le loyer est demandé. Libre en janvier."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Je viens d''arriver, je travaille en ville, je n''ai pas de voiture et je veux vivre seul avec un budget de 550 € par mois, charges comprises. Quelle annonce peut me convenir ?', ARRAY['A) Appartement avec jardin','B) Studio près de la gare','C) Chambre en colocation','D) Maison de 90 m² au village'], 'B', 'Le studio coûte 520 € charges comprises et se trouve près des transports.', NULL),
    (v_scenario_2, 2, 'Nous sommes quatre, avec un chien, et nous cherchons un endroit calme avec un peu d''espace dehors. Quelle annonce peut nous convenir ?', ARRAY['A) Studio près de la gare','B) Chambre en colocation','C) Maison de 90 m² au village','D) Appartement avec jardin'], 'D', 'L''appartement a un petit espace extérieur, accepte les animaux et convient à une famille.', NULL),
    (v_scenario_2, 3, 'Je suis étudiant, j''ai très peu de revenus, je ne fume pas et cela ne me gêne pas de partager la cuisine. Quelle annonce peut me convenir ?', ARRAY['A) Chambre en colocation','B) Studio près de la gare','C) Appartement avec jardin','D) Maison de 90 m² au village'], 'A', 'La chambre est bon marché, en partage, et demande un colocataire non-fumeur.', NULL),
    (v_scenario_2, 4, 'Je gagne bien ma vie, j''ai une voiture et je souhaite un logement plus spacieux, à la campagne, à partir de janvier. Quelle annonce peut me convenir ?', ARRAY['A) Studio près de la gare','B) Appartement avec jardin','C) Maison de 90 m² au village','D) Chambre en colocation'], 'C', 'La maison de 90 m² est libre en janvier, à la campagne, sans transports en commun.', NULL),
    (v_scenario_2, 5, 'Je ne peux visiter que le samedi et je veux une location où les animaux sont acceptés. Quelle annonce peut me convenir ?', ARRAY['A) Studio près de la gare','B) Appartement avec jardin','C) Chambre en colocation','D) Maison de 90 m² au village'], 'B', 'Les visites ont lieu le samedi sur rendez-vous et les animaux sont acceptés.', NULL);

  -- Sujet 4 : Dossier de remboursement incomplet (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'B1', 'Dossier de remboursement incomplet', E'Objet : votre demande de remboursement — dossier incomplet\n\nMadame, Monsieur,\n\nNous avons bien reçu votre demande de remboursement du 3 septembre concernant une consultation chez un spécialiste. Toutefois, votre dossier est incomplet : la feuille de soins n''est pas signée et l''attestation de votre médecin traitant est absente. Nous ne pouvons donc pas traiter votre demande pour le moment. Pour que votre dossier soit examiné, vous devez nous renvoyer les deux documents avant le 30 octobre, soit par courrier, soit en les déposant sur votre compte en ligne. Passé ce délai, votre demande sera classée sans suite, ce qui vous obligera à recommencer la démarche depuis le début. Si vous n''avez plus l''attestation, votre médecin peut la refaire gratuitement lors d''un rendez-vous ou par téléphone. Le remboursement est en général versé dans un délai de dix jours après réception d''un dossier complet. Pour toute question, vous pouvez appeler notre service ou vous rendre à l''accueil de votre caisse, sans rendez-vous, le matin.\n\nLe service des remboursements', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Pourquoi ce courrier est-il envoyé ?', ARRAY['A) Pour confirmer le remboursement d''une consultation','B) Pour signaler des documents manquants','C) Pour annoncer un changement de médecin traitant','D) Pour informer d''une hausse des cotisations'], 'B', 'La caisse explique que le dossier est incomplet et qu''elle ne peut pas le traiter.', NULL),
    (v_scenario_3, 2, 'Quels documents manquent ?', ARRAY['A) Une carte d''identité et un justificatif de domicile récent','B) Une ordonnance et une facture détaillée du spécialiste','C) Un relevé d''identité bancaire et un contrat de travail','D) Une feuille de soins signée et une attestation du médecin'], 'D', 'La feuille de soins n''est pas signée et l''attestation du médecin traitant est absente.', NULL),
    (v_scenario_3, 3, 'Que doit faire l''assuré avant le 30 octobre ?', ARRAY['A) Renvoyer les documents par courrier ou en ligne','B) Prendre rendez-vous à l''accueil de la caisse d''assurance','C) Payer des frais de traitement supplémentaires à la caisse','D) Refaire toute la demande depuis le début'], 'A', 'Il doit renvoyer les deux documents, par courrier ou sur son compte en ligne.', NULL),
    (v_scenario_3, 4, 'Que se passe-t-il si l''assuré ne répond pas à temps ?', ARRAY['A) Le remboursement est versé avec un mois de retard','B) Le dossier passe au service d''un autre médecin','C) La demande est abandonnée et il faut recommencer','D) Une pénalité est retirée sur le remboursement'], 'C', 'Après la date limite, la demande est classée sans suite et la démarche est à refaire.', NULL),
    (v_scenario_3, 5, 'Que peut faire l''assuré qui a perdu l''attestation ?', ARRAY['A) Écrire à la caisse pour qu''elle en établisse une nouvelle','B) En demander une nouvelle à son médecin, sans payer','C) Se passer de ce document si le reste est complet','D) Attendre le versement du remboursement d''abord'], 'B', 'Le médecin peut refaire l''attestation gratuitement, en rendez-vous ou par téléphone.', NULL);

  -- Sujet 5 : Des permanences pour les démarches en ligne (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'B1', 'Des permanences pour les démarches en ligne', 'De plus en plus de démarches administratives se font uniquement sur Internet : demande de titre, inscription à l''école, déclaration d''impôts. Pour beaucoup d''habitants, cette évolution est un progrès ; pour d''autres, elle devient un vrai obstacle. Dans le quartier des Hauts-Prés, une association a donc ouvert une permanence numérique, deux matins par semaine, où des bénévoles aident les personnes à créer un compte, à scanner un document ou à envoyer un formulaire. « Beaucoup de gens viennent parce qu''ils n''ont pas d''ordinateur, mais d''autres ont un téléphone et ne savent pas s''en servir pour ce genre de démarche », explique la responsable, Claire Morel. En trois mois, plus de deux cents personnes ont été accompagnées, surtout des retraités et des personnes qui apprennent le français. L''association précise toutefois qu''elle ne peut pas faire les démarches à la place des usagers : les bénévoles expliquent, mais c''est la personne qui clique et qui garde ses identifiants confidentiels. Certains regrettent que le service ne soit ouvert que deux matins par semaine, alors que les demandes augmentent. La mairie étudie la possibilité d''ajouter une permanence en soirée.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Quel constat l''article fait-il ?', ARRAY['A) Les démarches en ligne sont devenues plus rapides pour chacun','B) Les habitants préfèrent désormais se rendre à la mairie','C) Les démarches en ligne posent problème à certains habitants','D) Les administrations ont abandonné Internet pour les formulaires'], 'C', 'Pour certains habitants, la dématérialisation devient un vrai obstacle.', NULL),
    (v_scenario_4, 2, 'Pourquoi l''association a-t-elle ouvert cette permanence ?', ARRAY['A) Pour aider des personnes en difficulté numérique','B) Pour vendre des ordinateurs à prix réduit aux habitants','C) Pour former de futurs bénévoles aux outils numériques','D) Pour remplacer un service de la mairie'], 'A', 'Des bénévoles aident à créer un compte, scanner un document ou envoyer un formulaire.', NULL),
    (v_scenario_4, 3, 'Que montre la citation de la responsable ?', ARRAY['A) Chacun possède un ordinateur chez soi','B) Les bénévoles prêtent des téléphones aux usagers','C) Les usagers refusent d''apprendre à s''en servir','D) Le manque de matériel n''est pas le seul obstacle'], 'D', 'Certains ont un téléphone mais ne savent pas l''utiliser pour ces démarches.', NULL),
    (v_scenario_4, 4, 'Quelle règle les bénévoles respectent-ils ?', ARRAY['A) Ils gardent les identifiants pour éviter les erreurs','B) Ils expliquent, l''usager fait la démarche','C) Ils envoient les formulaires à distance','D) Ils demandent une petite somme pour chaque aide'], 'B', 'Ils ne font pas les démarches à la place des usagers, qui gardent leurs identifiants.', NULL),
    (v_scenario_4, 5, 'Quelle réserve certains expriment-ils ?', ARRAY['A) Les bénévoles ne sont pas assez bien formés au numérique','B) L''association refuse d''aider les retraités du quartier','C) La permanence n''est pas ouverte assez souvent','D) La mairie a supprimé l''ancien service d''aide'], 'C', 'Certains regrettent que le service ne soit ouvert que deux matins par semaine.', NULL);

END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : B2 | Thématique : École, énergie, engagement citoyen, mobilité, santé et société | 5 sujet(s)
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
  -- Sujet 1 : Nouveau calendrier à l'école (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'B2', 'Nouveau calendrier à l''école', 'Chers parents, à la rentrée prochaine, l''école Jean-Moulin expérimentera un nouveau calendrier hebdomadaire. Après une consultation menée auprès des familles et des enseignants, le conseil d''école a retenu une semaine de quatre jours, avec classe le lundi, le mardi, le jeudi et le vendredi, de 8 h 30 à 16 h 30. Cette organisation répond à une demande fréquente : laisser aux enfants un mercredi entier de repos ou d''activités, ce qui devrait réduire la fatigue en fin de semaine. Certains parents, toutefois, s''inquiètent des difficultés de garde, notamment ceux qui travaillent le mercredi. Pour répondre à cette préoccupation, la mairie propose un accueil de loisirs le mercredi, de 7 h 30 à 18 h 30, dont le tarif dépendra des revenus de la famille. Les inscriptions ouvriront en mai, et les places seront attribuées en priorité aux enfants dont les deux parents travaillent. Cette expérience durera un an : un bilan sera dressé en juin prochain avec les familles, et le conseil d''école décidera alors de la poursuivre, de la modifier ou d''y mettre fin. Nous vous invitons à répondre au questionnaire joint avant le 15 avril, votre avis nous étant précieux.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est l''objet principal de cette lettre ?', ARRAY['A) Annoncer la fermeture définitive de l''école le mercredi matin','B) Informer les familles d''une hausse des tarifs de l''accueil de loisirs','C) Présenter un changement d''organisation et demander l''avis des familles','D) Convoquer les parents à une réunion exceptionnelle du conseil d''école'], 'C', 'La lettre présente une expérimentation et invite les familles à répondre à un questionnaire.', NULL),
    (v_scenario_0, 2, 'Quel avantage est attendu de cette nouvelle semaine ?', ARRAY['A) Une meilleure récupération des enfants en fin de semaine','B) Des journées de classe nettement plus courtes pour les élèves','C) Des devoirs moins nombreux à la maison pendant la semaine','D) Un budget de fonctionnement plus faible pour la commune'], 'A', 'Un mercredi de repos devrait réduire la fatigue des enfants en fin de semaine.', NULL),
    (v_scenario_0, 3, 'Quelle difficulté certains parents redoutent-ils ?', ARRAY['A) Payer un tarif unique plus élevé pour la cantine','B) Emmener leurs enfants beaucoup plus tôt le lundi','C) Faire face à des classes trop chargées dans l''école','D) Trouver une solution de garde le mercredi'], 'D', 'Certains parents, surtout ceux qui travaillent le mercredi, s''inquiètent des difficultés de garde.', NULL),
    (v_scenario_0, 4, 'Sur quelle base les places de l''accueil de loisirs seront-elles attribuées ?', ARRAY['A) Elles seront données dans l''ordre exact des inscriptions','B) Elles iront d''abord aux enfants dont les deux parents travaillent','C) Elles seront réservées aux élèves les plus jeunes de l''école','D) Elles seront tirées au sort parmi toutes les familles inscrites'], 'B', 'La priorité est donnée aux enfants dont les deux parents travaillent.', NULL),
    (v_scenario_0, 5, 'Que prévoit la lettre à la fin de l''expérience ?', ARRAY['A) L''adoption automatique de la nouvelle semaine dans l''école','B) Un bilan avec les familles avant de décider de la suite','C) Un retour immédiat à l''ancien calendrier scolaire','D) Un vote des parents pour choisir les nouveaux horaires'], 'B', 'Un bilan sera dressé en juin avec les familles, puis le conseil d''école décidera.', NULL);

  -- Sujet 2 : Les économies d'énergie à la maison (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'B2', 'Les économies d''énergie à la maison', 'Avec la hausse du prix de l''énergie, de nombreux ménages cherchent à réduire leur facture sans renoncer à leur confort. Les spécialistes rappellent que les progrès les plus rapides passent par des gestes simples. Baisser le chauffage d''un degré, par exemple, réduit sensiblement la consommation. Éteindre la lumière en quittant une pièce ou dégivrer régulièrement son congélateur produit des effets comparables, à peu de frais ; ces habitudes, une fois prises, ne demandent presque aucun effort au quotidien. Les fenêtres mal isolées, ___________ (1) s''échappe une grande partie de la chaleur, restent pourtant la première source de pertes dans les logements anciens. Une bonne isolation ne produit toutefois son effet qu''à condition que les murs ___________ (2) secs avant le début des travaux ; sinon, l''humidité finit par dégrader les matériaux. Beaucoup de foyers surveillent de près leur chauffage. ___________ (3), ils négligent l''eau chaude, qui représente pourtant une part importante de la facture. Quant aux appareils en veille, leur consommation paraît minime, mais elle s''accumule sur toute l''année : si les ménages ___________ (4) systématiquement leurs appareils en veille, la consommation baisserait sensiblement. Reste enfin la question de l''investissement. Les gros travaux, comme le changement de fenêtres ou de chaudière, sont coûteux, mais ils ___________ (5) en quelques années grâce aux économies réalisées. Des aides existent parfois pour les foyers modestes ; il est donc utile de se renseigner avant de commencer.', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) lesquelles','B) par lesquelles','C) dont','D) auxquelles'], 'B', 'Il faut « par » + « lesquelles » : la chaleur s''échappe par les fenêtres. Les autres pronoms ne s''accordent pas avec la construction.', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) sont','B) seront','C) soient','D) étaient'], 'C', 'Après « à condition que », on emploie le subjonctif : « soient ».', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) En revanche','B) Par conséquent','C) C''est pourquoi','D) Ainsi'], 'A', 'La phrase oppose la surveillance du chauffage à la négligence de l''eau chaude. Les autres expressions introduisent une conséquence, ce qui n''a pas de sens ici.', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) éteindraient','B) éteindront','C) éteignent','D) éteignaient'], 'D', 'La phrase exprime une hypothèse : « si » + imparfait, puis conditionnel (« baisserait »).', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) s''épuisent','B) s''amortissent','C) s''aggravent','D) se dégradent'], 'B', 'Des travaux coûteux « s''amortissent » quand les économies réalisées finissent par compenser leur prix.', 5);

  -- Sujet 3 : Quatre façons de s'engager dans sa commune (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'B2', 'Quatre façons de s''engager dans sa commune', NULL, '[{"label": "Conseil de quartier", "content": "Les conseils de quartier réunissent chaque trimestre des habitants volontaires, des associations et un élu. Ils étudient les projets qui concernent le quartier (circulation, espaces verts, sécurité) et remettent des propositions au conseil municipal. Il s''agit d''un engagement sur la durée : il faut s''inscrire pour un mandat d''un an et assister aux réunions du soir, mais aucune compétence particulière n''est demandée."}, {"label": "Bénévolat ponctuel", "content": "La ville tient une liste de bénévoles disponibles pour des missions de quelques heures : aider à installer une fête de quartier, accompagner une sortie scolaire ou distribuer des repas lors d''une journée solidaire. Chacun choisit les missions qui l''intéressent et peut refuser sans se justifier. Aucun engagement régulier n''est demandé, et une simple pièce d''identité suffit pour s''inscrire."}, {"label": "Association de parents d''élèves", "content": "Ouverte à tous les parents, y compris ceux dont les enfants viennent d''entrer à l''école, cette association fait le lien entre les familles et l''équipe éducative. Ses membres siègent aux conseils d''école, organisent des événements pour financer des sorties et relaient les questions des parents. La participation est réservée aux personnes ayant un enfant scolarisé dans l''établissement."}, {"label": "Maraude solidaire", "content": "Le soir, par équipes de trois, des bénévoles vont à la rencontre des personnes sans abri pour leur proposer une boisson chaude et les orienter vers un hébergement. Une formation obligatoire de deux jours est proposée avant la première sortie ; elle porte sur l''écoute et la sécurité. L''engagement est régulier : une soirée par semaine pendant au moins six mois."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Je suis très occupé par mon travail et mes horaires changent chaque semaine, mais j''aimerais rendre service de temps en temps, selon mes disponibilités. Quelle forme d''engagement peut me convenir ?', ARRAY['A) Conseil de quartier','B) Association de parents d''élèves','C) Bénévolat ponctuel','D) Maraude solidaire'], 'C', 'Les missions durent quelques heures, chacun choisit celles qu''il veut et aucun engagement régulier n''est demandé.', NULL),
    (v_scenario_2, 2, 'Je voudrais contribuer aux décisions qui concernent la circulation et les espaces verts de ma rue et de ses environs, et je suis prêt à m''engager pour une année. Quelle forme d''engagement peut me convenir ?', ARRAY['A) Conseil de quartier','B) Bénévolat ponctuel','C) Association de parents d''élèves','D) Maraude solidaire'], 'A', 'Le conseil étudie ces sujets et l''inscription se fait pour un mandat d''un an.', NULL),
    (v_scenario_2, 3, 'Mon fils vient d''entrer en primaire et je voudrais être en contact avec l''équipe pédagogique tout en aidant à financer les sorties de la classe. Quelle forme d''engagement peut me convenir ?', ARRAY['A) Conseil de quartier','B) Bénévolat ponctuel','C) Maraude solidaire','D) Association de parents d''élèves'], 'D', 'Cette association fait le lien avec l''équipe éducative et organise des événements pour financer des sorties.', NULL),
    (v_scenario_2, 4, 'J''ai une soirée libre chaque semaine et je souhaite aider directement des personnes en grande précarité, après avoir été formé à cela. Quelle forme d''engagement peut me convenir ?', ARRAY['A) Conseil de quartier','B) Maraude solidaire','C) Bénévolat ponctuel','D) Association de parents d''élèves'], 'B', 'La maraude demande une soirée par semaine et une formation obligatoire avant la première sortie.', NULL),
    (v_scenario_2, 5, 'Je voudrais que mes idées sur un projet local soient transmises aux élus, mais je ne peux m''engager que le soir. Quelle forme d''engagement peut me convenir ?', ARRAY['A) Conseil de quartier','B) Bénévolat ponctuel','C) Association de parents d''élèves','D) Maraude solidaire'], 'A', 'Les réunions ont lieu le soir et les propositions sont remises au conseil municipal.', NULL);

  -- Sujet 4 : Aide municipale à l'achat d'un vélo (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'B2', 'Aide municipale à l''achat d''un vélo', E'Objet : votre demande d''aide à l''achat d''un vélo — décision et démarches à suivre\n\nMadame, Monsieur,\n\nNous avons le plaisir de vous informer que votre demande d''aide municipale à l''achat d''un vélo a reçu un avis favorable. Le montant de l''aide, plafonné à 30 % du prix d''achat TTC, ne pourra toutefois pas dépasser 250 euros, quel que soit le prix du vélo. Cette somme vous sera versée par virement, uniquement après réception des justificatifs ci-dessous.\n\nVous disposez de trois mois à compter de la date du présent courrier pour acheter votre vélo auprès d''un commerçant de l''agglomération et nous transmettre : la facture détaillée et acquittée, portant votre nom ; un relevé d''identité bancaire ; ainsi qu''un justificatif de domicile de moins de trois mois. Les achats effectués auprès d''un particulier ou sur un site situé en dehors de l''agglomération ne sont pas éligibles. Si l''achat intervient après l''expiration de ce délai, l''aide sera annulée ; toutefois, en cas de rupture de stock chez le commerçant, vous pouvez demander par écrit une prolongation d''un mois, en joignant une attestation du magasin.\n\nLe versement intervient en général dans les six semaines suivant la réception d''un dossier complet. Cette aide n''est attribuée qu''une seule fois par foyer sur une période de cinq ans. Si vous n''êtes pas d''accord avec cette décision, vous pouvez saisir le service par courrier dans un délai de deux mois.\n\nLe service Mobilités', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Quel est l''objet principal de ce courrier ?', ARRAY['A) Refuser une demande faute de pièces suffisantes','B) Proposer un prêt pour financer l''achat d''un vélo','C) Rappeler les règles de circulation à vélo en ville','D) Confirmer une aide et expliquer comment l''obtenir'], 'D', 'Le courrier annonce un avis favorable puis détaille les démarches pour obtenir le versement.', NULL),
    (v_scenario_3, 2, 'Comment le montant de l''aide est-il limité ?', ARRAY['A) Il est fixe et identique pour chaque demandeur de la commune','B) Il représente une part du prix, avec un maximum de 250 euros','C) Il dépend des revenus du foyer et de sa composition familiale','D) Il couvre le prix total du vélo dans la limite de 250 euros'], 'B', 'L''aide est plafonnée à 30 % du prix et ne peut dépasser 250 euros.', NULL),
    (v_scenario_3, 3, 'Quels achats ne donnent pas droit à l''aide ?', ARRAY['A) Ceux achetés à un particulier ou hors agglomération','B) Ceux faits dans un magasin situé dans l''agglomération','C) Ceux dont le prix dépasse le plafond de 250 euros','D) Ceux dont le paiement est fait par virement bancaire'], 'A', 'Les achats auprès d''un particulier ou d''un site hors agglomération ne sont pas éligibles.', NULL),
    (v_scenario_3, 4, 'Dans quel cas peut-on obtenir un délai supplémentaire ?', ARRAY['A) Si le demandeur part en vacances pendant tout l''été','B) Si la facture est établie au nom d''un autre membre du foyer','C) En cas de rupture de stock, sur attestation du magasin','D) Si le dossier est déposé avant la fin du premier mois'], 'C', 'Une prolongation d''un mois est possible en cas de rupture de stock, sur demande écrite avec attestation.', NULL),
    (v_scenario_3, 5, 'Que se passe-t-il pour une personne déjà aidée il y a deux ans ?', ARRAY['A) Elle reçoit une aide réduite de moitié cette fois-ci','B) Elle ne peut pas recevoir l''aide une seconde fois','C) Elle doit rembourser la première aide à la commune','D) Elle peut obtenir l''aide pour l''achat d''un second vélo'], 'B', 'L''aide n''est attribuée qu''une fois par foyer sur cinq ans.', NULL);

  -- Sujet 5 : Les écrans chez les jeunes enfants (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'B2', 'Les écrans chez les jeunes enfants', E'Tablettes, télévision, smartphones : les écrans occupent une place croissante dans le quotidien des jeunes enfants. Selon une enquête menée auprès de plusieurs centaines de familles, un enfant de trois ans passe en moyenne plus d''une heure par jour devant un écran, et cette durée augmente nettement les jours de pluie ou les week-ends. Les pédiatres s''en inquiètent : ils soulignent que les enfants apprennent d''abord à parler en interagissant avec des adultes, et qu''un écran, même de qualité, ne remplace pas cet échange.\n\nLes parents, eux, se disent partagés. Beaucoup reconnaissent utiliser les écrans pour obtenir un moment de calme, notamment lorsqu''ils travaillent à domicile ou préparent le repas. Certains y voient aussi un outil éducatif, à condition de choisir des contenus adaptés. Les psychologues nuancent cette idée : selon eux, ce n''est pas seulement la durée qui compte, mais aussi la manière dont l''écran est utilisé. Regarder un dessin animé avec un adulte qui commente et pose des questions n''a pas les mêmes effets que laisser l''enfant seul devant une vidéo qui défile.\n\nFaut-il pour autant tout interdire ? Les spécialistes n''y croient guère. Ils recommandent plutôt de fixer des règles simples : pas d''écran pendant les repas ni avant le coucher, des moments sans écran en famille, et une vigilance accrue sur les contenus. Ils rappellent enfin que l''exemple des adultes joue un rôle déterminant : un enfant voit rarement l''intérêt de lâcher sa tablette si ses parents ne quittent jamais leur téléphone.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Quel constat l''article établit-il ?', ARRAY['A) Les écrans sont désormais interdits pour les enfants de moins de trois ans','B) Les jeunes enfants passent beaucoup de temps devant des écrans','C) Les enfants apprennent à parler plus tôt grâce aux tablettes','D) Les parents réduisent partout l''usage des écrans à la maison'], 'B', 'Un enfant de trois ans passe en moyenne plus d''une heure par jour devant un écran.', NULL),
    (v_scenario_4, 2, 'Pourquoi les pédiatres sont-ils inquiets ?', ARRAY['A) Les écrans abîment durablement la vue des jeunes enfants','B) Les enfants dorment moins de dix heures par nuit à cause des écrans','C) Les contenus éducatifs coûtent trop cher pour de nombreuses familles','D) Un écran ne remplace pas l''échange avec un adulte pour apprendre à parler'], 'D', 'Les enfants apprennent à parler en interagissant avec des adultes.', NULL),
    (v_scenario_4, 3, 'Comment les parents justifient-ils l''usage des écrans ?', ARRAY['A) Ils y trouvent un moment de calme et parfois un intérêt éducatif','B) Ils pensent que leurs enfants s''endorment plus vite le soir','C) Ils veulent que leurs enfants apprennent à lire beaucoup plus tôt','D) Ils suivent les recommandations des pédiatres sur ce sujet'], 'A', 'Les parents évoquent le besoin de calme et, pour certains, un outil éducatif.', NULL),
    (v_scenario_4, 4, 'Que soulignent les psychologues ?', ARRAY['A) Seule la durée d''exposition a un effet sur le développement','B) Les dessins animés sont plus nocifs que les jeux vidéo','C) La façon d''utiliser l''écran compte autant que la durée','D) Les adultes doivent laisser l''enfant regarder seul les vidéos'], 'C', 'Ce n''est pas seulement la durée qui compte, mais aussi la manière dont l''écran est utilisé.', NULL),
    (v_scenario_4, 5, 'Quelle position les spécialistes adoptent-ils face aux écrans ?', ARRAY['A) Ils demandent une interdiction avant l''âge de six ans','B) Ils préfèrent encadrer l''usage plutôt que l''interdire','C) Ils estiment que les parents ont peu d''influence sur le sujet','D) Ils conseillent de laisser chaque enfant se réguler seul'], 'B', 'Ils recommandent des règles simples plutôt qu''une interdiction complète.', NULL);

END $$;
