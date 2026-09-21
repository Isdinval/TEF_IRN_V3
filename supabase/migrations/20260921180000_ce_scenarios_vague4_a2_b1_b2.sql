-- Pratique CE — vague 4 (15 sujets, 75 questions) : 4e sujet par couple niveau × format (A2, B1, B2 × 5 formats).
-- Thèmes distincts des vagues précédentes. Généré avec le skill llamakusi-ce-scenario-content.
-- À exécuter UNE seule fois (garde-fou ci-dessous).

DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.ce_scenarios WHERE title = 'Règles de la piscine municipale') THEN RAISE EXCEPTION 'Vague 4 CE déjà appliquée'; END IF; END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : A2 | Thématique : Piscine, voisinage, petites annonces, banque, sport local | 5 sujet(s)
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
  -- Sujet 1 : Règles de la piscine municipale (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'A2', 'Règles de la piscine municipale', 'Piscine municipale — règles pour les visiteurs. Pour entrer dans l''eau, il faut prendre une douche et mettre un maillot de bain : les shorts et les t-shirts sont interdits. Les enfants de moins de huit ans doivent toujours être accompagnés d''un adulte dans le bassin. La piscine est ouverte du mardi au dimanche, de 10 h à 19 h. L''entrée coûte trois euros pour un adulte et un euro cinquante pour un enfant. On peut laisser ses affaires dans un casier : il faut une pièce de un euro, qui est rendue quand on ouvre le casier.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est le but de ce texte ?', ARRAY['A) Annoncer la fermeture de la piscine pour des travaux','B) Proposer des cours de natation aux habitants','C) Présenter les prix d''un nouveau club de sport','D) Expliquer les règles à respecter à la piscine'], 'D', 'Le texte donne les règles pour les visiteurs de la piscine.', NULL),
    (v_scenario_0, 2, 'Que doit-on faire avant d''entrer dans l''eau ?', ARRAY['A) Prendre une douche','B) Payer un casier supplémentaire','C) Montrer un certificat médical','D) Se sécher les cheveux longuement'], 'A', 'Il faut prendre une douche et mettre un maillot de bain.', NULL),
    (v_scenario_0, 3, 'Quel vêtement est interdit dans l''eau ?', ARRAY['A) Un maillot de bain','B) Un short','C) Un bonnet de bain','D) Des lunettes de natation'], 'B', 'Les shorts et les t-shirts sont interdits.', NULL),
    (v_scenario_0, 4, 'Que doivent faire les enfants de moins de huit ans ?', ARRAY['A) Nager seulement dans le petit bassin','B) Porter des brassards pendant toute la séance','C) Rester avec un adulte dans le bassin','D) Arriver à la piscine avant 10 heures'], 'C', 'Les enfants de moins de huit ans doivent être accompagnés d''un adulte dans le bassin.', NULL),
    (v_scenario_0, 5, 'Quel jour la piscine est-elle fermée ?', ARRAY['A) Le dimanche','B) Le lundi','C) Le mardi','D) Le samedi'], 'B', 'La piscine est ouverte du mardi au dimanche : elle est fermée le lundi.', NULL);

  -- Sujet 2 : Un mot pour ma voisine (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'A2', 'Un mot pour ma voisine', 'Bonjour Madame Lopez, je suis votre nouveau voisin du deuxième étage. Je m''appelle Ibrahim et j''habite ici ___________ (1) trois semaines. Hier soir, ma musique était trop forte : je suis désolé, je n''___________ (2) pas fait attention. Ce week-end, je vais faire une petite fête pour ma famille, ___________ (3) la fête finira avant minuit. Si vous avez un problème, vous pouvez frapper à ma porte ___________ (4) n''importe quel moment. Je vous propose de venir ___________ (5) un gâteau chez moi dimanche : vous serez la bienvenue ! Je vous souhaite une bonne journée. À bientôt, Ibrahim', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) il y a','B) dans','C) depuis','D) en'], 'C', '« J''habite ici depuis trois semaines » indique le début d''une situation qui continue.', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) ai','B) suis','C) ont','D) était'], 'A', 'Le verbe « faire » se conjugue avec « avoir » : « je n''ai pas fait attention ».', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) donc','B) parce que','C) ou','D) mais'], 'D', '« Mais » introduit la promesse : il y aura une fête, mais elle finira avant minuit.', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) de','B) à','C) en','D) sur'], 'B', 'On dit « à n''importe quel moment ».', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) manger','B) mangé','C) mangez','D) mangeant'], 'A', 'Après « proposer de venir », on utilise l''infinitif : « venir manger ».', 5);

  -- Sujet 3 : Quatre petites annonces (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'A2', 'Quatre petites annonces', NULL, '[{"label": "Vélo pour adulte", "content": "Vends vélo pour adulte, bon état, avec deux paniers. Prix : 60 euros. Je le garde jusqu''à samedi. Vous pouvez venir le voir le soir après 18 h, au 5 rue des Lilas. Paiement en argent uniquement."}, {"label": "Canapé gratuit", "content": "Je donne mon canapé bleu à la personne qui vient le chercher. Il est trop grand pour mon salon. Il faut être deux pour le porter et avoir un camion. Disponible seulement ce week-end, appelez-moi le matin."}, {"label": "Poussette pour bébé", "content": "Vends poussette pour bébé de 0 à 3 ans, presque neuve, avec un sac. Prix : 90 euros, discutable. Vous pouvez la récupérer chez moi ou je peux la porter à la mairie le mercredi."}, {"label": "Table et chaises", "content": "Vends table de cuisine avec quatre chaises, en bois. Prix : 120 euros. Livraison possible dans le quartier pour 15 euros. Contact par message uniquement, pas d''appel."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Je n''ai pas d''argent et je peux venir avec une camionnette ce samedi. Quelle annonce peut me convenir ?', ARRAY['A) Vélo pour adulte','B) Canapé gratuit','C) Poussette pour bébé','D) Table et chaises'], 'B', 'Le canapé est donné : il faut venir le chercher ce week-end avec un camion.', NULL),
    (v_scenario_2, 2, 'Je viens d''avoir un enfant et je cherche un objet pas trop cher pour le promener. Quelle annonce peut me convenir ?', ARRAY['A) Poussette pour bébé','B) Vélo pour adulte','C) Canapé gratuit','D) Table et chaises'], 'A', 'La poussette est presque neuve et coûte 90 euros, prix discutable.', NULL),
    (v_scenario_2, 3, 'Je travaille la journée, je veux un objet pour aller au travail et je peux passer seulement le soir. Quelle annonce peut me convenir ?', ARRAY['A) Canapé gratuit','B) Poussette pour bébé','C) Vélo pour adulte','D) Table et chaises'], 'C', 'Le vélo se visite le soir après 18 h.', NULL),
    (v_scenario_2, 4, 'Je viens d''emménager, je n''ai pas de voiture et je veux qu''on m''apporte le meuble. Je préfère écrire un message. Quelle annonce peut me convenir ?', ARRAY['A) Vélo pour adulte','B) Canapé gratuit','C) Poussette pour bébé','D) Table et chaises'], 'D', 'La livraison est possible dans le quartier et le contact se fait par message.', NULL),
    (v_scenario_2, 5, 'Je veux payer moins de 70 euros et je peux passer avant samedi. Quelle annonce peut me convenir ?', ARRAY['A) Canapé gratuit','B) Vélo pour adulte','C) Poussette pour bébé','D) Table et chaises'], 'B', 'Le vélo coûte 60 euros et il est disponible jusqu''à samedi.', NULL);

  -- Sujet 4 : Un rendez-vous à la banque (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'A2', 'Un rendez-vous à la banque', E'Objet : votre rendez-vous pour l''ouverture d''un compte\n\nMadame, Monsieur,\n\nNous vous confirmons votre rendez-vous à l''agence de la place du Marché le mardi 20 octobre à 14 h 30 pour ouvrir un compte bancaire. Le rendez-vous dure environ quarante-cinq minutes. Pour ouvrir votre compte, apportez une pièce d''identité, un justificatif de domicile de moins de trois mois et votre dernier bulletin de salaire ou un contrat de travail. Si vous ne pouvez pas venir, prévenez-nous au moins un jour avant par téléphone ou en ligne, et nous choisirons une autre date. L''agence est ouverte du mardi au samedi. Vous recevrez votre carte bancaire par courrier sous une semaine. Nous vous remercions de votre confiance.\n\nVotre agence', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Pourquoi ce courrier est-il envoyé ?', ARRAY['A) Pour refuser l''ouverture d''un compte bancaire','B) Pour annoncer la fermeture de l''agence du quartier','C) Pour confirmer un rendez-vous à l''agence','D) Pour demander de payer des frais bancaires'], 'C', 'Le courrier confirme un rendez-vous pour ouvrir un compte.', NULL),
    (v_scenario_3, 2, 'Quel jour a lieu le rendez-vous ?', ARRAY['A) Le mardi 20 octobre','B) Le lundi 19 octobre','C) Le samedi 24 octobre','D) Le mercredi 21 octobre'], 'A', 'Le rendez-vous est le mardi 20 octobre à 14 h 30.', NULL),
    (v_scenario_3, 3, 'Que faut-il apporter ?', ARRAY['A) Une carte de séjour, un passeport et un acte de naissance','B) Un chèque, un relevé bancaire et une photo d''identité','C) Une facture d''électricité, une ordonnance et un diplôme','D) Une pièce d''identité, une preuve d''adresse et un document de travail'], 'D', 'Il faut une pièce d''identité, un justificatif de domicile et un bulletin de salaire ou un contrat.', NULL),
    (v_scenario_3, 4, 'Que doit faire le client s''il ne peut pas venir ?', ARRAY['A) Venir quand même le mardi suivant sans prévenir','B) Prévenir au moins un jour avant','C) Envoyer une autre personne à sa place','D) Payer des frais d''annulation à l''agence'], 'B', 'Il doit prévenir la banque au moins un jour avant, par téléphone ou en ligne.', NULL),
    (v_scenario_3, 5, 'Quand le client recevra-t-il sa carte bancaire ?', ARRAY['A) Le jour du rendez-vous, à l''agence','B) Par e-mail, après trois jours','C) Par courrier, dans une semaine','D) À l''agence, quinze jours plus tard'], 'C', 'La carte arrive par courrier sous une semaine.', NULL);

  -- Sujet 5 : Un tournoi de football pour les jeunes (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'A2', 'Un tournoi de football pour les jeunes', 'Dimanche dernier, le stade municipal a accueilli un tournoi de football pour les jeunes du quartier. Douze équipes de garçons et de filles de 10 à 14 ans ont joué toute la journée. Le tournoi a été organisé par le club du quartier avec l''aide de parents bénévoles, qui ont préparé des sandwichs et des boissons. Plus de deux cents personnes sont venues encourager les équipes. La finale a eu lieu à 17 heures : l''équipe des Lions a battu l''équipe des Étoiles par trois buts à deux. « L''important, c''est de jouer ensemble, pas de gagner », a dit l''entraîneur des Étoiles. Le président du club est content, mais il cherche encore un deuxième terrain, parce que le stade est trop petit quand il y a beaucoup de matchs. Le prochain tournoi aura lieu en juin.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Que raconte cet article ?', ARRAY['A) Un match entre deux équipes de professionnels','B) La construction d''un nouveau stade municipal','C) Un cours de football pour les adultes du quartier','D) Un tournoi de football organisé pour des jeunes'], 'D', 'L''article raconte un tournoi de football pour les jeunes du quartier.', NULL),
    (v_scenario_4, 2, 'Qui a aidé à organiser le tournoi ?', ARRAY['A) Des parents bénévoles','B) Des joueurs professionnels','C) Les enseignants de l''école','D) Des employés de la mairie'], 'A', 'Le club a organisé le tournoi avec l''aide de parents bénévoles.', NULL),
    (v_scenario_4, 3, 'Quelle équipe a gagné la finale ?', ARRAY['A) L''équipe des Étoiles','B) Une équipe venue d''une autre ville','C) L''équipe des Lions','D) Le match s''est terminé sans vainqueur'], 'C', 'Les Lions ont battu les Étoiles par trois buts à deux.', NULL),
    (v_scenario_4, 4, 'Que dit l''entraîneur des Étoiles ?', ARRAY['A) Son équipe a joué très mal pendant la finale','B) Jouer ensemble est plus important que gagner','C) Le stade est trop petit pour tous les matchs','D) Les parents ont mal organisé le tournoi'], 'B', 'Il dit que l''important est de jouer ensemble, pas de gagner.', NULL),
    (v_scenario_4, 5, 'Quel problème le président du club veut-il résoudre ?', ARRAY['A) Il manque des joueurs pour le club','B) Il manque un terrain supplémentaire','C) Les boissons coûtent trop cher aux familles','D) Les entraîneurs sont trop peu nombreux'], 'B', 'Il cherche un deuxième terrain car le stade est trop petit.', NULL);

