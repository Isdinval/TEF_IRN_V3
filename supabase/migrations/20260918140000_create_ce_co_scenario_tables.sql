-- Chantier "pratique CE/CO dissociée de l'Examen Blanc" (branche add_pages).
--
-- Objectif : donner à Compréhension Écrite et Compréhension Orale le même
-- statut que Expression Écrite/Orale (writing_exam_scenarios,
-- oral_exam_scenarios) -- des tables dédiées, indépendantes de
-- exams/exam_questions, avec 1 "scenario" = 1 sujet autonome (texte ou
-- audio), catalogable par format (au lieu de Section A/B, qui n'existe pas
-- pour CE/CO).
--
-- Contrairement à EE/EO, un "sujet" CE/CO peut porter plusieurs questions
-- (texte à trous à 2 lacunes, document long_admin à 2 questions,
-- micro-trottoir à 3 questions sur le même audio) -- d'où le schéma en 2
-- tables (scenario + questions) plutôt qu'une table plate comme pour EE/EO.
--
-- Ce fichier crée les tables ET migre le contenu existant (132 questions
-- CE/CO des 3 Examens Blancs, décision Olivier du 2026-09-18 : "on les
-- utilise comme base" plutôt que de repartir de zéro). La colonne
-- temporaire group_key sert uniquement à regrouper les questions qui
-- partagent un même document (texte pour CE, audio_url pour CO) --
-- supprimée en fin de script, elle ne fait pas partie du schéma final.
--
-- Logique de regroupement vérifiée en dry-run (BEGIN/ROLLBACK) sur les
-- données réelles avant livraison : CE -> 45 scenarios / 60 questions,
-- CO -> 48 scenarios / 60 questions, et les 220 lignes de
-- exam_ce_co_attempts se retrouvent à l'identique (100 CE + 120 CO) dans
-- les nouvelles tables d'historique, sans perte ni doublon.
--
-- Les colonnes source_exam_id/source_exam_question_id sont gardées comme
-- traçabilité (savoir de quel Examen Blanc vient chaque ligne migrée) --
-- Examen Blanc lui-même n'est pas touché, exam_questions non plus.

-- ============================================================
-- Compréhension Écrite
-- ============================================================

create table ce_scenarios (
  id uuid primary key default gen_random_uuid(),
  format text not null check (format in ('court','trous','multi_texte','long_admin','article_presse')),
  -- Pas de contrainte stricte A2/B1/B2 (contrairement à writing_exam_scenarios) :
  -- exams.level utilise des plages ("A2-B1", "B1-B2"), pas des niveaux uniques --
  -- vérifié en base avant d'écrire cette contrainte.
  level text not null,
  title text,
  texte text,
  sub_texts jsonb,
  group_key text not null,
  source_exam_id uuid references exams(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table ce_scenario_questions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references ce_scenarios(id) on delete cascade,
  order_index int not null,
  question text not null,
  options text[] not null,
  correct_answer text not null,
  explanation text,
  highlight_gap int,
  source_exam_question_id uuid references exam_questions(id)
);
create index ce_scenario_questions_scenario_id_idx on ce_scenario_questions (scenario_id);

create table ce_scenario_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  scenario_question_id uuid not null references ce_scenario_questions(id),
  selected_answer text,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);
create index ce_scenario_attempts_user_id_idx on ce_scenario_attempts (user_id);

-- Migration du contenu : 1 scenario par document (texte partagé), sauf
-- multi_texte où texte est NULL sur toutes les lignes -> repli sur l'id de
-- la ligne (vérifié : les sub_texts de la 1re et de la 2e ligne de chaque
-- Examen Blanc sont bien différents, ce sont 2 documents distincts, jamais
-- un partage comme pour long_admin/trous/article_presse).
insert into ce_scenarios (format, level, texte, sub_texts, group_key, source_exam_id)
select distinct
  q.ce_format, e.level, q.texte, q.sub_texts,
  q.exam_id::text || '|' || q.ce_format || '|' || coalesce(q.texte, q.id::text),
  q.exam_id
from exam_questions q
join exams e on e.id = q.exam_id
where q.section = 'CE';

insert into ce_scenario_questions (scenario_id, order_index, question, options, correct_answer, explanation, highlight_gap, source_exam_question_id)
select s.id, q.order_index, q.question, q.options, q.correct_answer, q.explanation, q.highlight_gap, q.id
from exam_questions q
join ce_scenarios s
  on s.group_key = q.exam_id::text || '|' || q.ce_format || '|' || coalesce(q.texte, q.id::text)
where q.section = 'CE';

insert into ce_scenario_attempts (user_id, scenario_question_id, selected_answer, is_correct, created_at)
select a.user_id, csq.id, a.selected_answer, a.is_correct, a.created_at
from exam_ce_co_attempts a
join ce_scenario_questions csq on csq.source_exam_question_id = a.exam_question_id
where a.section = 'CE';

-- Titres provisoires (format lisible + numéro) -- placeholder en attendant
-- le pipeline de contenu dédié (item 2 du plan), jamais un "sujet" inventé.
update ce_scenarios s set title =
  initcap(replace(s.format, '_', ' ')) || ' n°' || sub.rn
from (
  select cs.id,
         row_number() over (
           partition by cs.source_exam_id, cs.format
           order by (select min(csq.order_index) from ce_scenario_questions csq where csq.scenario_id = cs.id)
         ) as rn
  from ce_scenarios cs
) sub
where sub.id = s.id;

alter table ce_scenarios drop column group_key;

-- ============================================================
-- Compréhension Orale
-- ============================================================

create table co_scenarios (
  id uuid primary key default gen_random_uuid(),
  format text not null check (format in ('annonce','repondeur','chronique','micro_trottoir','conversation')),
  level text not null,
  title text,
  audio_url text not null,
  transcription text,
  max_plays int,
  group_key text not null,
  source_exam_id uuid references exams(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table co_scenario_questions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references co_scenarios(id) on delete cascade,
  order_index int not null,
  question text not null,
  options text[] not null,
  correct_answer text not null,
  explanation text,
  source_exam_question_id uuid references exam_questions(id)
);
create index co_scenario_questions_scenario_id_idx on co_scenario_questions (scenario_id);

create table co_scenario_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  scenario_question_id uuid not null references co_scenario_questions(id),
  selected_answer text,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);
create index co_scenario_attempts_user_id_idx on co_scenario_attempts (user_id);

-- audio_url n'est jamais NULL pour CO (vérifié en base) : pas besoin du
-- repli utilisé pour ce_format=multi_texte côté CE.
insert into co_scenarios (format, level, audio_url, transcription, max_plays, group_key, source_exam_id)
select distinct
  q.co_format, e.level, q.audio_url, q.transcription, q.max_plays,
  q.exam_id::text || '|' || q.co_format || '|' || q.audio_url,
  q.exam_id
from exam_questions q
join exams e on e.id = q.exam_id
where q.section = 'CO';

insert into co_scenario_questions (scenario_id, order_index, question, options, correct_answer, explanation, source_exam_question_id)
select s.id, q.order_index, q.question, q.options, q.correct_answer, q.explanation, q.id
from exam_questions q
join co_scenarios s
  on s.group_key = q.exam_id::text || '|' || q.co_format || '|' || q.audio_url
where q.section = 'CO';

insert into co_scenario_attempts (user_id, scenario_question_id, selected_answer, is_correct, created_at)
select a.user_id, csq.id, a.selected_answer, a.is_correct, a.created_at
from exam_ce_co_attempts a
join co_scenario_questions csq on csq.source_exam_question_id = a.exam_question_id
where a.section = 'CO';

update co_scenarios s set title =
  initcap(replace(s.format, '_', ' ')) || ' n°' || sub.rn
from (
  select cs.id,
         row_number() over (
           partition by cs.source_exam_id, cs.format
           order by (select min(csq.order_index) from co_scenario_questions csq where csq.scenario_id = cs.id)
         ) as rn
  from co_scenarios cs
) sub
where sub.id = s.id;

alter table co_scenarios drop column group_key;
