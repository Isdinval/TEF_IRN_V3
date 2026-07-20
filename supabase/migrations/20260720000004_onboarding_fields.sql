-- Ajoute les champs nécessaires pour distinguer un utilisateur onboardé
-- d'un utilisateur qui ne l'est pas, et pour capturer les signaux
-- de personnalisation collectés lors de l'onboarding.
alter table profiles
  add column onboarding_completed boolean not null default false,
  add column target_exam_date date,
  add column weekly_availability text check (weekly_availability in ('lt_2h','2_5h','5_10h','gt_10h')),
  add column weak_skill text check (weak_skill in ('comprehension_orale','comprehension_ecrite','expression_orale','expression_ecrite'));