END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : B1 | Thématique : Consommation, budget, formation du soir, sport, culture | 5 sujet(s)
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
  -- Sujet 1 : Échanges et remboursements en magasin (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'B1', 'Échanges et remboursements en magasin', 'Conditions d''échange et de remboursement — Magasin Casa Verde. Vous pouvez échanger ou faire rembourser un article dans les quatorze jours qui suivent votre achat, à condition de présenter votre ticket de caisse. L''article doit être en parfait état : il ne doit pas avoir été porté ni utilisé, et il doit être dans son emballage d''origine avec toutes ses étiquettes. Attention, certains produits ne peuvent pas être repris pour des raisons d''hygiène, comme les sous-vêtements, les maillots de bain et les produits de beauté ouverts. Le remboursement se fait sur le moyen de paiement utilisé lors de l''achat : en espèces si vous avez payé en espèces, sur votre carte si vous avez payé par carte. Si vous préférez, nous pouvons vous proposer un avoir, valable un an dans tous nos magasins. Pour les achats réalisés pendant les soldes, seul l''échange est possible. En cas de doute, n''hésitez pas à demander conseil au service client, à l''entrée du magasin.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'À quoi sert ce document ?', ARRAY['A) À présenter les produits en promotion cette semaine','B) À expliquer comment rendre un article acheté','C) À annoncer l''ouverture d''un nouveau magasin en ville','D) À informer d''une réduction sur les paiements par carte'], 'B', 'Le document détaille les conditions pour échanger ou faire rembourser un article.', NULL),
    (v_scenario_0, 2, 'Quelle condition faut-il remplir pour un remboursement ?', ARRAY['A) Présenter le ticket de caisse sous quatorze jours','B) Avoir acheté l''article pendant la période des soldes','C) Payer les frais de retour du produit au magasin','D) Garder l''article au moins une semaine chez soi'], 'A', 'Il faut rendre l''article dans les quatorze jours avec le ticket de caisse.', NULL),
    (v_scenario_0, 3, 'Quel article ne peut pas être rendu ?', ARRAY['A) Un pull avec toutes ses étiquettes','B) Un manteau dans son emballage d''origine','C) Une paire de chaussures non portées','D) Un maillot de bain'], 'D', 'Les maillots de bain ne sont pas repris pour des raisons d''hygiène.', NULL),
    (v_scenario_0, 4, 'Comment le client est-il remboursé ?', ARRAY['A) Par un avoir valable pendant un an','B) Par un virement sur son compte bancaire','C) Avec le même moyen de paiement que pour l''achat','D) En espèces, quel que soit le paiement utilisé'], 'C', 'Le remboursement se fait sur le moyen de paiement utilisé lors de l''achat.', NULL),
    (v_scenario_0, 5, 'Que peut-on faire pour un article acheté pendant les soldes ?', ARRAY['A) Se le faire rembourser en espèces au magasin','B) Seulement l''échanger contre un autre article','C) Le rendre après un mois sans justificatif','D) L''échanger contre un avoir valable deux ans'], 'B', 'Pendant les soldes, seul l''échange est possible.', NULL);

  -- Sujet 2 : Gérer son budget (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'B1', 'Gérer son budget', 'Gérer son budget n''est pas toujours facile, surtout quand les dépenses augmentent plus vite que les revenus. Pourtant, quelques habitudes simples permettent de mieux ___________ (1) son argent. La première consiste à noter, pendant un mois, tout ce que l''on dépense. Beaucoup de personnes découvrent alors qu''elles ___________ (2) beaucoup plus qu''elles ne le pensaient pour des petits achats du quotidien. Il est ensuite utile de séparer les dépenses obligatoires, ___________ (3) le loyer et les factures font partie, des dépenses de loisirs. Si les premières ne peuvent pas être supprimées, les secondes peuvent souvent être réduites. Certains conseillers recommandent aussi de mettre chaque mois une petite somme de côté, même modeste, ___________ (4) faire face à un imprévu, comme une panne de voiture ou une facture de santé. Enfin, comparer les prix avant d''acheter permet de ne pas dépenser ___________ (5) nécessaire. Ces gestes demandent un peu de temps au début, mais ils deviennent vite une habitude.', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) gère','B) géré','C) gérer','D) gérant'], 'C', 'Après « mieux », on utilise l''infinitif : « mieux gérer son argent ».', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) dépensent','B) gagnent','C) économisent','D) reçoivent'], 'A', 'Il s''agit de petits achats : les personnes découvrent qu''elles dépensent plus qu''elles ne pensaient.', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) que','B) dont','C) où','D) qui'], 'B', 'On dit « faire partie de » : le pronom « dont » remplace « de » + les dépenses obligatoires.', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) sans','B) avant','C) après','D) pour'], 'D', '« Pour faire face à un imprévu » exprime le but de l''épargne.', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) plus que le','B) plus de','C) plus pour le','D) plus dans le'], 'A', 'On dit « ne pas dépenser plus que le nécessaire » : « plus que » compare avec ce qui est nécessaire.', 5);

  -- Sujet 3 : Quatre cours du soir (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'B1', 'Quatre cours du soir', NULL, '[{"label": "Informatique pour débutants", "content": "Ce cours apprend à utiliser un ordinateur : envoyer un e-mail, écrire un document, chercher sur Internet. Il a lieu le lundi de 18 h à 20 h pendant douze semaines. Aucun niveau n''est demandé, mais il faut apporter son propre ordinateur portable. Prix : 80 euros pour tout le trimestre."}, {"label": "Français pour la vie professionnelle", "content": "Destiné aux personnes qui parlent déjà français au niveau A2 ou plus, ce cours prépare aux entretiens d''embauche et à la rédaction de courriers. Il se déroule le mardi et le jeudi soir pendant deux mois. Le cours est gratuit pour les demandeurs d''emploi, 60 euros pour les autres."}, {"label": "Cuisine du monde", "content": "Un atelier de cuisine où chaque semaine on prépare un repas différent, que l''on mange ensemble à la fin. Le cours a lieu le mercredi à 19 h, sans inscription à l''année : on paie 12 euros par séance et on vient quand on veut. Il n''y a pas de niveau requis."}, {"label": "Comptabilité de base", "content": "Ce cours forme à tenir les comptes d''une petite entreprise ou d''une association. Il demande d''être à l''aise avec les chiffres et de disposer d''un ordinateur. Trente heures réparties sur dix semaines, le vendredi soir. Une attestation est remise à la fin, à condition d''avoir suivi au moins 80 % des séances."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Je viens de perdre mon emploi, je m''exprime bien à l''oral mais j''ai du mal à rédiger des courriers pour chercher du travail, et je ne veux pas payer. Quel cours peut me convenir ?', ARRAY['A) Informatique pour débutants','B) Cuisine du monde','C) Français pour la vie professionnelle','D) Comptabilité de base'], 'C', 'Le cours est gratuit pour les demandeurs d''emploi et prépare à la rédaction de courriers.', NULL),
    (v_scenario_2, 2, 'Je n''ai jamais utilisé un ordinateur, je veux apprendre le lundi soir et j''ai un ordinateur portable. Quel cours peut me convenir ?', ARRAY['A) Informatique pour débutants','B) Français pour la vie professionnelle','C) Cuisine du monde','D) Comptabilité de base'], 'A', 'Le cours a lieu le lundi soir, sans niveau demandé, avec son propre ordinateur portable.', NULL),
    (v_scenario_2, 3, 'Je suis disponible seulement le mercredi soir, je ne veux pas m''engager pour toute l''année et j''aime manger avec d''autres personnes. Quel cours peut me convenir ?', ARRAY['A) Informatique pour débutants','B) Français pour la vie professionnelle','C) Comptabilité de base','D) Cuisine du monde'], 'D', 'Le cours a lieu le mercredi, se paie par séance et se termine par un repas partagé.', NULL),
    (v_scenario_2, 4, 'Je m''occupe des comptes d''une association et je voudrais une attestation à la fin de la formation, le vendredi soir. Quel cours peut me convenir ?', ARRAY['A) Informatique pour débutants','B) Comptabilité de base','C) Français pour la vie professionnelle','D) Cuisine du monde'], 'B', 'Le cours a lieu le vendredi soir et une attestation est remise si l''on suit 80 % des séances.', NULL),
    (v_scenario_2, 5, 'Je passe des entretiens d''embauche la semaine prochaine et j''ai un niveau A2 : je voudrais m''y préparer. Quel cours peut me convenir ?', ARRAY['A) Informatique pour débutants','B) Cuisine du monde','C) Français pour la vie professionnelle','D) Comptabilité de base'], 'C', 'Ce cours est ouvert dès le niveau A2 et prépare aux entretiens d''embauche.', NULL);

  -- Sujet 4 : Inscription à un club sportif (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'B1', 'Inscription à un club sportif', E'Objet : inscription à la saison 2026-2027 — club de badminton\n\nMadame, Monsieur,\n\nNous vous remercions de votre intérêt pour le club de badminton des Hauts-Prés. Pour finaliser votre inscription à la saison 2026-2027, qui débute le 5 octobre, merci de nous retourner votre dossier complet avant le 2 octobre. Il doit comporter : la fiche d''inscription remplie et signée, un certificat médical daté de moins de trois mois et attestant l''absence de contre-indication à la pratique du badminton, une photo d''identité et le règlement de la cotisation. La cotisation annuelle est de 90 euros pour un adulte et de 60 euros pour un mineur ; elle peut être payée en trois fois, à condition de remettre les trois chèques au moment de l''inscription. Les entraînements ont lieu le mardi et le jeudi soir, de 19 h à 21 h, au gymnase municipal. Chaque nouveau membre peut effectuer une séance d''essai gratuite avant de s''engager, sur simple demande. Attention : sans certificat médical, l''accès au gymnase sera refusé à partir de la deuxième séance. Nous restons à votre disposition pour toute question.\n\nLe bureau du club', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Quel est l''objet de ce courrier ?', ARRAY['A) Annoncer l''annulation de la saison sportive','B) Proposer un tarif réduit pour les enfants du quartier','C) Convoquer les membres à une assemblée générale','D) Expliquer les démarches pour s''inscrire au club'], 'D', 'Le courrier détaille le dossier et les conditions d''inscription au club.', NULL),
    (v_scenario_3, 2, 'Quel document doit dater de moins de trois mois ?', ARRAY['A) La fiche d''inscription du club','B) Le certificat médical','C) La photo d''identité du candidat','D) Le justificatif de paiement de la cotisation'], 'B', 'Le certificat médical doit être daté de moins de trois mois.', NULL),
    (v_scenario_3, 3, 'Comment peut-on payer la cotisation ?', ARRAY['A) En trois fois, avec trois chèques remis dès l''inscription','B) En douze fois par prélèvement chaque mois','C) En espèces après la première séance d''essai','D) Par virement bancaire à la fin de la saison'], 'A', 'Le paiement en trois fois est possible si les trois chèques sont remis à l''inscription.', NULL),
    (v_scenario_3, 4, 'Que peut faire un nouveau membre avant de s''engager ?', ARRAY['A) Payer seulement la moitié de la cotisation annuelle','B) Assister aux entraînements sans certificat pendant un mois','C) Faire une séance d''essai gratuite sur demande','D) Choisir librement les jours de ses entraînements'], 'C', 'Chaque nouveau membre peut faire une séance d''essai gratuite.', NULL),
    (v_scenario_3, 5, 'Que se passe-t-il sans certificat médical ?', ARRAY['A) La cotisation est augmentée de dix euros','B) L''entrée au gymnase est refusée dès la deuxième séance','C) L''inscription est annulée immédiatement','D) Le membre s''entraîne seulement le jeudi soir'], 'B', 'Sans certificat, l''accès au gymnase est refusé à partir de la deuxième séance.', NULL);

  -- Sujet 5 : Les librairies indépendantes résistent (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'B1', 'Les librairies indépendantes résistent', 'Face aux grandes plateformes de vente en ligne, on annonçait la disparition des petites librairies. Pourtant, dans plusieurs villes, celles-ci résistent mieux que prévu. À Rivière-sur-Mer, la librairie Les Pages Vives a même ouvert un second point de vente l''an dernier. Sa gérante, Sophie Marchand, explique son choix : « On ne peut pas rivaliser sur les prix ni sur la rapidité, alors on propose autre chose : des conseils personnalisés, des rencontres avec des auteurs et un lieu où l''on a envie de rester. » Chaque mois, la librairie organise ainsi une lecture publique ou une discussion, qui attire une trentaine de personnes. Les clients apprécient cette ambiance : beaucoup disent venir autant pour discuter que pour acheter. Un autre atout est la commande sur mesure : un livre absent des rayons est en général disponible en quarante-huit heures, sans frais supplémentaires. Ces librairies ne sont pas pour autant à l''abri. Leurs marges sont faibles, les loyers augmentent, et les jeunes lecteurs achètent moins souvent des livres en papier. Pour tenir, elles comptent sur la fidélité de leurs clients, mais aussi sur le soutien des communes, qui commencent à aider les commerces culturels.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Quel constat l''article fait-il ?', ARRAY['A) Les petites librairies résistent mieux qu''on ne le pensait','B) Les librairies ont presque toutes disparu en quelques années','C) Les plateformes en ligne ont fermé leurs boutiques physiques','D) Les librairies vendent moins de livres qu''il y a dix ans'], 'A', 'Contrairement aux prévisions, les petites librairies résistent.', NULL),
    (v_scenario_4, 2, 'Comment la librairie de Rivière-sur-Mer se distingue-t-elle des plateformes ?', ARRAY['A) Par des prix plus bas que ceux du marché en ligne','B) Par une livraison plus rapide à domicile','C) Par les conseils et les rencontres proposés aux clients','D) Par un grand choix de livres numériques'], 'C', 'La gérante propose des conseils personnalisés et des rencontres avec des auteurs.', NULL),
    (v_scenario_4, 3, 'Pourquoi les clients apprécient-ils ce lieu ?', ARRAY['A) On y trouve des livres moins chers qu''ailleurs','B) On y emprunte gratuitement des livres à la maison','C) On y reçoit un petit cadeau à chaque achat','D) On peut y discuter, pas seulement acheter'], 'D', 'Beaucoup de clients viennent autant pour discuter que pour acheter.', NULL),
    (v_scenario_4, 4, 'Quel service existe pour un livre absent des rayons ?', ARRAY['A) Un envoi gratuit sous une semaine environ','B) Une commande en général disponible en deux jours','C) Le prêt d''un livre équivalent à lire sur place','D) Le remboursement de la différence de prix'], 'B', 'Le livre est en général disponible en quarante-huit heures, sans frais.', NULL),
    (v_scenario_4, 5, 'Quelle difficulté rencontrent ces librairies ?', ARRAY['A) Un manque de livres à proposer aux clients','B) De faibles marges et des loyers en hausse','C) Une interdiction de vendre des livres en ligne','D) Un nombre insuffisant de libraires formés'], 'B', 'Leurs marges sont faibles et les loyers augmentent.', NULL);

