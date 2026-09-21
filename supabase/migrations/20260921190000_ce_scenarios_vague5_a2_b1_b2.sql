-- Pratique CE — vague 5 (15 sujets, 75 questions) : 5e et dernier sujet par couple niveau × format (A2, B1, B2 × 5 formats).
-- Objectif atteint : 75 sujets, 375 questions. Généré avec le skill llamakusi-ce-scenario-content.
-- À exécuter UNE seule fois (garde-fou ci-dessous).

DO $$ BEGIN IF EXISTS (SELECT 1 FROM public.ce_scenarios WHERE title = 'Horaires de la mairie pendant les vacances') THEN RAISE EXCEPTION 'Vague 5 CE déjà appliquée'; END IF; END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : A2 | Thématique : Mairie, rendez-vous médical, activités enfants, cours de français, parc | 5 sujet(s)
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
  -- Sujet 1 : Horaires de la mairie pendant les vacances (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'A2', 'Horaires de la mairie pendant les vacances', 'Information de la mairie — Vacances de la Toussaint. Du lundi 26 octobre au vendredi 30 octobre, la mairie change ses horaires. Elle sera ouverte seulement le matin, de 9 h à 12 h. L''après-midi, le service de l''état civil reste fermé, mais on peut demander un acte de naissance sur le site de la mairie. Le mardi soir, il n''y aura pas de permanence. Le service des cartes d''identité reçoit uniquement sur rendez-vous : appelez l''accueil ou réservez sur Internet. Le lundi 2 novembre, tous les services seront de nouveau ouverts comme d''habitude.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est le but de ce message ?', ARRAY['A) Annoncer la fermeture définitive de la mairie','B) Prévenir d''un changement d''horaires de la mairie','C) Inviter les habitants à une fête de la Toussaint','D) Présenter les nouveaux services de la ville'], 'B', 'La mairie prévient que ses horaires changent pendant les vacances.', NULL),
    (v_scenario_0, 2, 'Quand la mairie sera-t-elle ouverte cette semaine-là ?', ARRAY['A) Toute la journée, sauf le mardi','B) Seulement l''après-midi, après le travail','C) Le soir, à partir de 18 heures','D) Seulement le matin'], 'D', 'Elle sera ouverte seulement le matin, de 9 h à 12 h.', NULL),
    (v_scenario_0, 3, 'Que peut-on faire sur Internet ?', ARRAY['A) Demander un acte de naissance','B) Payer la cantine de l''école','C) Voter pour un projet de la ville','D) Louer une salle de la mairie'], 'A', 'On peut demander un acte de naissance sur le site de la mairie.', NULL),
    (v_scenario_0, 4, 'Comment obtient-on une carte d''identité cette semaine-là ?', ARRAY['A) En venant l''après-midi sans rendez-vous','B) En attendant le lundi 2 novembre','C) En prenant rendez-vous','D) En passant par la permanence du mardi'], 'C', 'Le service reçoit uniquement sur rendez-vous.', NULL),
    (v_scenario_0, 5, 'Quand tous les services rouvrent-ils normalement ?', ARRAY['A) Le lundi 2 novembre','B) Le vendredi 30 octobre','C) Le mardi 27 octobre','D) Le samedi 31 octobre'], 'A', 'Tous les services rouvrent normalement le lundi 2 novembre.', NULL);

  -- Sujet 2 : Un message pour prendre rendez-vous (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'A2', 'Un message pour prendre rendez-vous', 'Bonjour Docteur, je m''appelle Ana Silva et je voudrais prendre rendez-vous ___________ (1) vous. Depuis lundi, j''ai mal à la gorge et je tousse beaucoup. J''ai déjà pris des médicaments, mais je ne vais pas mieux. Je suis nouvelle dans le quartier et je n''ai pas encore de médecin. Je n''ai pas de fièvre, mais je suis très fatiguée. Je travaille le matin, donc je peux ___________ (2) seulement l''après-midi. Est-ce que vous avez une place jeudi ___________ (3) 15 heures ? Si ce n''est pas possible, vendredi me convient ___________ (4). Merci de me répondre ___________ (5) possible. Cordialement, Ana Silva', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) avec','B) pour','C) sans','D) contre'], 'A', 'On prend rendez-vous « avec » le médecin.', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) viens','B) venu','C) venir','D) venez'], 'C', 'Après « je peux », on utilise l''infinitif : « je peux venir ».', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) de','B) à','C) en','D) sur'], 'B', 'On donne l''heure avec « à » : « à 15 heures ».', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) mal','B) trop','C) peu','D) aussi'], 'D', 'Ana propose une autre possibilité : vendredi lui convient « aussi ».', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) dès que','B) depuis que','C) pendant que','D) pour que'], 'A', 'L''expression « dès que possible » signifie « le plus vite possible ».', 5);

  -- Sujet 3 : Quatre activités pour les enfants (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'A2', 'Quatre activités pour les enfants', NULL, '[{"label": "Cours de judo", "content": "Le judo est ouvert aux enfants de 5 à 10 ans le mercredi de 14 h à 15 h, au gymnase. Il faut un kimono et un certificat médical. La cotisation est de 70 euros pour l''année. Le premier cours est gratuit."}, {"label": "Atelier théâtre", "content": "Les enfants de 8 à 12 ans jouent une petite pièce. Cours le samedi de 10 h à 12 h à la maison des jeunes. Il n''y a pas d''équipement à acheter. Spectacle pour les parents en juin. Prix : 50 euros pour l''année."}, {"label": "Aide aux devoirs", "content": "Des bénévoles aident les enfants de l''école primaire à faire leurs devoirs, tous les soirs de 16 h 30 à 18 h, à l''école. C''est gratuit. Il faut inscrire l''enfant avant le 15 octobre auprès du directeur de l''école."}, {"label": "Cours de guitare", "content": "Le conservatoire propose des cours de guitare de 30 minutes pour les enfants à partir de 7 ans, le jeudi ou le samedi. Il faut acheter ou louer une guitare, à 5 euros par mois. Le cours coûte 120 euros par trimestre."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Ma fille a 6 ans et elle aime bouger. Nous voulons essayer gratuitement avant de payer. Quelle activité peut lui convenir ?', ARRAY['A) Atelier théâtre','B) Aide aux devoirs','C) Cours de judo','D) Cours de guitare'], 'C', 'Le premier cours de judo est gratuit et il est ouvert aux enfants de 5 à 10 ans.', NULL),
    (v_scenario_2, 2, 'Mon fils a 10 ans, il a du mal avec ses leçons et ses exercices du soir, et je ne veux pas payer. Quelle activité peut lui convenir ?', ARRAY['A) Aide aux devoirs','B) Cours de judo','C) Atelier théâtre','D) Cours de guitare'], 'A', 'Des bénévoles aident gratuitement les enfants de l''école primaire, tous les soirs.', NULL),
    (v_scenario_2, 3, 'Ma fille de 9 ans est timide et j''aimerais qu''elle joue devant du public, sans acheter de matériel, le samedi matin. Quelle activité peut lui convenir ?', ARRAY['A) Cours de judo','B) Aide aux devoirs','C) Cours de guitare','D) Atelier théâtre'], 'D', 'Les cours ont lieu le samedi matin, sans équipement, avec un spectacle en juin.', NULL),
    (v_scenario_2, 4, 'Mon fils de 8 ans aime la musique et je peux acheter un instrument. Il est libre le jeudi. Quelle activité peut lui convenir ?', ARRAY['A) Cours de judo','B) Cours de guitare','C) Atelier théâtre','D) Aide aux devoirs'], 'B', 'Le conservatoire propose des cours le jeudi ou le samedi, avec une guitare à acheter ou à louer.', NULL),
    (v_scenario_2, 5, 'Je peux payer 70 euros par an et mon fils de 8 ans est libre le mercredi après-midi. Quelle activité peut lui convenir ?', ARRAY['A) Atelier théâtre','B) Aide aux devoirs','C) Cours de judo','D) Cours de guitare'], 'C', 'La cotisation est de 70 euros par an et les cours ont lieu le mercredi après-midi.', NULL);

  -- Sujet 4 : Inscription à un cours de français (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'A2', 'Inscription à un cours de français', E'Objet : confirmation de votre inscription au cours de français\n\nMadame, Monsieur,\n\nNous confirmons votre inscription au cours de français pour adultes, niveau A2. Le cours commence le lundi 2 novembre et se termine le 25 janvier. Il a lieu deux fois par semaine, le lundi et le mercredi, de 18 h 30 à 20 h 30, à la maison des associations, salle 4. Le premier jour, apportez votre pièce d''identité et un cahier. Vous devez payer 40 euros pour l''année, en espèces ou par chèque, au secrétariat, avant la fin du premier mois. Si vous êtes absent plus de trois fois de suite, prévenez le professeur. Le cours n''a pas lieu pendant les vacances scolaires. Bienvenue et bon courage !\n\nLe secrétariat', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Pourquoi ce courrier est-il envoyé ?', ARRAY['A) Pour annuler un cours de français','B) Pour demander un nouveau test de niveau','C) Pour changer la salle du cours du lundi','D) Pour confirmer une inscription à un cours'], 'D', 'Le courrier confirme l''inscription au cours de français.', NULL),
    (v_scenario_3, 2, 'Quels jours a lieu le cours ?', ARRAY['A) Le mardi et le jeudi','B) Le lundi et le mercredi','C) Le lundi et le vendredi','D) Le mercredi et le samedi'], 'B', 'Le cours a lieu le lundi et le mercredi soir.', NULL),
    (v_scenario_3, 3, 'Que faut-il apporter le premier jour ?', ARRAY['A) Une pièce d''identité et un cahier','B) Un dictionnaire et un chèque','C) Un certificat médical et une photo','D) Le livre du cours et un stylo neuf'], 'A', 'Le premier jour, il faut apporter une pièce d''identité et un cahier.', NULL),
    (v_scenario_3, 4, 'Comment peut-on payer ?', ARRAY['A) Par carte bancaire sur Internet','B) Par virement avant le premier cours','C) En espèces ou par chèque, au secrétariat','D) Au professeur, à la fin de chaque cours'], 'C', 'Le paiement se fait en espèces ou par chèque au secrétariat.', NULL),
    (v_scenario_3, 5, 'Que faut-il faire après plus de trois absences de suite ?', ARRAY['A) Payer une somme supplémentaire','B) Prévenir le professeur','C) Changer de groupe de niveau','D) Recommencer le cours depuis le début'], 'B', 'Le courrier demande de prévenir le professeur.', NULL);

  -- Sujet 5 : Un nouveau parc pour les enfants (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'A2', 'Un nouveau parc pour les enfants', 'Le quartier des Roses a maintenant un nouveau parc, ouvert depuis le premier octobre. Il se trouve à la place d''un ancien parking, à côté de l''école. Le parc a des jeux pour les petits et pour les grands : des toboggans, des balançoires et un mur pour grimper. Il y a aussi des bancs, des arbres et une fontaine où l''on peut boire de l''eau. La mairie a demandé l''avis des enfants avant de construire le parc : ils ont dessiné les jeux qu''ils voulaient. Le parc est ouvert tous les jours de 8 h à 20 h. Les parents sont contents, car les enfants peuvent jouer en sécurité, loin des voitures. Certains voisins regrettent toutefois la disparition des places de stationnement, et ils demandent un nouveau parking près du marché.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Que raconte cet article ?', ARRAY['A) La fermeture d''une école du quartier','B) La construction d''un nouveau parking','C) L''ouverture d''un parc dans un quartier','D) Un concours de dessin pour les enfants'], 'C', 'L''article présente le nouveau parc du quartier des Roses.', NULL),
    (v_scenario_4, 2, 'Où se trouve le nouveau parc ?', ARRAY['A) À la place d''un ancien parking','B) À côté du marché de la ville','C) Derrière la mairie du quartier','D) À la place d''une ancienne école'], 'A', 'Le parc a été construit à la place d''un ancien parking, près de l''école.', NULL),
    (v_scenario_4, 3, 'Qui a participé au choix des jeux ?', ARRAY['A) Les parents d''élèves','B) Les employés de l''école','C) Un groupe d''architectes','D) Les enfants du quartier'], 'D', 'La mairie a demandé l''avis des enfants, qui ont dessiné les jeux.', NULL),
    (v_scenario_4, 4, 'Pourquoi les parents sont-ils contents ?', ARRAY['A) Le parc est gratuit pour les familles','B) Les enfants jouent loin des voitures','C) Le parc ouvre très tôt le matin','D) Il y a une piscine pour les enfants'], 'B', 'Les enfants peuvent jouer en sécurité, loin des voitures.', NULL),
    (v_scenario_4, 5, 'Quel problème certains voisins signalent-ils ?', ARRAY['A) Le parc est trop bruyant le soir','B) Il y a moins de places de stationnement','C) Les jeux sont trop dangereux','D) Le parc ferme trop tôt'], 'B', 'Certains regrettent la disparition des places de stationnement.', NULL);

