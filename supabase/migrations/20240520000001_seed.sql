-- Seed Data pour LlamaKusi

-- 1. LESSONS
INSERT INTO lessons (id, title, content, level, category, order_index) VALUES
(gen_random_uuid(), 'Le Présent de l''indicatif', 'Le présent s''utilise pour parler d''actions actuelles ou de vérités générales...', 'A1', 'conjugaison', 1),
(gen_random_uuid(), 'Les Articles Défis et Indéfinis', 'Le, la, les vs un, une, des...', 'A1', 'grammaire', 2),
(gen_random_uuid(), 'Exprimer son opinion', 'Je pense que, je crois que, à mon avis...', 'B1', 'syntaxe', 1);

-- 2. EXERCISES (QCM)
INSERT INTO exercises (id, instructions, type, level, content) VALUES
(gen_random_uuid(), 'Choisissez l''article correct.', 'qcm', 'A1', '{
    "questions": ["___ chat dort sur le tapis."],
    "options": [["Le", "Un", "La", "Les"]],
    "correct_answers": [0]
}'),
(gen_random_uuid(), 'Conjuguez le verbe au présent.', 'qcm', 'A1', '{
    "questions": ["Nous ___ (parler) français."],
    "options": [["parle", "parles", "parlons", "parlent"]],
    "correct_answers": [2]
}');

-- 3. EXERCISES (Expression Écrite)
INSERT INTO exercises (id, instructions, type, level, content) VALUES
(gen_random_uuid(), 'Section A : Vous écrivez à un ami pour l''inviter à votre anniversaire. (40 mots minimum)', 'ecrit', 'A2', '{
    "subject": "Invitation anniversaire",
    "min_words": 40
}'),
(gen_random_uuid(), 'Section B : Vous écrivez à votre maire pour suggérer la création d''une piste cyclable. (100 mots minimum)', 'ecrit', 'B2', '{
    "subject": "Piste cyclable",
    "min_words": 100
}');
