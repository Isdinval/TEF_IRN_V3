-- Seed pour un Examen Blanc Complet (Format 2025)

INSERT INTO lessons (title, objective, content, level, category, order_index) VALUES
('Examen Blanc #1', 'Simulation complète du TEF IRN.', 'Cet examen regroupe les 4 épreuves du TEF IRN.', 'B1', 'grammaire', 99);

-- On va créer une structure simplifiée pour l'exercice de type 'examen'
-- Pour le MVP on va gérer les questions CE/CO dans JSONB
INSERT INTO exercises (lesson_id, type, level, instructions, content) VALUES
((SELECT id FROM lessons WHERE title = 'Examen Blanc #1'), 'qcm', 'B1', 'Simulation TEF IRN 2025',
 '{
   "sections": {
     "CE": [
       {"id": "ce1", "question": "Que signifie ce panneau ?", "options": ["Interdit", "Obligatoire", "Attention", "Information"], "correct": 0},
       {"id": "ce2", "question": "L''imparfait exprime...", "options": ["Une action brève", "Une habitude passée", "Le futur", "Un souhait"], "correct": 1}
     ],
     "CO": [
       {"id": "co1", "question": "Où se passe la scène ?", "audio_url": "/audio/test.mp3", "options": ["A la gare", "Au bureau", "A l''école", "A l''hôpital"], "correct": 0}
     ],
     "EE": [
       {"id": "ee1", "prompt": "Sujet Section A : Écrivez un message pour informer vos collègues d''un changement d''horaire (40 mots min)."}
     ],
     "EO": [
       {"id": "eo1", "prompt": "Sujet Section B : Vous appelez un ami pour l''inviter à un événement. Posez-lui 5 questions."}
     ]
   }
 }');
