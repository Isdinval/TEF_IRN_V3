-- Ajout de données pour l'Orthographe & Syntaxe (Format Voltaire) et Vocabulaire

-- 1. Exercices de Grammaire / Syntaxe (Trous avec crochets pour le format Voltaire)
INSERT INTO lessons (title, objective, content, level, category, order_index) VALUES
('Le Participe Passé', 'Maîtriser l''accord du participe passé avec l''auxiliaire être.', 'Le participe passé employé avec l''auxiliaire être s''accorde en genre et en nombre avec le sujet.', 'A2', 'grammaire', 1);

INSERT INTO exercises (lesson_id, type, level, instructions, content) VALUES
((SELECT id FROM lessons WHERE title = 'Le Participe Passé'), 'trous', 'A2', 'Corrigez l''accord du participe passé.',
 '{
   "sentence": "Elles [sont] parties en vacances.",
   "error_fragment": "sont",
   "correct_answer": "sont",
   "explanation": "L''auxiliaire être est déjà correct ici, mais vérifiez l''accord de partie."
 }'),
((SELECT id FROM lessons WHERE title = 'Le Participe Passé'), 'trous', 'A2', 'Corrigez l''accord.',
 '{
   "sentence": "La lettre est [écrit] par Marie.",
   "error_fragment": "écrit",
   "correct_answer": "écrite",
   "explanation": "Le sujet est féminin singulier (la lettre), donc on ajoute un -e."
 }');

-- 2. Vocabulaire (Thèmes pro)
INSERT INTO vocabulary (word, definition, example, level, category) VALUES
('Un titre de séjour', 'Document autorisant un étranger à résider en France.', 'Je dois renouveler mon titre de séjour à la préfecture.', 'A2', 'Administration'),
('La naturalisation', 'Action d''acquérir une nationalité autre que celle d''origine.', 'Il a déposé son dossier de naturalisation.', 'B1', 'Administration'),
('Une fiche de paie', 'Document remis par l''employeur lors du paiement du salaire.', 'Gardez bien toutes vos fiches de paie.', 'A2', 'Travail'),
('La période d''essai', 'Période au début d''un contrat de travail pour tester l''employé.', 'Ma période d''essai est de trois mois.', 'B2', 'Travail');
