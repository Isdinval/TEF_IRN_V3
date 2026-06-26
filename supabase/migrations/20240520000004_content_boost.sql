-- Boost de contenu pour LlamaKusi - TEF IRN

-- 1. LEÇONS FONDAMENTALES (A1-B2)
INSERT INTO lessons (title, content, level, category, order_index) VALUES
('Les Salutations et Présentations', 'Apprendre à dire bonjour, se présenter, donner son âge...', 'A1', 'vocabulaire', 3),
('Le Futur Proche', 'Aller + infinitif. Je vais manger, tu vas partir...', 'A2', 'conjugaison', 3),
('Le Subjonctif Présent', 'Expression du doute, du souhait, de l''obligation. Il faut que je sache...', 'B2', 'conjugaison', 1),
('Les Connecteurs Logiques', 'D''abord, ensuite, cependant, néanmoins...', 'B1', 'syntaxe', 2),
('La Négation complexe', 'Ne... jamais, ne... plus, ne... personne, ne... rien...', 'A2', 'grammaire', 4);

-- 2. EXERCICES QCM SUPPLÉMENTAIRES
INSERT INTO exercises (instructions, type, level, content) VALUES
('Choisissez la forme correcte du subjonctif.', 'qcm', 'B2', '{
    "questions": ["Il est important que tu ___ la vérité.", "Je doute qu''il ___ venir demain."],
    "options": [["sais", "sait", "saches", "savent"], ["peut", "puisse", "pouvoir", "pouvait"]],
    "correct_answers": [2, 1]
}'),
('Trouvez le connecteur logique approprié.', 'qcm', 'B1', '{
    "questions": ["Il pleut, ___ j''ai pris mon parapluie.", "J''aime le sport, ___ je n''ai pas le temps d''en faire."],
    "options": [["car", "donc", "mais", "puisque"], ["mais", "donc", "car", "et"]],
    "correct_answers": [1, 0]
}'),
('Complétez avec la négation correcte.', 'qcm', 'A2', '{
    "questions": ["Je n''ai ___ mangé de caviar de ma vie.", "Il ne reste ___ de pain dans la boulangerie."],
    "options": [["jamais", "plus", "rien", "personne"], ["plus", "jamais", "personne", "rien"]],
    "correct_answers": [0, 0]
}');

-- 3. SUJETS D'EXPRESSION ÉCRITE SUPPLÉMENTAIRES
INSERT INTO exercises (instructions, type, level, content) VALUES
('Section B : Le télétravail. Écrivez un texte pour convaincre votre patron des bienfaits du télétravail (3 jours par semaine). (100 mots min)', 'ecrit', 'B2', '{
    "subject": "Télétravail",
    "min_words": 100
}'),
('Section A : Remerciements. Vous avez passé le week-end chez des amis. Écrivez-leur un petit mot pour les remercier. (40 mots min)', 'ecrit', 'A2', '{
    "subject": "Remerciements",
    "min_words": 40
}'),
('Section B : Écologie. Votre quartier jette trop de déchets. Écrivez une lettre ouverte pour proposer l''installation de composteurs collectifs. (100 mots min)', 'ecrit', 'B1', '{
    "subject": "Compostage",
    "min_words": 100
}');