END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : B1 | Thématique : Tri des déchets, bénévolat, garde d'enfants, examen, gaspillage alimentaire | 5 sujet(s)
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
  -- Sujet 1 : Le tri des déchets dans la résidence (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'B1', 'Le tri des déchets dans la résidence', 'Message du gestionnaire de la résidence — Nouvelles règles de tri. À partir du 1er novembre, le tri des déchets change dans la résidence « Les Tilleuls ». Trois bacs sont désormais installés dans le local situé à côté du parking : un bac jaune pour les emballages en plastique, en métal et en carton, un bac vert pour le verre, et un bac gris pour les déchets qui ne se recyclent pas. Les emballages doivent être vidés, mais il n''est plus nécessaire de les laver. Merci de ne pas déposer de sacs fermés dans le bac jaune : les déchets doivent être mis en vrac pour être triés correctement. Les cartons volumineux doivent être aplatis avant d''être jetés. Les encombrants, comme les meubles, ne doivent pas être laissés dans le local : ils sont ramassés sur rendez-vous, gratuitement, en appelant la mairie. Si ces règles ne sont pas respectées, la résidence risque de payer une amende, ce qui pourrait augmenter les charges de chacun. Des affiches explicatives seront installées la semaine prochaine dans chaque hall d''entrée.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est le but de ce message ?', ARRAY['A) Annoncer la fermeture du local à poubelles','B) Expliquer les nouvelles règles de tri','C) Demander une participation financière aux habitants','D) Présenter les horaires du ramassage en ville'], 'B', 'Le gestionnaire présente les nouvelles règles de tri à partir du 1er novembre.', NULL),
    (v_scenario_0, 2, 'Que doit-on mettre dans le bac vert ?', ARRAY['A) Les emballages en carton et en métal','B) Les déchets qui ne se recyclent pas','C) Les objets en plastique de la cuisine','D) Le verre'], 'D', 'Le bac vert est réservé au verre.', NULL),
    (v_scenario_0, 3, 'Que faut-il faire des emballages avant de les jeter ?', ARRAY['A) Les vider, sans obligation de les laver','B) Les laver soigneusement à l''eau chaude','C) Les mettre dans des sacs bien fermés','D) Les couper en petits morceaux réguliers'], 'A', 'Les emballages doivent être vidés, mais il n''est plus nécessaire de les laver.', NULL),
    (v_scenario_0, 4, 'Comment se débarrasser d''un meuble ?', ARRAY['A) Le laisser dans le local près du parking','B) Le déposer dans le bac gris de la résidence','C) Appeler la mairie pour un ramassage sur rendez-vous','D) Le porter directement au gestionnaire'], 'C', 'Les encombrants sont ramassés sur rendez-vous en appelant la mairie.', NULL),
    (v_scenario_0, 5, 'Quelle conséquence peut avoir un mauvais tri ?', ARRAY['A) La fermeture du local de tri pendant un mois','B) Une amende qui peut faire monter les charges','C) Le retrait des bacs de la résidence entière','D) Une visite du gestionnaire chez chaque habitant'], 'B', 'La résidence risque une amende, ce qui pourrait augmenter les charges.', NULL);

  -- Sujet 2 : Le bénévolat dans les associations (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'B1', 'Le bénévolat dans les associations', 'Chaque année, des millions de personnes donnent un peu de leur temps à une association. Ce bénévolat prend des formes très variées : certains distribuent des repas, d''autres aident des enfants à faire leurs devoirs ou organisent des événements sportifs. Selon les responsables associatifs, le nombre de bénévoles a diminué depuis quelques années, ___________ (1) les besoins ont augmenté. Beaucoup de personnes pensent qu''il faut beaucoup de temps libre pour s''engager. Or, ce n''est pas toujours le cas : il suffit parfois de quelques heures par mois. Les associations proposent d''ailleurs des missions ponctuelles, ___________ (2) permettent de tester une activité sans s''engager sur la durée. Les bénévoles interrogés ___________ (3) souvent que cette expérience leur apporte beaucoup : ils rencontrent de nouvelles personnes, apprennent des compétences utiles et ont le sentiment d''être utiles. Certains ___________ (4) même trouvé un emploi grâce à cet engagement. Pour attirer de nouveaux volontaires, les associations essaient de mieux expliquer ce qu''elles font, ___________ (5) beaucoup de gens ne savent pas comment s''inscrire.', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) parce que','B) alors que','C) pour que','D) avant que'], 'B', '« Alors que » oppose deux faits : moins de bénévoles, mais plus de besoins.', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) qui','B) que','C) dont','D) où'], 'A', 'Le pronom « qui » est le sujet de « permettent » : les missions ponctuelles permettent de tester.', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) ignorent','B) regrettent','C) doutent','D) expliquent'], 'D', 'Les bénévoles expliquent ce que l''expérience leur apporte ; la suite du texte cite des bénéfices.', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) sont','B) est','C) ont','D) a'], 'C', 'Le verbe « trouver » se conjugue avec « avoir » : « certains ont trouvé ».', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) car','B) donc','C) pourtant','D) mais'], 'A', '« Car » donne la raison : beaucoup de gens ne savent pas comment s''inscrire.', 5);

  -- Sujet 3 : Quatre modes de garde pour jeunes enfants (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'B1', 'Quatre modes de garde pour jeunes enfants', NULL, '[{"label": "Crèche municipale", "content": "La crèche accueille les enfants de 3 mois à 3 ans, du lundi au vendredi de 7 h 30 à 18 h 30. Les places sont attribuées par une commission, en priorité aux familles dont les deux parents travaillent. Le tarif dépend des revenus. Il faut déposer un dossier plusieurs mois avant la date souhaitée."}, {"label": "Assistante maternelle", "content": "Une assistante maternelle garde les enfants à son domicile, avec un maximum de quatre enfants. Les horaires se discutent directement avec elle et peuvent être adaptés (tôt le matin ou tard le soir). Les parents deviennent ses employeurs : ils signent un contrat et paient un salaire, en partie remboursé par une aide."}, {"label": "Halte-garderie", "content": "Pour les enfants de 1 à 4 ans, la halte-garderie propose un accueil occasionnel de quelques heures, sans contrat. On réserve à la demi-journée, quelques jours à l''avance. Ce mode de garde convient aux parents qui n''ont pas besoin de garde régulière. Le tarif est calculé à l''heure."}, {"label": "Garde à domicile", "content": "Une personne vient garder l''enfant chez lui, à des horaires fixés avec la famille, y compris le soir ou le week-end. C''est la solution la plus souple et la plus chère. Les parents sont employeurs et doivent déclarer la personne, mais une partie du coût peut être remboursée par une aide financière."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Je travaille souvent le soir et le week-end et je veux que mon fils reste chez nous. Quelle solution peut me convenir ?', ARRAY['A) Crèche municipale','B) Assistante maternelle','C) Garde à domicile','D) Halte-garderie'], 'C', 'Une personne vient garder l''enfant chez lui, y compris le soir ou le week-end.', NULL),
    (v_scenario_2, 2, 'Je cherche une place régulière du lundi au vendredi pour mon bébé de 6 mois et notre budget dépend de nos revenus. Quelle solution peut me convenir ?', ARRAY['A) Crèche municipale','B) Assistante maternelle','C) Halte-garderie','D) Garde à domicile'], 'A', 'La crèche accueille dès 3 mois, en semaine, avec un tarif selon les revenus.', NULL),
    (v_scenario_2, 3, 'Je n''ai besoin d''une garde que deux après-midis par mois, sans engagement, pour ma fille de 2 ans. Quelle solution peut me convenir ?', ARRAY['A) Crèche municipale','B) Assistante maternelle','C) Garde à domicile','D) Halte-garderie'], 'D', 'Cet accueil est occasionnel, sans contrat, pour les enfants de 1 à 4 ans.', NULL),
    (v_scenario_2, 4, 'J''aimerais un petit groupe d''enfants, dans une maison, avec des horaires que je peux discuter, dès 6 h 30 le matin. Quelle solution peut me convenir ?', ARRAY['A) Crèche municipale','B) Assistante maternelle','C) Halte-garderie','D) Garde à domicile'], 'B', 'Elle garde quatre enfants au maximum, chez elle, avec des horaires adaptables.', NULL),
    (v_scenario_2, 5, 'Mes deux parents travaillent et nous préparons un dossier plusieurs mois à l''avance pour obtenir une place. Quelle solution peut nous convenir ?', ARRAY['A) Crèche municipale','B) Assistante maternelle','C) Halte-garderie','D) Garde à domicile'], 'A', 'Les places sont attribuées en priorité aux familles dont les deux parents travaillent, sur dossier déposé à l''avance.', NULL);

  -- Sujet 4 : Convocation à un examen de français (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'B1', 'Convocation à un examen de français', E'Objet : convocation à l''examen de français — session de novembre\n\nMadame, Monsieur,\n\nVous êtes convoqué(e) à l''examen de français organisé par notre centre le samedi 21 novembre. Merci de vous présenter à l''accueil du centre à 8 h 15, l''épreuve écrite commençant à 8 h 45 précises. Toute personne arrivant après le début des épreuves ne pourra pas entrer dans la salle. Vous devrez présenter une pièce d''identité avec photographie, ainsi que cette convocation, imprimée ou sur votre téléphone. Vous n''avez pas besoin d''apporter de feuilles : le matériel d''écriture est fourni par le centre. En revanche, les téléphones, montres connectées et écouteurs devront être éteints et déposés dans un casier avant d''entrer en salle, sous peine d''exclusion de l''examen. L''épreuve orale aura lieu l''après-midi, à un horaire qui vous sera communiqué le jour même à l''accueil ; prévoyez donc d''être disponible jusqu''à 17 h. Si vous ne pouvez pas vous présenter pour une raison de santé, vous devez prévenir le centre dans les 48 heures suivant l''examen et envoyer un certificat médical, faute de quoi les frais d''inscription ne seront pas remboursés. Les résultats seront envoyés par courrier dans un délai d''environ quatre semaines.\n\nLe secrétariat du centre d''examen', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Quel est l''objet de ce courrier ?', ARRAY['A) Annoncer les résultats d''une session précédente','B) Proposer une formation avant l''examen','C) Confirmer le remboursement des frais d''inscription','D) Convoquer un candidat et donner les consignes'], 'D', 'Le courrier convoque le candidat et détaille l''organisation de l''examen.', NULL),
    (v_scenario_3, 2, 'À quelle heure le candidat doit-il être présent ?', ARRAY['A) À 8 h 45, directement dans la salle','B) À 8 h 15, à l''accueil','C) À 9 h 00, avec la convocation imprimée','D) À 7 h 30, pour préparer l''épreuve orale'], 'B', 'Le candidat doit se présenter à l''accueil à 8 h 15 ; l''épreuve écrite commence à 8 h 45.', NULL),
    (v_scenario_3, 3, 'Que doit faire le candidat de son téléphone ?', ARRAY['A) L''éteindre et le déposer dans un casier','B) Le laisser allumé en mode silencieux','C) Le garder pour prouver son identité','D) Le confier à l''examinateur pendant l''oral'], 'A', 'Les téléphones doivent être éteints et déposés dans un casier avant la salle.', NULL),
    (v_scenario_3, 4, 'Quand aura lieu l''épreuve orale ?', ARRAY['A) Le matin, juste après l''épreuve écrite','B) Une semaine plus tard, à une date à confirmer','C) L''après-midi, à une heure donnée le jour même','D) Le jour suivant, par visioconférence'], 'C', 'L''épreuve orale a lieu l''après-midi, à un horaire communiqué à l''accueil le jour même.', NULL),
    (v_scenario_3, 5, 'Que doit faire un candidat malade le jour de l''examen ?', ARRAY['A) Se présenter quand même avec un masque','B) Prévenir dans les 48 heures et envoyer un certificat','C) Reporter lui-même son examen sur Internet','D) Demander un remboursement au moment de l''examen'], 'B', 'Il doit prévenir le centre sous 48 heures et fournir un certificat médical pour être remboursé.', NULL);

  -- Sujet 5 : Moins gaspiller la nourriture (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'B1', 'Moins gaspiller la nourriture', 'Chaque année, les ménages jettent une quantité importante de nourriture encore consommable. Yaourts périmés depuis un jour, pain rassis, restes oubliés au fond du réfrigérateur : le gaspillage se joue souvent dans la cuisine. Pour y remédier, de plus en plus de familles changent leurs habitudes. La première réaction consiste à mieux organiser ses courses : faire une liste, vérifier ce que l''on a déjà et éviter de faire ses achats le ventre vide. Certains supermarchés y contribuent en vendant à prix réduit les produits dont la date limite approche. Autre piste : comprendre les dates. La mention « à consommer de préférence avant » indique une qualité optimale, mais le produit reste consommable ensuite, alors que « à consommer jusqu''au » concerne des aliments qui deviennent dangereux passé cette date. Beaucoup de consommateurs confondent les deux et jettent trop tôt. Des applications permettent aussi de récupérer à petit prix des invendus de boulangeries ou de restaurants. Ces initiatives ont un succès réel, mais les spécialistes rappellent que l''essentiel se joue à la maison : mieux conserver, cuisiner les restes et accepter que tous les fruits ne soient pas parfaits.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Quel constat l''article fait-il ?', ARRAY['A) Les supermarchés jettent plus que les familles','B) Le gaspillage vient souvent de la cuisine','C) Les produits sont moins bons qu''avant','D) Les familles n''achètent plus de produits frais'], 'B', 'Le texte explique que le gaspillage se joue souvent dans la cuisine.', NULL),
    (v_scenario_4, 2, 'Quel conseil est donné pour les courses ?', ARRAY['A) Acheter en grande quantité pour économiser','B) Faire ses courses le matin, avant de manger','C) Choisir surtout des produits en promotion','D) Faire une liste et vérifier ce que l''on possède'], 'D', 'Il est conseillé de faire une liste et de vérifier ce que l''on a déjà.', NULL),
    (v_scenario_4, 3, 'Que signifie « à consommer de préférence avant » ?', ARRAY['A) La qualité est optimale jusqu''à cette date','B) Le produit devient dangereux après cette date','C) Le produit ne peut plus être vendu ensuite','D) Le produit doit être mangé dans la journée'], 'A', 'Le produit reste consommable après cette date, mais sa qualité est optimale avant.', NULL),
    (v_scenario_4, 4, 'Que permettent certaines applications ?', ARRAY['A) Suivre la date limite de chaque produit chez soi','B) Faire livrer des repas préparés à domicile','C) Acheter à petit prix des invendus de commerçants','D) Échanger des recettes avec d''autres familles'], 'C', 'Des applications permettent de récupérer des invendus de boulangeries ou de restaurants à petit prix.', NULL),
    (v_scenario_4, 5, 'Quelle position adoptent les spécialistes ?', ARRAY['A) Les initiatives des commerçants suffisent à régler le problème','B) L''essentiel se joue dans les habitudes à la maison','C) Seule une loi peut faire baisser le gaspillage','D) Les applications remplaceront bientôt les supermarchés'], 'B', 'Selon eux, l''essentiel se joue à la maison : conserver, cuisiner les restes, accepter l''imperfection.', NULL);

