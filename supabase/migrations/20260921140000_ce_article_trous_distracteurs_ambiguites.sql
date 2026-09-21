-- Pratique CE : corrections de qualité sur les 2 sujets B1 conservés.
-- 1) Article de presse « Les toits végétalisés progressent en ville » : la bonne réponse
--    était la plus longue dans 4 questions sur 5 et deux distracteurs étaient absolus
--    (« totalement », « tout risque »). Options réécrites (Q2 à Q5), lettres des bonnes
--    réponses inchangées, la bonne réponse n'est plus l'option la plus longue.
-- 2) Texte à trous « Une ville qui verdit ses trottoirs » : lacunes 1 et 5 défendables
--    avec plusieurs réponses (a envisagé/a parlé ; peut). Options réécrites pour qu'une
--    seule soit cohérente avec le texte ; la phrase 5 devient « désormais d'étendre ».

UPDATE public.ce_scenario_questions q
SET options = v.opts
FROM (VALUES
  (2, 'B', ARRAY[$o$A) Elles remplacent en partie les réseaux d'évacuation existants$o$, $o$B) Elles soulagent les canalisations lors des fortes pluies$o$, $o$C) Elles réduisent la fréquence des orages violents$o$, $o$D) Elles rendent l'eau de pluie propre à la consommation$o$]),
  (3, 'D', ARRAY[$o$A) Leur assurance rembourse une partie des travaux$o$, $o$B) Les banques leur proposent des prêts sans intérêts$o$, $o$C) L'État a créé une aide financière pour ces travaux$o$, $o$D) Certaines villes leur offrent une baisse d'impôt$o$]),
  (4, 'C', ARRAY[$o$A) Un manque d'entreprises capables de les installer$o$, $o$B) Un entretien trop lourd tout au long de l'année$o$, $o$C) Un prix nettement plus élevé qu'un toit traditionnel$o$, $o$D) Une interdiction dans plusieurs grandes agglomérations$o$]),
  (5, 'A', ARRAY[$o$A) Ils aimeraient pouvoir y accéder pour se détendre$o$, $o$B) Ils jugent l'entretien des plantes trop fréquent$o$, $o$C) Ils craignent des nuisances sonores pendant les travaux$o$, $o$D) Ils trouvent ces toits peu esthétiques vus de la rue$o$])
) AS v(order_index, ck, opts), public.ce_scenarios s
WHERE q.scenario_id = s.id
  AND s.format = 'article_presse'
  AND s.title = 'Les toits végétalisés progressent en ville'
  AND q.order_index = v.order_index
  AND q.correct_answer = v.ck;

UPDATE public.ce_scenario_questions q
SET options = v.opts, explanation = v.expl
FROM (VALUES
  (1, 'C', ARRAY[$o$A) a oublié$o$, $o$B) a cessé$o$, $o$C) a décidé$o$, $o$D) a évité$o$],
   $e$« Pour rafraîchir naturellement les rues » indique le but d'une action menée : seule « a décidé de transformer » est cohérente. Oublier, cesser ou éviter de transformer contredirait ce but.$e$),
  (5, 'B', ARRAY[$o$A) regrette$o$, $o$B) prévoit$o$, $o$C) refuse$o$, $o$D) évite$o$],
   $e$Le projet d'extension dépend du budget : « prévoit d'étendre » exprime une intention sous condition. Regretter, refuser ou éviter d'étendre serait contradictoire avec « si le budget voté le permet ».$e$)
) AS v(order_index, ck, opts, expl), public.ce_scenarios s
WHERE q.scenario_id = s.id
  AND s.format = 'trous'
  AND s.title = 'Une ville qui verdit ses trottoirs'
  AND q.order_index = v.order_index
  AND q.correct_answer = v.ck;

UPDATE public.ce_scenarios
SET texte = replace(texte, 'La mairie ___________ (5) désormais étendre', 'La mairie ___________ (5) désormais d''étendre')
WHERE format = 'trous' AND title = 'Une ville qui verdit ses trottoirs';

-- Garde-fou : les 6 questions et le texte à trous ont bien été mis à jour.
DO $$
BEGIN
  IF (SELECT count(*) FROM public.ce_scenario_questions q JOIN public.ce_scenarios s ON s.id = q.scenario_id
      WHERE s.title = 'Les toits végétalisés progressent en ville' AND q.order_index BETWEEN 2 AND 5
        AND q.options::text NOT LIKE '%totalement%' AND q.options::text NOT LIKE '%tout risque%') <> 4
  OR (SELECT count(*) FROM public.ce_scenario_questions q JOIN public.ce_scenarios s ON s.id = q.scenario_id
      WHERE s.title = 'Une ville qui verdit ses trottoirs' AND q.order_index IN (1, 5)
        AND (q.options::text LIKE '%a envisagé%' OR q.options::text LIKE '%peut%')) <> 0
  OR NOT EXISTS (SELECT 1 FROM public.ce_scenarios WHERE title = 'Une ville qui verdit ses trottoirs' AND texte LIKE '%(5) désormais d''étendre%') THEN
    RAISE EXCEPTION 'ce_scenarios : corrections article/trous incomplètes';
  END IF;
END $$;
