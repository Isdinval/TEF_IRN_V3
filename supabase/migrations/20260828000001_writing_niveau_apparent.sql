-- Item 5 du plan "niveau apparent EE" : persiste le niveau CECRL apparent (indépendant
-- du score de conformité au sujet) renvoyé par l'IA, voir docs/writing-correction-levels.md
-- et src/app/api/writing/correct/route.ts (niveau_apparent_cecrl / niveau_apparent_justification).
--
-- Colonnes nullables : les tentatives déjà en base avant cette migration n'ont pas ce
-- champ (pas de backfill IA rétroactif) -- voir item 9 du plan, gestion du fallback UI.
--
-- Validé par dry-run BEGIN/ROLLBACK sur le projet jksrmyyfllitrkarvgvk avant livraison.

ALTER TABLE writing_scenario_attempts
  ADD COLUMN niveau_apparent_cecrl text,
  ADD COLUMN niveau_apparent_justification text;

ALTER TABLE writing_scenario_attempts
  ADD CONSTRAINT writing_scenario_attempts_niveau_apparent_cecrl_check
  CHECK (niveau_apparent_cecrl IS NULL OR niveau_apparent_cecrl IN ('A1', 'A2', 'B1', 'B2'));
