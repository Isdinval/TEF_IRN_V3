-- Révision ciblée de exam-1 suite à la vérification de source par Olivier (vidéo officielle
-- CCI IRN-spécifique). Applique les règles 7 et 8 nouvellement ajoutées à
-- docs/ce-content-calibration-rules.md :
--   - Règle 7 : le format trous doit mixer phrase à trous (1 lacune) et texte à trous
--     (paragraphe, 2 lacunes), pas uniquement la variante paragraphe.
--   - Règle 8 : sur un document long_admin à 2 questions, 1 question générale (message
--     principal) + 1 question précise (détail), jamais 2 questions de détail.
--
-- Migration ciblée : seules les questions order_index 24-27 (trous) et 30-33 (long_admin,
-- 2 premiers documents) sont remplacées. court (20-23), multi_texte (28-29),
-- long_admin document 3 (34) et article_presse (35-39) restent inchangés.

DO $$
DECLARE
  v_exam_id uuid;
BEGIN
  SELECT id INTO v_exam_id FROM public.exams WHERE slug = 'exam-1';

  IF v_exam_id IS NULL THEN
    RAISE EXCEPTION 'Exam with slug exam-1 not found';
  END IF;

  DELETE FROM public.exam_questions
  WHERE exam_id = v_exam_id AND section = 'CE' AND order_index IN (24, 25, 26, 27, 30, 31, 32, 33);

  -- ===================== TROUS — mix texte à trous (24-25) + phrase à trous (26-27) =====================
  -- Texte à trous (paragraphe, 2 lacunes partagées) — inchangé par rapport à la version précédente.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format, highlight_gap)
  VALUES
  (v_exam_id, 'CE', 24, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Pour faciliter les démarches des usagers, la préfecture a mis en place un numéro unique permettant d''___________ (1) directement à un conseiller, sans passer par plusieurs services différents. Cette mesure vise à ___________ (2) les délais d''attente, souvent jugés trop longs par les usagers.',
    '(1)',
    ARRAY['A) accéder','B) renoncer','C) recourir','D) échapper'], 'A', 'trous', 1),
  (v_exam_id, 'CE', 25, 'text', 'Lisez le texte et choisissez le mot qui complète chaque lacune.',
    'Pour faciliter les démarches des usagers, la préfecture a mis en place un numéro unique permettant d''___________ (1) directement à un conseiller, sans passer par plusieurs services différents. Cette mesure vise à ___________ (2) les délais d''attente, souvent jugés trop longs par les usagers.',
    '(2)',
    ARRAY['A) réduire','B) prolonger','C) maintenir','D) doubler'], 'A', 'trous', 2);

  -- Phrase à trous (nouveau sous-type, 1 phrase = 1 lacune = 1 question) — remplace l'ancien
  -- 2e texte à trous "allocataires" pour introduire la variété exigée par la règle 7.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format, highlight_gap)
  VALUES
  (v_exam_id, 'CE', 26, 'text', 'Lisez la phrase et choisissez le mot qui la complète.',
    'Pour renouveler sa carte d''identité, il faut d''abord ___________ (1) un rendez-vous en ligne.',
    '(1)',
    ARRAY['A) prendre','B) donner','C) perdre','D) vendre'], 'A', 'trous', 1),
  (v_exam_id, 'CE', 27, 'text', 'Lisez la phrase et choisissez le mot qui la complète.',
    'Le dossier de demande de logement social doit être ___________ (1) avant la fin du mois.',
    '(1)',
    ARRAY['A) déposé','B) prolongé','C) affiché','D) oublié'], 'A', 'trous', 1);

  -- ===================== LONG_ADMIN — règle 8 : 1 question générale + 1 précise =====================
  -- Document 1 (CAF) : Q30 devient une question générale sur le message principal du courrier
  -- (au lieu d'une 2e question de détail). Q31 (précise, risque en cas de non-réponse) inchangée.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 30, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'La Caisse d''Allocations Familiales accuse réception de votre dossier de demande d''aide au logement, déposé le 3 février. Après une première vérification, il apparaît que votre dossier est incomplet : l''attestation de loyer signée par votre bailleur n''a pas été jointe.\n\nNous vous invitons à nous transmettre ce document dans les meilleurs délais afin que l''instruction de votre demande puisse se poursuivre. Sans réponse de votre part sous deux mois, votre demande sera considérée comme abandonnée.',
    'Quel est le message principal de ce courrier ?',
    ARRAY['A) Le dossier est accepté et va être traité','B) Le dossier est incomplet et doit être complété','C) Le dossier est refusé définitivement','D) Le dossier n''a pas été reçu'], 'B', 'long_admin'),
  (v_exam_id, 'CE', 31, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'La Caisse d''Allocations Familiales accuse réception de votre dossier de demande d''aide au logement, déposé le 3 février. Après une première vérification, il apparaît que votre dossier est incomplet : l''attestation de loyer signée par votre bailleur n''a pas été jointe.\n\nNous vous invitons à nous transmettre ce document dans les meilleurs délais afin que l''instruction de votre demande puisse se poursuivre. Sans réponse de votre part sous deux mois, votre demande sera considérée comme abandonnée.',
    'Que risque le demandeur s''il ne répond pas dans les deux mois ?',
    ARRAY['A) Une pénalité financière','B) La clôture automatique de sa demande','C) Une convocation en préfecture','D) Le renouvellement automatique du dossier'], 'B', 'long_admin');

  -- Document 2 (naturalisation) : Q32 devient une question générale sur l'objet du courrier
  -- (au lieu de porter sur le motif précis du report). Q33 (précise, retard >15min) inchangée.
  INSERT INTO public.exam_questions
    (exam_id, section, order_index, type, instructions, texte, question, options, correct_answer, ce_format)
  VALUES
  (v_exam_id, 'CE', 32, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le service des naturalisations vous informe que votre entretien d''assimilation, initialement prévu le 14 mars, est reporté au 28 mars à 9h30, en raison d''un empêchement de l''agent instructeur.\n\nMerci de vous présenter avec l''ensemble des pièces justificatives déjà transmises, ainsi qu''une pièce d''identité en cours de validité. Tout retard supérieur à quinze minutes entraînera l''annulation du rendez-vous.',
    'Quel est l''objet principal de ce courrier ?',
    ARRAY['A) Convoquer le candidat pour un nouvel entretien','B) Informer d''un refus de naturalisation','C) Demander des pièces complémentaires','D) Confirmer l''obtention de la nationalité'], 'A', 'long_admin'),
  (v_exam_id, 'CE', 33, 'text', 'Lisez attentivement le document et répondez à la question.',
    E'Le service des naturalisations vous informe que votre entretien d''assimilation, initialement prévu le 14 mars, est reporté au 28 mars à 9h30, en raison d''un empêchement de l''agent instructeur.\n\nMerci de vous présenter avec l''ensemble des pièces justificatives déjà transmises, ainsi qu''une pièce d''identité en cours de validité. Tout retard supérieur à quinze minutes entraînera l''annulation du rendez-vous.',
    'Que se passe-t-il si le candidat arrive avec plus de quinze minutes de retard ?',
    ARRAY['A) Il doit attendre la fin des autres entretiens','B) Le rendez-vous n''est plus maintenu','C) Il reçoit un avertissement écrit','D) L''entretien est simplement raccourci'], 'B', 'long_admin');

END $$;
