-- Item 5 du plan "Explications de correction CE" : exam-2.

DO $$
DECLARE
  v_exam_id uuid;
BEGIN
  SELECT id INTO v_exam_id FROM public.exams WHERE slug = 'exam-2';
  IF v_exam_id IS NULL THEN
    RAISE EXCEPTION 'Exam with slug exam-2 not found';
  END IF;

  UPDATE public.exam_questions SET explanation = CASE order_index
    WHEN 20 THEN 'Le texte précise qu''« aucune expérience préalable n''est exigée » et qu''une formation interne est assurée — le candidat n''a donc pas besoin d''expérience particulière.'
    WHEN 21 THEN 'Le texte demande de se présenter avec « les originaux de vos diplômes ainsi qu''une copie de votre carte d''identité » — les deux documents sont donc nécessaires, pas seulement une pièce d''identité.'
    WHEN 22 THEN 'La prime est versée « sous condition d''un an d''ancienneté minimum » — c''est donc la durée de présence dans l''entreprise qui conditionne son versement, pas le type de contrat.'
    WHEN 23 THEN 'Le texte précise que passé le 30 novembre, « il ne sera plus possible d''adhérer avant l''année suivante » — le salarié doit donc attendre, il ne s''agit pas d''une pénalité ni d''une suspension de contrat.'
    WHEN 24 THEN 'Dans une lettre de candidature, on « transmet » sa candidature ; « refuser », « annuler » ou « retirer » sa propre candidature n''aurait pas de sens dans ce contexte.'
    WHEN 25 THEN '« Rester à votre entière disposition » est l''expression figée pour se rendre disponible ; les autres noms (obligation, intention, exigence) ne correspondent pas à cette formule de politesse.'
    WHEN 26 THEN 'On « lit » attentivement un contrat avant de le signer ; jeter, oublier ou vendre ne correspondent pas à cette démarche de vérification.'
    WHEN 27 THEN 'Féliciter un salarié pour d''excellents résultats est cohérent avec le sens positif de la phrase ; licencier, ignorer ou punir contredisent ce contexte favorable.'
    WHEN 28 THEN 'Seule l''Offre 2 (développeur web) mentionne un « télétravail total possible » ; les 3 autres offres nécessitent une présence sur site.'
    WHEN 29 THEN 'L''Avis 2 est le seul à mentionner des « horaires fixes respectés à la lettre » et « aucune sollicitation en dehors du temps de travail », ce qui correspond à une séparation stricte vie pro/perso.'
    WHEN 30 THEN 'L''avenant porte sur l''augmentation de salaire de M. Lefèvre « suite à son passage au poste de chef d''équipe » — son objet principal est donc lié au changement de poste, pas aux horaires ou à la fin du contrat.'
    WHEN 31 THEN 'Le texte précise que sans signature sous quinze jours, l''avenant « sera réputé refusé » — il est donc considéré comme rejeté, pas accepté automatiquement.'
    WHEN 32 THEN 'Le message rappelle que « la déclaration mensuelle de situation doit impérativement être effectuée » chaque mois — son objet principal est donc de rappeler cette obligation, pas d''annoncer la fin des allocations.'
    WHEN 33 THEN 'Le texte précise qu''une reprise d''activité « doit être signalée dans les mêmes délais » que la déclaration mensuelle, même si elle est de courte durée.'
    WHEN 34 THEN 'La note précise que les salariés doivent « en informer leur manager actuel avant de déposer leur candidature » aux ressources humaines.'
    WHEN 35 THEN 'L''article indique que les salariés rapportent « une meilleure conciliation entre vie professionnelle et personnelle » — c''est donc ce que révèlent les premiers retours.'
    WHEN 36 THEN 'Les dirigeants prudents redoutent « une perte de productivité sur le long terme », en particulier dans les métiers nécessitant une présence continue.'
    WHEN 37 THEN 'L''article explique ce décalage par « un système de formation qui peine à suivre l''évolution rapide de ces métiers », pas par les salaires ou le désintérêt des candidats.'
    WHEN 38 THEN 'Le texte indique que certaines grandes écoles « nouent des partenariats directs avec des entreprises » pour adapter leurs programmes plus rapidement.'
    WHEN 39 THEN 'Les visiteurs du forum étaient « désireux de découvrir des secteurs parfois méconnus » comme la plomberie ou l''ébénisterie — l''objectif était donc de faire découvrir ces métiers.'
  END
  WHERE exam_id = v_exam_id AND section = 'CE' AND order_index BETWEEN 20 AND 39;
END $$;
