-- Expansion Massive du Contenu - Maitris TEF IRN

-- 1. LEÇONS COMPLÈTES (Markdown)
INSERT INTO lessons (title, content, level, category, order_index) VALUES
('Se présenter (A1)', '## Présentation\nPour se présenter en français, on utilise :\n- **Je m''appelle...** (Nom)\n- **J''ai... ans** (Âge)\n- **J''habite à...** (Lieu)\n- **Je suis...** (Profession)\n\n### Exemple\n"Je m''appelle Marc, j''ai 30 ans et je suis boulanger."', 'A1', 'vocabulaire', 1),
('Les Nombres de 0 à 100', '## Les Chiffres\n0 : zéro, 1 : un, 2 : deux...\n\n### Points clés\n- 70 : soixante-dix\n- 80 : quatre-vingts\n- 90 : quatre-vingt-dix', 'A1', 'vocabulaire', 2),
('Le Présent - Verbes du 1er groupe', '## Les verbes en -ER\nOn retire -er et on ajoute : -e, -es, -e, -ons, -ez, -ent.\n\n### Exemple : Parler\nJe parl**e**, tu parl**es**, il parl**e**, nous parl**ons**, vous parl**ez**, ils parl**ent**.', 'A1', 'conjugaison', 3),
('L''Impératif (A2)', '## L''ordre et le conseil\nUtilisé pour donner des instructions.\n- *Parle !*\n- *Parlons !*\n- *Parlez !*\n\nAttention au "s" pour "tu" dans les verbes en -er : il disparaît.', 'A2', 'grammaire', 5),
('Rédiger un mail administratif (B1)', '## Structure d''un mail\n1. **Objet** : motif de la demande.\n2. **Formule d''appel** : Madame, Monsieur,\n3. **Corps** : Explication claire.\n4. **Formule de politesse** : Cordialement.', 'B1', 'syntaxe', 3),
('L''Hypothèse avec SI (B2)', '## Les structures de Si\n1. Si + présent -> Futur (Certitude)\n2. Si + imparfait -> Conditionnel (Imaginaire)\n\n### Exemple\n"Si je gagnais au loto, j''achèterais une villa."', 'B2', 'syntaxe', 3);

-- 2. VOCABULAIRE (Thématiques)
INSERT INTO vocabulary (word, definition, example, level, category) VALUES
('Mairie', 'Bâtiment où travaille le maire et ses adjoints.', 'Je vais à la mairie pour mon certificat.', 'A1', 'Administration'),
('Ordonnance', 'Document écrit par un médecin pour obtenir des médicaments.', 'Donnez cette ordonnance au pharmacien.', 'A2', 'Santé'),
('Chômage', 'Situation d''une personne qui n''a pas de travail.', 'Il est au chômage depuis deux mois.', 'B1', 'Travail'),
('Logement', 'Lieu où l''on habite.', 'Je cherche un logement plus grand.', 'A1', 'Logement'),
('Préfecture', 'Représentation de l''État dans un département.', 'Le titre de séjour se retire à la préfecture.', 'A2', 'Administration'),
('CV (Curriculum Vitae)', 'Document détaillant le parcours professionnel.', 'Envoyez votre CV par mail.', 'A2', 'Travail'),
('Bail', 'Contrat de location d''un logement.', 'Nous avons signé le bail hier.', 'B1', 'Logement'),
('Mutuelle', 'Assurance complémentaire santé.', 'Ma mutuelle rembourse les lunettes.', 'B1', 'Santé'),
('Délai', 'Temps accordé pour faire quelque chose.', 'Le délai d''inscription est dépassé.', 'B2', 'Administration'),
('Grève', 'Cessation du travail pour protester.', 'Il n''y a pas de trains à cause de la grève.', 'B1', 'Travail');

-- 3. EXERCICES QCM (Expansion)
INSERT INTO exercises (instructions, type, level, content) VALUES
('Trouvez la forme correcte au futur.', 'qcm', 'A2', '{
    "questions": ["Demain, je ___ à Paris.", "Nous ___ le match ce soir."],
    "options": [["vais", "irai", "irait", "allais"], ["regarderons", "regardons", "regarderont", "regardez"]],
    "correct_answers": [1, 0]
}'),
('Vocabulaire : Choisissez le mot juste.', 'qcm', 'B1', '{
    "questions": ["Le ___ est le prix à payer pour louer un appartement.", "Il faut payer une ___ pour garantir les dégâts."],
    "options": [["loyer", "salaire", "prix", "bail"], ["caution", "amende", "facture", "dette"]],
    "correct_answers": [0, 0]
}');
