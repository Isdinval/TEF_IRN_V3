-- Relie chaque question EO d'examen à un scénario oral_exam_scenarios réel,
-- afin que l'épreuve EO puisse être passée avec le vrai coach Realtime
-- (même moteur que /oral) plutôt qu'un écran statique.

ALTER TABLE public.exam_questions
  ADD COLUMN IF NOT EXISTS oral_scenario_id uuid REFERENCES public.oral_exam_scenarios(id);

DO $$
DECLARE
  s1a uuid; s1b uuid; s2a uuid; s2b uuid; s3a uuid; s3b uuid;
BEGIN
  INSERT INTO public.oral_exam_scenarios (section, level, title, role_interlocuteur, sujet, objectifs, is_active)
  VALUES ('A', 'A2', 'Renseignement - centre de formation',
    'Un(e) secrétaire d''un centre de formation de langues qui répond au téléphone.',
    'Le candidat vous appelle pour obtenir des informations sur un cours de français : horaires, prix et modalités d''inscription.',
    '["Donner les horaires des cours", "Donner le prix", "Expliquer comment s''inscrire"]'::jsonb, true)
  RETURNING id INTO s1a;

  INSERT INTO public.oral_exam_scenarios (section, level, title, role_interlocuteur, sujet, objectifs, is_active)
  VALUES ('B', 'A2', 'Convaincre - activité sportive',
    'Un(e) ami(e) qui hésite à s''inscrire à une nouvelle activité sportive.',
    'Vous hésitez à participer à une nouvelle activité sportive. Le candidat doit vous convaincre en présentant les avantages.',
    '["Se laisser convaincre par des arguments sur la santé, les rencontres et le plaisir"]'::jsonb, true)
  RETURNING id INTO s1b;

  INSERT INTO public.oral_exam_scenarios (section, level, title, role_interlocuteur, sujet, objectifs, is_active)
  VALUES ('A', 'B1', 'Renseignement - offre d''emploi',
    'Un(e) chargé(e) de recrutement qui répond au téléphone de l''entreprise.',
    'Le candidat vous appelle pour se renseigner sur un poste vacant : missions, horaires et démarches pour postuler.',
    '["Décrire les missions du poste", "Préciser les horaires", "Expliquer comment postuler"]'::jsonb, true)
  RETURNING id INTO s2a;

  INSERT INTO public.oral_exam_scenarios (section, level, title, role_interlocuteur, sujet, objectifs, is_active)
  VALUES ('B', 'B1', 'Convaincre - demande d''augmentation',
    'Un(e) collègue qui hésite à demander une augmentation à son responsable.',
    'Vous hésitez à demander une augmentation de salaire. Le candidat doit vous convaincre de faire cette démarche.',
    '["Se laisser convaincre par des arguments sur la légitimité de la demande et la façon de la formuler"]'::jsonb, true)
  RETURNING id INTO s2b;

  INSERT INTO public.oral_exam_scenarios (section, level, title, role_interlocuteur, sujet, objectifs, is_active)
  VALUES ('A', 'B2', 'Renseignement - rendez-vous médical',
    'Un(e) secrétaire médical(e) qui répond au téléphone du cabinet.',
    'Le candidat vous appelle pour prendre un rendez-vous médical et expliquer brièvement ses symptômes.',
    '["Proposer un rendez-vous", "Demander la nature des symptômes", "Confirmer les modalités du rendez-vous"]'::jsonb, true)
  RETURNING id INTO s3a;

  INSERT INTO public.oral_exam_scenarios (section, level, title, role_interlocuteur, sujet, objectifs, is_active)
  VALUES ('B', 'B2', 'Convaincre - changer de quartier',
    'Un(e) ami(e) qui hésite à emménager dans le quartier du candidat.',
    'Vous hésitez à emménager dans le quartier du candidat. Le candidat doit vous convaincre en présentant les avantages d''y habiter.',
    '["Se laisser convaincre par des arguments sur les commerces, les transports et l''ambiance du quartier"]'::jsonb, true)
  RETURNING id INTO s3b;

  UPDATE public.exam_questions eq SET oral_scenario_id = s1a
    FROM public.exams e WHERE eq.exam_id = e.id AND e.slug = 'exam-1' AND eq.section = 'EO' AND eq.order_index = 42;
  UPDATE public.exam_questions eq SET oral_scenario_id = s1b
    FROM public.exams e WHERE eq.exam_id = e.id AND e.slug = 'exam-1' AND eq.section = 'EO' AND eq.order_index = 43;
  UPDATE public.exam_questions eq SET oral_scenario_id = s2a
    FROM public.exams e WHERE eq.exam_id = e.id AND e.slug = 'exam-2' AND eq.section = 'EO' AND eq.order_index = 42;
  UPDATE public.exam_questions eq SET oral_scenario_id = s2b
    FROM public.exams e WHERE eq.exam_id = e.id AND e.slug = 'exam-2' AND eq.section = 'EO' AND eq.order_index = 43;
  UPDATE public.exam_questions eq SET oral_scenario_id = s3a
    FROM public.exams e WHERE eq.exam_id = e.id AND e.slug = 'exam-3' AND eq.section = 'EO' AND eq.order_index = 42;
  UPDATE public.exam_questions eq SET oral_scenario_id = s3b
    FROM public.exams e WHERE eq.exam_id = e.id AND e.slug = 'exam-3' AND eq.section = 'EO' AND eq.order_index = 43;
END $$;