END $$;

-- Sujets CE autonomes générés par le skill llamakusi-ce-scenario-content
-- Niveau : B2 | Thématique : Ressources humaines, IA, voyage, urbanisme, consommation | 5 sujet(s)
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
  -- Sujet 1 : L'entretien annuel d'évaluation (court)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('court', 'B2', 'L''entretien annuel d''évaluation', 'Note de la direction des ressources humaines — Entretien annuel d''évaluation. Comme chaque année, les entretiens d''évaluation se dérouleront entre le 1er et le 30 novembre. Cette année, leur organisation évolue sur deux points. D''abord, chaque salarié devra remplir un formulaire d''autoévaluation en ligne au moins une semaine avant l''entretien : il y indiquera ses principales réalisations, les difficultés rencontrées et ses souhaits d''évolution. Ce document ne servira pas à sanctionner, mais à préparer un échange plus concret avec le responsable. Ensuite, l''entretien portera désormais autant sur la charge de travail et le bien-être que sur les résultats : les managers ont suivi une formation pour aborder ces sujets avec tact. Nous rappelons que l''entretien n''a pas pour objet de décider directement des augmentations, celles-ci étant fixées séparément en janvier en fonction du budget global. En revanche, les demandes de formation exprimées lors de l''entretien seront examinées en priorité. Si un salarié souhaite être accompagné, il peut demander la présence d''un représentant du personnel. Enfin, en cas de désaccord sur le compte rendu, il dispose de quinze jours pour formuler des observations écrites, qui seront jointes à son dossier.', NULL, true)
  RETURNING id INTO v_scenario_0;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_0, 1, 'Quel est l''objet principal de cette note ?', ARRAY['A) Annoncer les augmentations de salaire de janvier','B) Informer d''un plan de départs dans l''entreprise','C) Présenter l''organisation des entretiens et ses nouveautés','D) Rappeler les horaires de travail du mois de novembre'], 'C', 'La note décrit le déroulement des entretiens annuels et les deux changements de cette année.', NULL),
    (v_scenario_0, 2, 'À quoi sert le formulaire d''autoévaluation ?', ARRAY['A) À préparer un échange plus concret avec le responsable','B) À décider des sanctions à appliquer aux salariés','C) À remplacer l''entretien direct avec le responsable hiérarchique','D) À noter les collègues de l''équipe de travail'], 'A', 'Ce document sert à préparer l''échange, pas à sanctionner.', NULL),
    (v_scenario_0, 3, 'Quelle nouveauté concerne le contenu de l''entretien ?', ARRAY['A) Les résultats ne seront plus évoqués pendant l''entretien','B) Les augmentations de salaire y seront décidées','C) Le salarié évaluera lui-même son responsable direct','D) La charge de travail et le bien-être seront abordés'], 'D', 'L''entretien portera autant sur la charge de travail et le bien-être que sur les résultats.', NULL),
    (v_scenario_0, 4, 'Que devient une demande de formation exprimée pendant l''entretien ?', ARRAY['A) Elle est refusée faute de budget disponible','B) Elle est examinée en priorité','C) Elle est reportée à l''année suivante en général','D) Elle est transmise aux représentants du personnel'], 'B', 'Les demandes de formation seront examinées en priorité.', NULL),
    (v_scenario_0, 5, 'Que peut faire un salarié en désaccord avec le compte rendu ?', ARRAY['A) Demander un nouvel entretien dès le lendemain','B) Formuler des observations écrites sous quinze jours','C) Refuser de signer et quitter l''entretien en cours','D) Saisir directement la direction générale de l''entreprise'], 'B', 'Il dispose de quinze jours pour formuler des observations écrites, jointes à son dossier.', NULL);

  -- Sujet 2 : L'intelligence artificielle au travail (trous)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('trous', 'B2', 'L''intelligence artificielle au travail', 'L''intelligence artificielle s''est installée dans de nombreux métiers en quelques années. Rédaction de comptes rendus, tri de candidatures, traduction : les tâches qu''elle peut accomplir ne cessent de s''étendre. Certains y voient une chance de se libérer des tâches répétitives ___________ (1) ils consacrent une grande partie de leur temps, tandis que d''autres craignent de voir disparaître leur emploi. Les études disponibles apportent une réponse nuancée : il est probable que certains métiers se transforment plutôt qu''ils ne disparaissent. Le comptable, par exemple, passera moins de temps à saisir des chiffres et davantage à les interpréter. Encore faut-il que les salariés ___________ (2) accès à ces outils et à une formation adaptée, ce qui suppose un effort des entreprises. Les syndicats demandent d''ailleurs que ces changements soient discutés avec les représentants du personnel avant tout déploiement. Or cet effort est inégal : les grandes structures investissent volontiers dans la formation, mais les petites entreprises disposent rarement des moyens nécessaires, ___________ (3) l''écart entre elles s''accroît. Par ailleurs, l''utilisation de ces outils soulève des questions de responsabilité. Un texte produit par une machine peut contenir des erreurs, et c''est bien le salarié qui ___________ (4) la responsabilité de son contenu. C''est pourquoi les spécialistes recommandent de toujours relire et vérifier. L''intelligence artificielle ne remplace pas le jugement humain, mais elle ___________ (5) modifie les conditions d''exercice.', NULL, true)
  RETURNING id INTO v_scenario_1;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_1, 1, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) lesquelles','B) dont','C) auxquelles','D) que'], 'C', 'On consacre du temps « à » des tâches : le pronom relatif est « auxquelles ».', 1),
    (v_scenario_1, 2, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) ont','B) aient','C) auront','D) avaient'], 'B', 'Après « encore faut-il que », on emploie le subjonctif : « aient ».', 2),
    (v_scenario_1, 3, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) afin que','B) bien que','C) à moins que','D) si bien que'], 'D', 'L''écart qui s''accroît est la conséquence du manque de moyens : « si bien que » + indicatif. Les autres conjonctions demandent le subjonctif.', 3),
    (v_scenario_1, 4, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) porte','B) fait','C) met','D) tient'], 'A', 'On dit « porter la responsabilité de » quelque chose.', 4),
    (v_scenario_1, 5, 'Quel mot complète correctement le texte à cet endroit ?', ARRAY['A) y','B) en','C) le','D) lui'], 'B', 'Le pronom « en » remplace « du jugement humain » : elle en modifie les conditions d''exercice.', 5);

  -- Sujet 3 : Quatre façons de voyager jusqu'à la capitale (multi_texte)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('multi_texte', 'B2', 'Quatre façons de voyager jusqu''à la capitale', NULL, '[{"label": "Train grande vitesse", "content": "Trajet direct en 2 h 15, avec un départ toutes les heures. Le billet coûte entre 35 et 90 euros selon la date de réservation : plus on réserve tôt, moins c''est cher. Les billets à petit prix ne sont ni échangeables ni remboursables. Deux bagages sont acceptés gratuitement, et la gare est située en plein centre-ville, ce qui évite tout transfert."}, {"label": "Covoiturage", "content": "Le trajet dure environ 4 heures en voiture et coûte en moyenne 20 euros par passager. Les départs se fixent avec le conducteur, selon ses horaires : il est donc difficile d''arriver à une heure précise. Chaque passager peut emporter un bagage, sous réserve d''accord préalable. L''annulation est gratuite jusqu''à 24 heures avant le départ, mais le conducteur peut lui-même annuler."}, {"label": "Autocar de nuit", "content": "Le départ a lieu à 22 h 30 et l''arrivée à 5 h 45. Le billet est le moins cher (à partir de 12 euros), mais le voyage est long et peu confortable pour certains. Les bagages en soute sont limités à 20 kilos. L''annulation est possible jusqu''à la veille du départ, moyennant des frais fixes de 5 euros."}, {"label": "Avion", "content": "Le vol dure 1 h 10, mais il faut arriver à l''aéroport deux heures avant le départ, et l''aéroport se trouve à 35 kilomètres de la ville. Le billet coûte entre 60 et 150 euros. Un seul bagage cabine est inclus ; le bagage en soute est payant. Les billets flexibles, plus chers, permettent de modifier la date jusqu''à trois heures avant le vol."}]'::jsonb, true)
  RETURNING id INTO v_scenario_2;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_2, 1, 'Je voyage avec deux grosses valises, je dois arriver au centre pour un rendez-vous à 9 h et mon budget est limité sans être très serré. Quelle option peut me convenir ?', ARRAY['A) Covoiturage','B) Train grande vitesse','C) Autocar de nuit','D) Avion'], 'B', 'Deux bagages sont gratuits et la gare se trouve au centre-ville, avec un départ toutes les heures.', NULL),
    (v_scenario_2, 2, 'J''ai un budget très serré, je peux voyager la nuit et je n''ai qu''un sac de 15 kilos. Quelle option peut me convenir ?', ARRAY['A) Train grande vitesse','B) Covoiturage','C) Avion','D) Autocar de nuit'], 'D', 'C''est le billet le moins cher, avec un départ à 22 h 30 et des bagages jusqu''à 20 kilos.', NULL),
    (v_scenario_2, 3, 'Mon programme peut encore changer : je voudrais pouvoir modifier ma date jusqu''au dernier moment, même si cela coûte plus cher, et je n''ai qu''un sac. Quelle option peut me convenir ?', ARRAY['A) Avion','B) Train grande vitesse','C) Covoiturage','D) Autocar de nuit'], 'A', 'Les billets flexibles permettent de modifier la date jusqu''à trois heures avant le vol.', NULL),
    (v_scenario_2, 4, 'Je veux partager les frais, je suis flexible sur l''heure d''arrivée et je n''ai qu''un bagage. Quelle option peut me convenir ?', ARRAY['A) Train grande vitesse','B) Autocar de nuit','C) Covoiturage','D) Avion'], 'C', 'Le covoiturage coûte environ 20 euros par passager, avec un bagage et des horaires variables.', NULL),
    (v_scenario_2, 5, 'Je peux accepter d''arriver à une heure incertaine et j''aime pouvoir annuler gratuitement jusqu''à la veille. Quelle option peut me convenir ?', ARRAY['A) Train grande vitesse','B) Covoiturage','C) Autocar de nuit','D) Avion'], 'B', 'L''annulation est gratuite jusqu''à 24 heures avant, mais l''heure d''arrivée dépend du conducteur.', NULL);

  -- Sujet 4 : Autorisation de travaux : réponse de la mairie (long_admin)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('long_admin', 'B2', 'Autorisation de travaux : réponse de la mairie', E'Objet : votre demande d''autorisation de travaux du 3 septembre — décision\n\nMadame, Monsieur,\n\nNous avons examiné votre demande d''autorisation pour l''installation d''une véranda sur la façade arrière de votre maison. Après instruction, nous vous informons que votre projet est accepté, sous réserve du respect des prescriptions suivantes.\n\nTout d''abord, la hauteur de la véranda ne devra pas dépasser trois mètres, et elle devra être implantée à au moins deux mètres de la limite de propriété voisine. Ensuite, les matériaux utilisés devront s''harmoniser avec ceux de l''habitation existante ; à ce titre, les structures en aluminium de couleur blanche sont refusées, un ton gris ou beige étant exigé. Enfin, vous devrez afficher sur le terrain, de manière visible depuis la rue, le panneau d''affichage réglementaire pendant toute la durée du chantier, et transmettre à nos services, à l''issue des travaux, une déclaration d''achèvement.\n\nCette autorisation est valable trois ans à compter de la date du présent courrier : si les travaux n''ont pas commencé avant l''expiration de ce délai, elle deviendra caduque et il faudra déposer une nouvelle demande. Nous vous rappelons que cette décision est délivrée sous réserve du droit des tiers : un voisin qui s''estimerait lésé peut la contester dans un délai de deux mois à partir de l''affichage sur le terrain. De votre côté, si vous n''êtes pas d''accord avec l''une des prescriptions, vous pouvez déposer un recours gracieux auprès de la mairie dans les deux mois suivant la réception de ce courrier.\n\nLe service de l''urbanisme', NULL, true)
  RETURNING id INTO v_scenario_3;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_3, 1, 'Quel est l''objet principal de ce courrier ?', ARRAY['A) Informer que le projet est accepté sous conditions','B) Refuser l''installation d''une véranda sur la façade','C) Demander des pièces complémentaires au demandeur','D) Convoquer le demandeur à une réunion en mairie'], 'A', 'La mairie accepte le projet, sous réserve de plusieurs prescriptions.', NULL),
    (v_scenario_3, 2, 'Quelle règle concerne l''implantation de la véranda ?', ARRAY['A) Elle doit toucher la limite de propriété voisine','B) Elle doit être visible depuis la rue principale','C) Elle doit être à deux mètres au moins du voisin','D) Elle doit être construite avant la fin de l''hiver'], 'C', 'Elle doit être implantée à au moins deux mètres de la limite de propriété voisine.', NULL),
    (v_scenario_3, 3, 'Pourquoi certaines structures en aluminium sont-elles refusées ?', ARRAY['A) Ce matériau est interdit dans toute la commune','B) Leur prix dépasse le budget prévu pour le projet','C) Elles dépassent la hauteur maximale autorisée','D) Leur couleur blanche ne s''harmonise pas avec la maison'], 'D', 'Les matériaux doivent s''harmoniser avec l''habitation : un ton gris ou beige est exigé.', NULL),
    (v_scenario_3, 4, 'Que doit faire le demandeur pendant le chantier ?', ARRAY['A) Prévenir chaque voisin par courrier recommandé','B) Afficher un panneau visible depuis la rue','C) Suspendre les travaux pendant les week-ends','D) Déposer une déclaration à chaque étape'], 'B', 'Il doit afficher sur le terrain le panneau réglementaire, visible depuis la rue.', NULL),
    (v_scenario_3, 5, 'Que se passe-t-il si les travaux ne commencent pas dans les trois ans ?', ARRAY['A) L''autorisation est prolongée automatiquement d''un an','B) L''autorisation n''est plus valable et il faut redemander','C) Le demandeur doit payer une amende à la commune','D) Le voisin devient responsable du projet en cours'], 'B', 'L''autorisation devient caduque : une nouvelle demande est nécessaire.', NULL);

  -- Sujet 5 : La mode rapide : le prix caché des vêtements (article_presse)
  INSERT INTO public.ce_scenarios (format, level, title, texte, sub_texts, is_active)
  VALUES ('article_presse', 'B2', 'La mode rapide : le prix caché des vêtements', E'Un t-shirt à cinq euros, une robe à dix euros : la mode rapide, qui renouvelle en permanence ses collections à bas prix, séduit des millions de consommateurs. Les marques concernées mettent sur le marché de nouveaux modèles chaque semaine, encourageant des achats impulsifs. Mais ce modèle a un coût, souvent invisible au moment de payer.\n\nD''abord, un coût environnemental : la fabrication de vêtements consomme beaucoup d''eau et d''énergie, et le transport de produits fabriqués à l''autre bout du monde produit des émissions de gaz à effet de serre. Par ailleurs, ces vêtements, souvent de faible qualité, sont portés peu de temps avant d''être jetés : une partie finit incinérée ou exportée vers des pays qui n''ont pas les moyens de la recycler. Ensuite, un coût social : pour proposer des prix aussi bas, certains sous-traitants imposent à leurs ouvriers des salaires très faibles et des conditions de travail difficiles.\n\nFace à ces critiques, plusieurs enseignes affichent désormais des collections « responsables ». Les associations de consommateurs restent prudentes : elles dénoncent parfois un verdissement de façade, où quelques articles écologiques servent à faire oublier que le modèle reste fondé sur le volume. Certains consommateurs, notamment les jeunes, se tournent vers la seconde main, qui connaît un fort développement. Les économistes estiment toutefois que ce mouvement ne suffira pas si les habitudes d''achat ne changent pas : acheter moins, mais mieux, reste selon eux la solution la plus efficace, même si elle suppose de résister à la tentation permanente du prix bas.', NULL, true)
  RETURNING id INTO v_scenario_4;

  INSERT INTO public.ce_scenario_questions
    (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap)
  VALUES
    (v_scenario_4, 1, 'Quel constat l''article établit-il ?', ARRAY['A) La mode rapide disparaît au profit de la seconde main','B) Des prix bas séduisent mais cachent un coût','C) Les vêtements sont désormais plus durables qu''avant','D) Les prix bas profitent surtout aux ouvriers du secteur'], 'B', 'Les prix séduisent, mais le modèle a un coût, souvent invisible au moment de payer.', NULL),
    (v_scenario_4, 2, 'Quel impact environnemental est cité ?', ARRAY['A) Une baisse de la production de textiles naturels dans le monde','B) Une pollution provoquée par les magasins en ville','C) Un manque de matières premières dans le monde','D) Une forte consommation de ressources et le transport'], 'D', 'La fabrication consomme beaucoup d''eau et d''énergie, et le transport émet des gaz à effet de serre.', NULL),
    (v_scenario_4, 3, 'Quel reproche est fait aux collections responsables ?', ARRAY['A) Elles masquent parfois un modèle fondé sur le volume','B) Elles sont plus chères que la mode rapide classique en magasin','C) Elles sont fabriquées dans de mauvaises conditions','D) Elles n''intéressent pas les jeunes consommateurs'], 'A', 'Les associations dénoncent un verdissement de façade qui fait oublier le modèle du volume.', NULL),
    (v_scenario_4, 4, 'Comment les jeunes consommateurs réagissent-ils, selon l''article ?', ARRAY['A) Ils cessent d''acheter des vêtements de toute sorte','B) Ils préfèrent désormais les collections de luxe','C) Ils se tournent vers la seconde main','D) Ils achètent davantage de vêtements en magasin'], 'C', 'Certains consommateurs, notamment les jeunes, se tournent vers la seconde main.', NULL),
    (v_scenario_4, 5, 'Quelle solution les économistes jugent-ils la plus efficace ?', ARRAY['A) Interdire la vente de vêtements à bas prix','B) Acheter moins, mais de meilleure qualité','C) Multiplier les collections responsables en magasin','D) Développer la seconde main dans tous les pays'], 'B', 'Pour eux, acheter moins mais mieux est la solution la plus efficace.', NULL);

END $$;