END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : B2 | Thématique : Numérique au travail, lecture, démarches, formation, tourisme | 5 sujet(s)
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
  -- Sujet 1 : Mots de passe : nouvelle politique de sécurité (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'B2', 'Mots de passe : nouvelle politique de sécurité', 'Note à l''ensemble du personnel — À compter du 1er janvier, une nouvelle politique de sécurité informatique s''appliquera à tous les salariés. Constatant que plusieurs tentatives de piratage ont réussi grâce à des mots de passe trop simples, la direction a décidé de renforcer les règles. Désormais, les mots de passe devront comporter au moins douze caractères et ne seront plus renouvelés tous les trois mois, comme c''était le cas jusqu''ici : les experts estiment en effet que des changements trop fréquents poussent les utilisateurs à choisir des mots de passe faibles ou à les noter. En revanche, chaque salarié devra activer une double authentification, avec un code envoyé sur son téléphone professionnel. Un gestionnaire de mots de passe sera mis à disposition gratuitement, afin d''éviter d''avoir à mémoriser de nombreux identifiants. Des sessions de formation de trente minutes seront organisées en décembre ; elles ne sont pas obligatoires, mais fortement recommandées. Enfin, nous rappelons qu''un salarié qui constate une activité suspecte doit la signaler immédiatement au service informatique, sans chercher à résoudre le problème seul. Ce signalement ne donnera lieu à aucune sanction, même si l''erreur vient du salarié lui-même.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est l''objet principal de cette note ?', ARRAY['A) Annoncer un changement de logiciel de messagerie interne','B) Présenter de nouvelles règles pour les mots de passe','C) Informer les salariés d''une attaque informatique récente','D) Rappeler l''interdiction d''utiliser son téléphone au travail'], 'B', 'La note présente la nouvelle politique de sécurité, centrée sur les mots de passe.', NULL),
    (v_scenario_0, 2, 'Pourquoi la direction renforce-t-elle les règles ?', ARRAY['A) Le coût des logiciels de sécurité a fortement augmenté','B) Les salariés ont demandé des mots de passe plus courts','C) Un audit a révélé des erreurs dans le service informatique','D) Des piratages dus à des mots de passe simples'], 'D', 'Plusieurs tentatives de piratage ont réussi grâce à des mots de passe trop simples.', NULL),
    (v_scenario_0, 3, 'Qu''est-ce qui change pour le renouvellement des mots de passe ?', ARRAY['A) Il ne sera plus obligatoire tous les trois mois','B) Il aura lieu chaque mois pour tous les salariés','C) Il sera confié au service informatique de l''entreprise','D) Il ne concernera que les responsables d''équipe'], 'A', 'Les mots de passe ne seront plus renouvelés tous les trois mois.', NULL),
    (v_scenario_0, 4, 'Pourquoi cette évolution est-elle justifiée ?', ARRAY['A) Le renouvellement coûte trop cher à l''entreprise','B) Les mots de passe très longs se retiennent facilement','C) Des changements fréquents font choisir des mots faibles','D) Les téléphones professionnels ne peuvent pas les stocker'], 'C', 'Selon les experts, des changements trop fréquents poussent à choisir des mots de passe faibles ou à les noter.', NULL),
    (v_scenario_0, 5, 'Que doit faire un salarié qui remarque une activité suspecte ?', ARRAY['A) Essayer d''abord de régler lui-même le problème technique','B) La signaler tout de suite au service informatique','C) Attendre la fin de la journée avant de réagir','D) En parler à son responsable après la formation'], 'B', 'Il doit la signaler immédiatement, sans chercher à résoudre le problème seul.', NULL);

  -- Sujet 2 : Lire à l'ère du numérique (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'B2', 'Lire à l''ère du numérique', 'On entend souvent dire que les jeunes ne lisent plus. La réalité est plus nuancée : ils lisent beaucoup, mais autrement. Les messages, les articles en ligne et les réseaux sociaux occupent une grande partie de leur temps, ___________ (1) la lecture de romans recule nettement. Certains enseignants y voient un danger, car la lecture longue développe la concentration et l''imagination. Ils redoutent que les jeunes perdent peu à peu l''habitude de suivre un raisonnement dans la durée. D''autres estiment que l''important est de ne pas opposer ces pratiques : un lecteur qui aime les histoires les trouvera aussi bien sur un écran que dans un livre. Encore faut-il que l''école lui en donne le goût. Plusieurs établissements ont ainsi instauré un quart d''heure de lecture quotidien, ___________ (2) les élèves choisissent eux-mêmes leur livre, sans qu''aucune note ne ___________ (3) attribuée. Les premiers résultats sont encourageants : les élèves ___________ (4) volontiers à cette pause, et certains finissent par emprunter des livres à la bibliothèque du collège. Les bibliothécaires constatent d''ailleurs que les prêts de bandes dessinées augmentent. On peut se demander si ces lectures légères conduiront à des textes plus exigeants. Nul ne le sait, mais les spécialistes rappellent que la curiosité ne se décrète pas : elle naît quand l''enfant se sent libre de choisir, ___________ (5) de lui imposer une liste de livres à lire.', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) parce que','B) alors que','C) pourvu que','D) afin que'], 'B', 'La phrase oppose la place des écrans à la baisse de la lecture de romans : « alors que » exprime l''opposition.', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) auquel','B) duquel','C) lequel','D) pendant lequel'], 'D', 'Le pronom relatif compose avec « pendant » : la pause pendant laquelle les élèves choisissent leur livre.', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) soit','B) est','C) sera','D) a été'], 'A', 'Après « sans que », on emploie le subjonctif : « soit ».', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) se méfient','B) se moquent','C) se prêtent','D) se plaignent'], 'C', 'On dit « se prêter à » quelque chose ; les autres verbes se construisent avec « de ».', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) au lieu','B) à cause','C) afin','D) faute'], 'A', '« Au lieu de lui imposer » exprime l''alternative : choisir librement plutôt que se voir imposer une liste.', 5);

  -- Sujet 3 : Quatre services pour être aidé dans ses démarches (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'B2', 'Quatre services pour être aidé dans ses démarches', NULL, '[{"label": "Point d''accès au droit", "content": "Des juristes reçoivent gratuitement les habitants pour les informer sur leurs droits : logement, travail, famille, étrangers. Les consultations se font sur rendez-vous, par périodes de trente minutes, et restent confidentielles. Le service ne représente pas les personnes devant un tribunal et ne rédige pas les recours à leur place : il oriente vers l''avocat ou l''association compétente."}, {"label": "Écrivain public", "content": "Un écrivain public aide à rédiger des lettres, des demandes et des dossiers administratifs pour les personnes qui ont des difficultés à écrire en français. Il reçoit sans rendez-vous le mardi et le vendredi matin, à la mairie annexe. Le service est gratuit pour les habitants de la commune, mais l''écrivain public ne remplit pas les démarches en ligne."}, {"label": "Médiateur de la consommation", "content": "En cas de litige avec un commerçant ou un fournisseur, le médiateur propose une solution amiable, sans avoir recours à un procès. Il faut avoir d''abord écrit à l''entreprise sans obtenir de réponse satisfaisante depuis au moins deux mois. La procédure est gratuite et dure en général trois mois. La décision proposée n''est pas obligatoire : chacun peut la refuser, et le médiateur reste neutre entre le client et l''entreprise."}, {"label": "Permanence numérique", "content": "Un conseiller numérique accompagne les personnes qui doivent réaliser une démarche en ligne : création d''un compte, envoi d''un document, prise de rendez-vous. Il n''agit pas à la place de l''usager, qui doit apporter ses identifiants et son propre téléphone ou ordinateur. Le service est gratuit et ouvert à tous les habitants. Accueil sans rendez-vous le jeudi après-midi, dans la médiathèque."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Mon commerçant a refusé de me rembourser un appareil défectueux et il ne répond plus à mes courriers depuis trois mois. Je veux éviter un procès. Quel service peut m''aider ?', ARRAY['A) Point d''accès au droit','B) Médiateur de la consommation','C) Écrivain public','D) Permanence numérique'], 'B', 'Le médiateur propose une solution amiable après plus de deux mois sans réponse satisfaisante.', NULL),
    (v_scenario_2, 2, 'Je comprends bien le français à l''oral, mais j''ai des difficultés pour écrire une lettre de réclamation à mon propriétaire, et je préfère passer sans rendez-vous. Quel service peut m''aider ?', ARRAY['A) Point d''accès au droit','B) Médiateur de la consommation','C) Permanence numérique','D) Écrivain public'], 'D', 'L''écrivain public aide à rédiger des lettres et reçoit sans rendez-vous le mardi et le vendredi.', NULL),
    (v_scenario_2, 3, 'Je voudrais savoir quels sont mes droits face à un licenciement, gratuitement et en toute confidentialité. Quel service peut m''aider ?', ARRAY['A) Point d''accès au droit','B) Écrivain public','C) Médiateur de la consommation','D) Permanence numérique'], 'A', 'Les juristes informent gratuitement sur le travail, sur rendez-vous, dans la confidentialité.', NULL),
    (v_scenario_2, 4, 'Je dois créer un compte pour une démarche administrative en ligne et je n''ai jamais utilisé Internet, mais je peux venir avec mon téléphone un jeudi. Quel service peut m''aider ?', ARRAY['A) Point d''accès au droit','B) Écrivain public','C) Permanence numérique','D) Médiateur de la consommation'], 'C', 'Le conseiller accompagne les démarches en ligne le jeudi après-midi, sans rendez-vous.', NULL),
    (v_scenario_2, 5, 'Je voudrais qu''un professionnel m''explique ma situation juridique, en sachant que je devrai ensuite engager moi-même un avocat. Quel service peut m''aider ?', ARRAY['A) Point d''accès au droit','B) Écrivain public','C) Médiateur de la consommation','D) Permanence numérique'], 'A', 'Ce service informe et oriente, mais ne représente pas devant un tribunal.', NULL);

  -- Sujet 4 : Report ou annulation d'une inscription à une formation (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'B2', 'Report ou annulation d''une inscription à une formation', E'Objet : conditions de report et d''annulation de votre inscription — session d''octobre\n\nMadame, Monsieur,\n\nNous accusons réception de votre inscription à la formation « Gestion de projet » qui débutera le 12 octobre. Afin de vous permettre d''organiser au mieux votre participation, nous vous rappelons ci-dessous les conditions de report et d''annulation.\n\nVous pouvez annuler gratuitement votre inscription jusqu''au 28 septembre inclus, par simple courrier électronique. Entre le 29 septembre et le 6 octobre, l''annulation reste possible, mais 30 % du prix de la formation sont retenus au titre des frais de dossier. Passé cette date, aucune annulation ne pourra donner lieu à remboursement, sauf en cas de force majeure dûment justifiée, par exemple une hospitalisation ou un décès dans la famille proche ; dans ce cas, un justificatif devra nous être transmis dans un délai de huit jours.\n\nLe report de votre inscription sur une autre session est également possible, à raison d''un seul report par stagiaire et sans frais, à condition d''en faire la demande au moins cinq jours ouvrés avant le début de la formation. La nouvelle session devra avoir lieu dans les douze mois suivant la session initiale.\n\nEnfin, si le nombre de participants inscrits était inférieur à huit, nous nous réservons le droit d''annuler la session ; vous seriez alors informé au plus tard une semaine avant la date de début et intégralement remboursé, ou invité à choisir une autre session.\n\nLe service formation', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Quel est l''objet principal de ce courrier ?', ARRAY['A) Confirmer le paiement intégral de la formation d''octobre','B) Proposer un programme détaillé de la formation choisie','C) Rappeler les conditions d''annulation et de report','D) Annoncer l''annulation de la session d''octobre'], 'C', 'Le courrier rappelle les règles d''annulation et de report d''une inscription.', NULL),
    (v_scenario_3, 2, 'Quelle somme est retenue en cas d''annulation entre le 29 septembre et le 6 octobre ?', ARRAY['A) 30 % du prix de la formation','B) La totalité du prix de la formation','C) Un montant fixe de cent euros','D) La moitié du prix de la formation'], 'A', 'Entre ces deux dates, 30 % du prix sont retenus au titre des frais de dossier.', NULL),
    (v_scenario_3, 3, 'Dans quel cas un remboursement reste-t-il possible après le 6 octobre ?', ARRAY['A) Si le stagiaire choisit finalement une autre formation','B) Si l''employeur en fait la demande écrite','C) Si le stagiaire s''est inscrit tardivement','D) Pour une force majeure justifiée sous huit jours'], 'D', 'Après cette date, seul un cas de force majeure justifié dans un délai de huit jours ouvre droit au remboursement.', NULL),
    (v_scenario_3, 4, 'Quelle condition faut-il remplir pour reporter sans frais ?', ARRAY['A) Avoir déjà payé la totalité de la formation choisie','B) Faire la demande cinq jours ouvrés avant le début','C) Choisir une session dans le mois suivant','D) Obtenir l''accord écrit de son employeur'], 'B', 'Le report est gratuit s''il est demandé au moins cinq jours ouvrés avant le début.', NULL),
    (v_scenario_3, 5, 'Que se passe-t-il si moins de huit personnes sont inscrites ?', ARRAY['A) La formation est maintenue mais à un prix plus élevé','B) Les stagiaires doivent trouver d''autres participants','C) La session peut être annulée, avec remboursement','D) Le report devient obligatoire pour tous les inscrits'], 'C', 'L''organisme peut annuler la session ; les inscrits sont remboursés ou orientés vers une autre session.', NULL);

  -- Sujet 5 : Le tourisme de masse : les habitants à bout (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'B2', 'Le tourisme de masse : les habitants à bout', E'Chaque été, les mêmes images reviennent : des ruelles bondées, des plages surchargées, des habitants qui peinent à traverser leur propre quartier. Dans plusieurs villes très visitées, la fréquentation touristique a atteint un niveau que beaucoup jugent insupportable. Les riverains dénoncent d''abord la hausse des loyers, provoquée en partie par la multiplication des locations de courte durée : quand un propriétaire gagne plus en louant à des visiteurs qu''à un locataire à l''année, les logements se raréfient et les familles doivent s''éloigner du centre. S''ajoutent le bruit, la saleté et la transformation des commerces de proximité en boutiques de souvenirs.\n\nLes autorités locales ont commencé à réagir. Certaines villes limitent le nombre de jours pendant lesquels un logement peut être loué aux touristes, d''autres imposent des quotas de visiteurs sur les sites les plus fragiles ou instaurent une taxe d''entrée. Ces mesures suscitent toutefois des critiques : les professionnels du tourisme, dont dépendent de nombreux emplois, craignent une baisse de l''activité, tandis que certains habitants doutent de leur efficacité.\n\nPour les spécialistes, la solution passe moins par l''interdiction que par une meilleure répartition des flux : encourager les visiteurs à découvrir d''autres quartiers ou d''autres régions, étaler les séjours sur l''année et associer les habitants aux décisions. Car sans l''adhésion de ceux qui vivent sur place, préviennent-ils, un tourisme durable restera un slogan plutôt qu''une réalité.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Quel constat l''article établit-il ?', ARRAY['A) Le nombre de touristes baisse dans les grandes villes','B) La fréquentation touristique devient excessive','C) Les habitants réclament davantage de boutiques de souvenirs','D) Les locations de courte durée sont désormais interdites partout'], 'B', 'Beaucoup jugent la fréquentation touristique insupportable dans plusieurs villes.', NULL),
    (v_scenario_4, 2, 'Pourquoi les loyers augmentent-ils, selon les riverains ?', ARRAY['A) Les touristes achètent de plus en plus de logements','B) Les commerces de proximité ont fermé leurs portes','C) Les propriétaires doivent payer une taxe d''entrée','D) Louer aux visiteurs est plus rentable'], 'D', 'Les logements se raréfient car louer à des visiteurs est plus rentable.', NULL),
    (v_scenario_4, 3, 'Quelles mesures certaines villes ont-elles prises ?', ARRAY['A) Limiter les locations ou fixer des quotas','B) Interdire l''accès aux sites fragiles aux habitants','C) Supprimer les commerces destinés aux touristes','D) Baisser les loyers dans les quartiers historiques'], 'A', 'Certaines limitent les jours de location, d''autres imposent des quotas ou une taxe d''entrée.', NULL),
    (v_scenario_4, 4, 'Pourquoi ces mesures sont-elles critiquées ?', ARRAY['A) Elles ont fait augmenter le nombre de visiteurs dans les centres','B) Elles ne concernent que les habitants du centre-ville historique','C) Elles menacent des emplois et leur efficacité est douteuse','D) Elles ont été décidées sans étude préalable sérieuse des effets'], 'C', 'Les professionnels craignent une baisse d''activité et certains habitants doutent de leur efficacité.', NULL),
    (v_scenario_4, 5, 'Que préconisent les spécialistes ?', ARRAY['A) Interdire le tourisme dans les centres historiques','B) Répartir les visiteurs et consulter les habitants','C) Réserver les logements du centre aux touristes étrangers','D) Augmenter fortement le prix des séjours d''été en ville'], 'B', 'Ils recommandent une meilleure répartition des flux et l''association des habitants aux décisions.', NULL);

END $$;
