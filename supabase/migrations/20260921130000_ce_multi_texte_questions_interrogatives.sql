-- Pratique CE, format "Textes multiples" : chaque question doit se terminer par une
-- vraie interrogative (comme à l'examen : « ... Quel cabinet puis-je contacter ? »).
-- Question 5 : réécrite pour tester un autre passage du texte « Compost collectif »
-- que la question 1 (redistribution du compost, et non plus les déchets acceptés),
-- sans reprendre le mot « compost » (pas de quasi-citation).
-- Bonnes réponses et options inchangées.

WITH nq(order_index, question) AS (VALUES
  (1, $q$Je jette beaucoup d'épluchures de légumes chaque semaine et je voudrais éviter de les mettre à la poubelle. Quelle initiative du quartier peut m'aider ?$q$),
  (2, $q$Je fais toujours le même trajet en voiture pour aller travailler et j'aimerais le partager avec quelqu'un. Quelle initiative du quartier peut m'aider ?$q$),
  (3, $q$Je n'ai jamais appris à faire du vélo et j'aimerais m'y mettre en toute sécurité, accompagné. Quelle initiative du quartier peut m'aider ?$q$),
  (4, $q$J'ai des boutures en trop à la maison et j'aimerais en donner sans prendre rendez-vous. Quelle initiative du quartier peut m'aider ?$q$),
  (5, $q$Je m'occupe d'un jardin partagé du quartier et nous cherchons un engrais naturel gratuit pour nos parcelles. Quelle initiative du quartier peut nous aider ?$q$)
)
UPDATE public.ce_scenario_questions q
SET question = nq.question
FROM nq, public.ce_scenarios s
WHERE q.scenario_id = s.id
  AND s.format = 'multi_texte'
  AND s.title = 'Quatre gestes pour son quartier'
  AND q.order_index = nq.order_index;

UPDATE public.ce_scenario_questions q
SET explanation = $e$Le compost produit grâce au bac du parc Voltaire est redistribué gratuitement aux jardins partagés du quartier, deux fois par an.$e$
FROM public.ce_scenarios s
WHERE q.scenario_id = s.id
  AND s.format = 'multi_texte'
  AND s.title = 'Quatre gestes pour son quartier'
  AND q.order_index = 5
  AND q.correct_answer = 'D'
  AND q.options[4] = 'D) Compost collectif';

-- Garde-fou : 5 questions se terminant par « ? » et explication de la Q5 mise à jour.
DO $$
BEGIN
  IF (SELECT count(*) FROM public.ce_scenario_questions q JOIN public.ce_scenarios s ON s.id = q.scenario_id
      WHERE s.format = 'multi_texte' AND s.title = 'Quatre gestes pour son quartier' AND q.question LIKE '%?') <> 5
  OR NOT EXISTS (SELECT 1 FROM public.ce_scenario_questions q JOIN public.ce_scenarios s ON s.id = q.scenario_id
      WHERE s.format = 'multi_texte' AND s.title = 'Quatre gestes pour son quartier' AND q.order_index = 5 AND q.explanation LIKE '%redistribué%') THEN
    RAISE EXCEPTION 'ce_scenarios multi_texte : mise à jour incomplète';
  END IF;
END $$;
