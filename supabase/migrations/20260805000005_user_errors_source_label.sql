-- Item 10.1 du plan de correction du dashboard (analyse détaillée) :
--
-- user_errors est un compteur agrégé (frequency, last_seen_at) mais ne garde
-- aucune trace de l'épreuve qui a généré chaque erreur. Impossible donc, pour
-- la card "En attente d'une action ciblée" (Aujourd'hui), d'afficher un rappel
-- du type "Dans ton Examen blanc du 3 août, tu as fait une erreur de type
-- Grammaire (Comparatifs)".
--
-- source_label capture l'origine de la DERNIÈRE occurrence de l'erreur (mise à
-- jour à chaque appel de trackUserError, en même temps que last_seen_at) :
-- 'Exercice ciblé' (lecons/QCM via /api/exercise-complete), 'Écrit' ou
-- 'Examen blanc' (selon context, via /api/writing/scenario-complete), 'Oral'
-- ou 'Examen blanc' (selon context, via /api/oral/analyze).
--
-- Nullable : les lignes déjà existantes n'ont pas cette info (fallback
-- "Origine non précisée" côté frontend, décidé avec Olivier).

ALTER TABLE public.user_errors
  ADD COLUMN source_label TEXT;
