-- Item 6 du plan "Explications de correction CE" : exam-3.

DO $$
DECLARE
  v_exam_id uuid;
BEGIN
  SELECT id INTO v_exam_id FROM public.exams WHERE slug = 'exam-3';
  IF v_exam_id IS NULL THEN
    RAISE EXCEPTION 'Exam with slug exam-3 not found';
  END IF;

  UPDATE public.exam_questions SET explanation = CASE order_index
    WHEN 20 THEN 'Le texte précise que la gratuité s''applique « pour les patients bénéficiant d''une prise en charge à 100% », pas à tous les patients ni selon l''âge.'
    WHEN 21 THEN 'Le texte indique que « le stationnement... est compris dans le montant du loyer mensuel ».'
    WHEN 22 THEN 'Le texte précise que les bénéfices sont « reversés à une structure locale de distribution alimentaire », pas à l''association elle-même ni à la mairie.'
    WHEN 23 THEN 'Le texte indique que les horaires du dimanche sont réduits, « de 10h à 13h uniquement ».'
    WHEN 24 THEN '« Garantit » correspond au ton positif d''une mutuelle qui informe d''un remboursement ; refuser, annuler ou ignorer contrediraient ce sens.'
    WHEN 25 THEN 'Il s''agit d''expliquer comment « obtenir » ce remboursement (en transmettant la facture) ; refuser, annuler ou effacer n''ont pas de sens dans ce contexte.'
    WHEN 26 THEN 'On « prend » un rendez-vous chez un spécialiste sur conseil du médecin ; annuler, manquer ou reporter iraient à l''encontre de ce conseil.'
    WHEN 27 THEN 'Le locataire doit « informer » son propriétaire de tout dégât, c''est une obligation légale ; ignorer, accuser ou remercier ne correspondent pas à cette démarche.'
    WHEN 28 THEN 'Seul le Cabinet 2 (soins dentaires d''urgence) propose un « accueil possible sans rendez-vous le samedi matin » — les 3 autres cabinets fonctionnent uniquement sur rendez-vous.'
    WHEN 29 THEN 'Seul le Logement 2 mentionne une « école à proximité immédiate » et un « jardin partagé », ce qui correspond aux besoins d''une famille avec de jeunes enfants.'
    WHEN 30 THEN 'Le courrier confirme que la demande de prise en charge à 100% « a été acceptée pour une période de cinq ans » — son objet principal est donc de confirmer cette prise en charge, pas de la refuser.'
    WHEN 31 THEN 'Le texte précise que les soins sans rapport avec l''affection « continuent d''être remboursés selon les modalités habituelles ».'
    WHEN 32 THEN 'Le document fixe la durée du bail, le montant et les modalités de restitution du dépôt de garantie — son objet principal est donc de fixer les conditions de location, pas d''annoncer une hausse de loyer.'
    WHEN 33 THEN 'Le texte précise qu''une dégradation « devra être justifiée par des photographies datées », sinon le locataire ne pourra la contester.'
    WHEN 34 THEN 'Le texte précise que la prise de rendez-vous « s''effectue exclusivement via le site internet de la mairie ».'
    WHEN 35 THEN 'L''article décrit à la fois la hausse des loyers dans les métropoles et l''attractivité croissante des villes moyennes — il révèle donc un rééquilibrage entre les deux, pas une baisse générale des loyers.'
    WHEN 36 THEN 'Le texte précise que ce mouvement est « accéléré par la généralisation du télétravail ».'
    WHEN 37 THEN 'Les associations « saluent cette avancée, tout en pointant des délais d''attente qui restent importants » — le bilan est donc positif mais encore limité, ni un échec total ni une réussite sans réserve.'
    WHEN 38 THEN 'Le texte précise que ce dispositif existe « depuis 2022 ».'
    WHEN 39 THEN 'Le texte indique que ce jardin favorise « les échanges entre voisins de tous âges » — son objectif principal est donc de créer du lien social, pas de vendre des légumes.'
  END
  WHERE exam_id = v_exam_id AND section = 'CE' AND order_index BETWEEN 20 AND 39;
END $$;
