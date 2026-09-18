-- Suite de la migration précédente (20260918140000_create_ce_co_scenario_tables.sql).
--
-- Les 6 tables ont RLS activé par défaut (configuration du projet) mais
-- aucune policy n'existait encore -- en l'état, personne (même un
-- utilisateur normal) ne pouvait ni les lire ni y écrire. Repris à
-- l'identique le modèle déjà en place pour exam_questions/
-- writing_exam_scenarios (vérifié en base avant d'écrire ce fichier,
-- cf. pg_policies) :
-- - ce_scenarios/co_scenarios (métadonnées, rien de secret) : lecture
--   publique, écriture admin -- miroir de "Allow read access for all
--   users" sur writing_exam_scenarios.
-- - ce_scenario_questions/co_scenario_questions (contiennent
--   correct_answer/explanation) : lecture admin uniquement -- miroir de
--   exam_questions. Une vue "_public" (sans ces 2 colonnes) est le seul
--   accès en lecture pour un utilisateur normal, comme
--   exam_questions_public.
-- - ce_scenario_attempts/co_scenario_attempts : chacun ne voit/insère que
--   ses propres lignes -- miroir de exam_ce_co_attempts.
--
-- Testé en dry-run (BEGIN/ROLLBACK) avec un utilisateur authentifié
-- non-admin simulé (SET LOCAL ROLE) avant livraison : scenarios et vues
-- publiques lisibles, table brute des questions bloquée, insertion +
-- lecture d'une tentative limitées à ses propres lignes.

-- ============================================================
-- Compréhension Écrite
-- ============================================================

create policy "Allow read access for all users" on ce_scenarios
  for select to public using (true);
create policy "Admins can insert ce scenarios" on ce_scenarios
  for insert to authenticated with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "Admins can update ce scenarios" on ce_scenarios
  for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "Admins can delete ce scenarios" on ce_scenarios
  for delete to authenticated using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));

create policy "Admins can read all ce scenario questions" on ce_scenario_questions
  for select to authenticated using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "Admins can insert ce scenario questions" on ce_scenario_questions
  for insert to authenticated with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "Admins can update ce scenario questions" on ce_scenario_questions
  for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "Admins can delete ce scenario questions" on ce_scenario_questions
  for delete to authenticated using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));

-- Jamais correct_answer/explanation ici (audit sécurité TEF IRN, item 1) :
-- la correction reste faite côté serveur (client admin), jamais par le
-- navigateur.
create view ce_scenario_questions_public as
select cq.id, cq.scenario_id, cq.order_index, cq.question, cq.options, cq.highlight_gap
from ce_scenario_questions cq;

create policy "Users can insert their own ce scenario attempts" on ce_scenario_attempts
  for insert to public with check (auth.uid() = user_id);
create policy "Users can view their own ce scenario attempts" on ce_scenario_attempts
  for select to public using (auth.uid() = user_id);

-- ============================================================
-- Compréhension Orale
-- ============================================================

create policy "Allow read access for all users" on co_scenarios
  for select to public using (true);
create policy "Admins can insert co scenarios" on co_scenarios
  for insert to authenticated with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "Admins can update co scenarios" on co_scenarios
  for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "Admins can delete co scenarios" on co_scenarios
  for delete to authenticated using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));

create policy "Admins can read all co scenario questions" on co_scenario_questions
  for select to authenticated using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "Admins can insert co scenario questions" on co_scenario_questions
  for insert to authenticated with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "Admins can update co scenario questions" on co_scenario_questions
  for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true))
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));
create policy "Admins can delete co scenario questions" on co_scenario_questions
  for delete to authenticated using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin = true));

create view co_scenario_questions_public as
select cq.id, cq.scenario_id, cq.order_index, cq.question, cq.options
from co_scenario_questions cq;

create policy "Users can insert their own co scenario attempts" on co_scenario_attempts
  for insert to public with check (auth.uid() = user_id);
create policy "Users can view their own co scenario attempts" on co_scenario_attempts
  for select to public using (auth.uid() = user_id);
