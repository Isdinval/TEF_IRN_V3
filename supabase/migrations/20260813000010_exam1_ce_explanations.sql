-- Item 4 du plan "Explications de correction CE" : rédaction de l'explication pour les 20
-- questions CE de exam-1. UPDATE ciblé par order_index (les questions existent déjà).

DO $$
DECLARE
  v_exam_id uuid;
BEGIN
  SELECT id INTO v_exam_id FROM public.exams WHERE slug = 'exam-1';
  IF v_exam_id IS NULL THEN
    RAISE EXCEPTION 'Exam with slug exam-1 not found';
  END IF;

  UPDATE public.exam_questions SET explanation = CASE order_index
    WHEN 20 THEN 'Le texte précise que les usagers ayant une démarche urgente doivent se présenter à l''accueil du bâtiment principal — c''est donc un autre bâtiment municipal, et non la mairie annexe fermée.'
    WHEN 21 THEN 'Le texte est clair : « aucune demande ne sera traitée » sans rendez-vous réservé au préalable — la demande n''est donc pas prise en compte, elle n''est pas traitée en priorité ni sanctionnée par une amende.'
    WHEN 22 THEN 'Le texte indique que le délai est plus long « en raison d''un afflux important de demandes depuis la rentrée » — la cause est donc le volume de demandes, pas un problème d''effectif ou informatique (non mentionnés).'
    WHEN 23 THEN 'Le texte précise que la demande se fait en ligne « sauf les personnes nées à l''étranger », qui doivent donc se déplacer.'
    WHEN 24 THEN '« Accéder » est le seul verbe qui correspond au sens de joindre directement un conseiller par ce numéro unique ; renoncer, recourir et échapper ne conviennent pas au contexte d''une mesure destinée à faciliter le contact.'
    WHEN 25 THEN 'La mesure vise à améliorer le service pour les usagers : elle a donc pour but de réduire les délais d''attente, pas de les prolonger ou de les maintenir.'
    WHEN 26 THEN '« Prendre rendez-vous » est l''expression figée pour cette démarche ; on ne « donne », ne « perd » et ne « vend » pas un rendez-vous.'
    WHEN 27 THEN 'Un dossier administratif se « dépose » ; les autres verbes (prolongé, affiché, oublié) ne correspondent pas à l''action attendue avant la fin du mois.'
    WHEN 28 THEN 'Seul le Service 2 (état civil) mentionne explicitement la délivrance des actes de mariage ; les autres services traitent de sujets différents (naturalisation, titres de séjour, logement social).'
    WHEN 29 THEN 'L''Atelier 3 est le seul consacré à l''aide à la rédaction de CV et lettres de motivation, ce qui correspond exactement au besoin de préparer une candidature.'
    WHEN 30 THEN 'Le courrier explique que l''attestation de loyer n''a pas été jointe : le dossier est donc incomplet et doit être complété, il n''est ni accepté ni refusé définitivement.'
    WHEN 31 THEN 'Le texte précise que sans réponse sous deux mois, la demande « sera considérée comme abandonnée » — c''est donc une clôture automatique du dossier, pas une pénalité financière.'
    WHEN 32 THEN 'Le courrier annonce un report d''entretien en raison d''un empêchement de l''agent — son objet est donc de convoquer le candidat à une nouvelle date, il ne s''agit ni d''un refus ni d''une demande de pièces.'
    WHEN 33 THEN 'Le texte indique qu''un retard de plus de quinze minutes « entraînera l''annulation du rendez-vous » — le rendez-vous n''est donc plus maintenu, il n''est pas simplement raccourci.'
    WHEN 34 THEN 'La mesure vise à limiter l''attente en salle en imposant un rendez-vous préalable — son objectif est donc d''améliorer l''organisation, pas de réduire les effectifs ni de fermer des guichets.'
    WHEN 35 THEN 'L''article décrit ces structures comme des « guichets uniques où les usagers peuvent être accompagnés dans leurs démarches » — leur rôle est donc l''accompagnement, pas le remplacement des administrations.'
    WHEN 36 THEN 'Le texte précise que la fracture administrative « touche particulièrement les personnes âgées ou peu à l''aise avec les outils numériques ».'
    WHEN 37 THEN 'L''enquête montre qu''un usager sur cinq « renonce à effectuer une démarche en ligne faute de maîtriser... les outils numériques » — c''est donc un manque de compétences numériques, pas une préférence pour le numérique.'
    WHEN 38 THEN 'Le texte indique que les associations proposent « des permanences gratuites d''aide aux démarches en ligne, animées par des bénévoles » — soit un accompagnement gratuit, pas une formation payante.'
    WHEN 39 THEN 'Le service permet de « trouver une solution amiable avant d''engager une procédure judiciaire » — il sert donc à résoudre les conflits sans passer par la justice.'
  END
  WHERE exam_id = v_exam_id AND section = 'CE' AND order_index BETWEEN 20 AND 39;
END $$;
