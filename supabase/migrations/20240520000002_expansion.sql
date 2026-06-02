-- Expansion du Seed Data pour Maitris

-- 1. NOUVELLES LEÇONS
INSERT INTO lessons (id, title, content, level, category, order_index) VALUES
(gen_random_uuid(), 'Le Passé Composé', 'Formation avec avoir ou être...', 'A2', 'conjugaison', 2),
(gen_random_uuid(), 'Les Pronoms Relatifs', 'Qui, que, dont, où...', 'B1', 'grammaire', 3),
(gen_random_uuid(), 'La Condition', 'Si + présent -> futur, si + imparfait -> conditionnel...', 'B2', 'syntaxe', 2),
(gen_random_uuid(), 'Vocabulaire Administratif', 'Mairie, préfecture, titre de séjour, formulaire...', 'A2', 'vocabulaire', 1);

-- 2. NOUVEAUX EXERCICES (QCM)
INSERT INTO exercises (id, instructions, type, level, content) VALUES
(gen_random_uuid(), 'Complétez avec le pronom correct.', 'qcm', 'B1', '{
    "questions": ["C''est l''homme ___ j''ai rencontré hier."],
    "options": [["qui", "que", "dont", "où"]],
    "correct_answers": [1]
}'),
(gen_random_uuid(), 'Trouvez le terme administratif correct.', 'qcm', 'A2', '{
    "questions": ["Je dois aller à la ___ pour mon passeport."],
    "options": [["boulangerie", "mairie", "piscine", "bibliothèque"]],
    "correct_answers": [1]
}');

-- 3. NOUVEAUX SUJETS D'EXPRESSION ÉCRITE
INSERT INTO exercises (id, instructions, type, level, content) VALUES
(gen_random_uuid(), 'Section A : Vous avez déménagé. Écrivez à un ancien collègue pour lui donner votre nouvelle adresse et l''inviter à passer. (40 mots min)', 'ecrit', 'A2', '{
    "subject": "Déménagement",
    "min_words": 40
}'),
(gen_random_uuid(), 'Section B : Votre ville veut fermer la bibliothèque municipale. Écrivez un courrier au journal local pour protester et expliquer l''importance de la lecture. (100 mots min)', 'ecrit', 'B2', '{
    "subject": "Fermeture bibliothèque",
    "min_words": 100
}');
