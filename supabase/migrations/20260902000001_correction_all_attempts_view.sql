-- Item 1 du plan "Refonte page Correction" : la page /tef-irn/correction (et la
-- vue writing_all_attempts qu'elle consomme) ne couvre que l'Expression Écrite
-- (exercise_attempts type='ecrit' + writing_scenario_attempts). L'Expression
-- Orale a sa propre page dédiée (/tef-irn/oral/history), jamais fusionnée.
--
-- Scope validé avec Olivier (CE/CO explicitement exclus du plan -- exam_ce_co_attempts
-- ne persiste ni correct_answer ni explanation après réponse, aucun "niveau CECRL
-- apparent" n'existe pour ce format ; réintroduire CE/CO nécessiterait un chantier
-- séparé, non traité ici).
--
-- Cette vue ajoute :
-- - 'skill' ('EE' | 'EO') : distingue les deux compétences, nécessaire pour le
--   filtre "Type" et les 2 courbes du graphique (item 2/3 du plan).
-- - 'context' ('standalone' | 'exam') : distingue pratique libre (pages
--   writing/oral) et examen blanc, réutilise la colonne déjà posée par la
--   migration 20260805000001_writing_oral_context_column.sql.
-- - 'estimated_level' : niveau CECRL ABSOLU démontré à cette tentative (à ne pas
--   confondre avec 'level', le niveau VISÉ par le sujet -- voir
--   docs/writing-correction-levels.md, section "Deux métriques distinctes").
--   Vient de writing_scenario_attempts.niveau_apparent_cecrl (EE examen),
--   answers->feedback->>niveau_apparent_cecrl (EE pratique libre, même valeur
--   IA que l'examen mais jamais extraite en colonne dédiée côté exercise_attempts
--   -- non nécessaire, disponible dans answers), ou oral_session_results.estimated_level
--   (EO, les deux contextes). NULL sur les tentatives antérieures à l'introduction
--   de ce champ IA (pas de backfill rétroactif, comportement déjà accepté ailleurs).
--
-- Fix mineur au passage : le bloc EE examen (writing_scenario_attempts) de
-- l'ancienne writing_all_attempts n'incluait pas niveau_apparent_cecrl/
-- niveau_apparent_justification dans le jsonb 'feedback' malgré leur présence en
-- base depuis la migration 20260828000001_writing_niveau_apparent.sql -- corrigé
-- ici, la vue détail EE (CorrectionDetailView) peut donc aussi afficher ce niveau
-- pour les tentatives d'examen blanc, pas seulement la pratique libre.
--
-- 'exercise_attempts' est filtré sur e.type = 'ecrit' (contrairement à l'ancienne
-- vue qui prenait toute la table) : cette vue sert uniquement à la page Correction,
-- qui n'a jamais affiché de qcm/trous (déjà filtrés côté front par
-- .not('answers->feedback', 'is', null), mais autant être explicite dans la vue
-- elle-même plutôt que de compter sur ce filtre client implicite).
--
-- security_invoker = true indispensable (même raison que writing_all_attempts) :
-- sans ça la vue s'exécute avec les droits du propriétaire et contournerait la
-- RLS "auth.uid() = user_id" des 3 tables sources.
--
-- writing_all_attempts n'est PAS supprimée dans cette migration : le front
-- (/tef-irn/correction/page.tsx) continue de la lire tel quel jusqu'à l'item 2
-- (bascule du front + filtre + graphique), pour ne pas faire apparaître de lignes
-- EO dans un composant aujourd'hui typé exclusivement pour l'EE (CorrectionCard/
-- CorrectionDetailView liraient answers.text sur une tentative EO qui n'a que
-- answers.transcript -- crash évité en gardant l'ancienne vue en place jusqu'au
-- patch qui adapte le front en conséquence).
--
-- Testé avant livraison (transaction BEGIN/CREATE VIEW/SELECT/ROLLBACK sur le
-- projet jksrmyyfllitrkarvgvk) : vue compilée sans erreur, lignes EE (standalone)
-- et leur estimated_level vérifiées correctes sur données réelles.

CREATE OR REPLACE VIEW public.correction_all_attempts
WITH (security_invoker = true) AS
SELECT
  ea.id,
  ea.user_id,
  ea.exercise_id,
  ea.score,
  ea.is_completed,
  ea.created_at,
  ea.study_time_minutes,
  ea.answers,
  jsonb_build_object(
    'id', e.id,
    'instructions', e.instructions,
    'level', e.level,
    'type', e.type,
    'category', e.category
  ) as exercise,
  'srs'::text as source,
  'EE'::text as skill,
  'standalone'::text as context,
  (ea.answers -> 'feedback' ->> 'niveau_apparent_cecrl') as estimated_level

FROM public.exercise_attempts ea
LEFT JOIN public.exercises e ON e.id = ea.exercise_id
WHERE e.type = 'ecrit'

UNION ALL

SELECT
  wsa.id,
  wsa.user_id,
  NULL::uuid as exercise_id,
  wsa.overall_score::double precision as score,
  true as is_completed,
  wsa.created_at,
  wsa.study_time_minutes,
  jsonb_build_object(
    'text', wsa.submitted_text,
    'subject', COALESCE(wes.sujet, 'Sujet d''examen blanc'),
    'feedback', jsonb_build_object(
      'score_global', wsa.overall_score,
      'scores_par_competence', wsa.scores,
      'liste_des_erreurs', wsa.errors,
      'conseil_general', wsa.general_comment,
      'texte_corrige_complet', wsa.corrected_text,
      'level', wsa.level,
      'niveau_apparent_cecrl', wsa.niveau_apparent_cecrl,
      'niveau_apparent_justification', wsa.niveau_apparent_justification
    )
  ) as answers,
  jsonb_build_object(
    'id', wsa.scenario_id,
    'instructions', COALESCE(wes.sujet, 'Sujet d''examen blanc'),
    'level', wsa.level,
    'type', 'examen_blanc',
    'category', wsa.section
  ) as exercise,
  'scenario'::text as source,
  'EE'::text as skill,
  wsa.context,
  wsa.niveau_apparent_cecrl as estimated_level

FROM public.writing_scenario_attempts wsa
LEFT JOIN public.writing_exam_scenarios wes ON wes.id = wsa.scenario_id

UNION ALL

SELECT
  osr.id,
  osr.user_id,
  NULL::uuid as exercise_id,
  osr.overall_score::double precision as score,
  true as is_completed,
  osr.created_at,
  0 as study_time_minutes,
  jsonb_build_object(
    'transcript', osr.transcript,
    'subject', COALESCE(oes.title, 'Session d''entretien oral'),
    'feedback', jsonb_build_object(
      'scores', osr.scores,
      'strengths', osr.strengths,
      'improvements', osr.improvements,
      'general_comment', osr.general_comment,
      'estimated_level', osr.estimated_level,
      'level', osr.level
    )
  ) as answers,
  jsonb_build_object(
    'id', osr.scenario_id,
    'instructions', COALESCE(oes.title, 'Session d''entretien oral'),
    'level', osr.level,
    'type', CASE WHEN osr.context = 'exam' THEN 'examen_blanc' ELSE 'entretien_oral' END,
    'category', osr.section
  ) as exercise,
  'oral'::text as source,
  'EO'::text as skill,
  osr.context,
  osr.estimated_level

FROM public.oral_session_results osr
LEFT JOIN public.oral_exam_scenarios oes ON oes.id = osr.scenario_id;

GRANT SELECT ON public.correction_all_attempts TO authenticated;
