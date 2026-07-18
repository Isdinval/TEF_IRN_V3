-- Migration : catalogue de sujets d'expression écrite (simulation d'examen TEF IRN)
-- Table volontairement séparée de "exercises" et du moteur SRS — voir docs/EXAM_SCENARIOS_CATALOGUE.md

CREATE TABLE IF NOT EXISTS writing_exam_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section TEXT NOT NULL CHECK (section IN ('A', 'B')),
    level TEXT NOT NULL CHECK (level IN ('A2', 'B1', 'B2')),
    type_texte TEXT NOT NULL, -- ex: 'message_informatif', 'lettre_formelle', 'texte_argumentatif', 'lettre_reclamation'
    title TEXT NOT NULL,
    sujet TEXT NOT NULL,
    min_words INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL, -- 600 (10 min) Section A / 1200 (20 min) Section B
    contraintes JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_writing_exam_scenarios_section ON writing_exam_scenarios(section);
CREATE INDEX IF NOT EXISTS idx_writing_exam_scenarios_level ON writing_exam_scenarios(level);
CREATE INDEX IF NOT EXISTS idx_writing_exam_scenarios_is_active ON writing_exam_scenarios(is_active);

ALTER TABLE writing_exam_scenarios ENABLE ROW LEVEL SECURITY;

-- Contenu de référence, même pattern que "lessons"/"exercises" (RLS policies migration) :
-- lecture ouverte au niveau table, contrôle d'accès réel fait par l'auth check
-- dans la route API (cf. src/app/api/writing/scenarios/route.ts).
DO $$ BEGIN
    CREATE POLICY "Allow read access for all users"
        ON writing_exam_scenarios FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed initial : mix Section A (10 min / 40 mots min) et Section B (20 min / 100 mots min),
-- niveaux A2/B1/B2, plusieurs types de texte, conforme au format officiel TEF IRN EE.
INSERT INTO writing_exam_scenarios (section, level, type_texte, title, sujet, min_words, duration_seconds) VALUES
-- Section A — message informatif, A2
('A', 'A2', 'message_informatif', 'Changement d''horaires',
 'Votre salle de sport change ses horaires d''ouverture le mois prochain. Écrivez un message à un(e) ami(e) pour l''informer des nouveaux horaires et lui proposer d''y aller ensemble.',
 40, 600),
('A', 'A2', 'message_informatif', 'Voisin absent',
 'Votre voisin part en vacances la semaine prochaine. Écrivez-lui un mot pour lui proposer d''arroser ses plantes et de récupérer son courrier pendant son absence.',
 40, 600),
('A', 'A2', 'message_informatif', 'Invitation à un événement',
 'Votre quartier organise une fête des voisins le mois prochain. Écrivez un message à un(e) collègue pour l''inviter et lui donner les informations pratiques (date, lieu, horaire).',
 40, 600),
-- Section A — message informatif, B1
('A', 'B1', 'lettre_formelle', 'Signalement à la mairie',
 'Un lampadaire est cassé dans votre rue depuis plusieurs semaines. Écrivez un message aux services techniques de la mairie pour signaler le problème et demander une intervention.',
 40, 600),
('A', 'B1', 'message_informatif', 'Report de rendez-vous',
 'Vous deviez rendre visite à un ami ce week-end mais un imprévu vous en empêche. Écrivez-lui un message pour vous excuser, expliquer la situation et proposer une nouvelle date.',
 40, 600),
-- Section B — texte argumentatif, B1
('B', 'B1', 'texte_argumentatif', 'Bibliothèque de quartier',
 'Votre ville envisage de fermer la bibliothèque municipale de votre quartier faute de budget. Écrivez un texte pour convaincre le conseil municipal de maintenir son ouverture, en développant vos arguments.',
 100, 1200),
('B', 'B1', 'lettre_reclamation', 'Nuisances sonores répétées',
 'Un commerce récemment ouvert près de chez vous génère beaucoup de bruit tard le soir. Écrivez une lettre au gérant pour exposer le problème et demander des mesures concrètes.',
 100, 1200),
('B', 'B1', 'texte_argumentatif', 'Covoiturage au travail',
 'Votre entreprise réfléchit à encourager le covoiturage entre salariés. Écrivez un texte pour convaincre votre direction de mettre en place ce dispositif, en expliquant les bénéfices attendus.',
 100, 1200),
-- Section B — texte argumentatif, B2
('B', 'B2', 'texte_argumentatif', 'Télétravail généralisé',
 'Votre entreprise hésite à généraliser le télétravail à trois jours par semaine pour tous les salariés. Écrivez un texte pour convaincre votre direction des bienfaits de cette organisation.',
 100, 1200),
('B', 'B2', 'lettre_formelle', 'Composteurs collectifs',
 'Votre quartier produit trop de déchets organiques. Écrivez une lettre ouverte au journal local pour proposer l''installation de composteurs collectifs et expliquer en quoi ce projet serait bénéfique.',
 100, 1200),
('B', 'B2', 'texte_argumentatif', 'Piste cyclable manquante',
 'Votre rue est dangereuse pour les cyclistes faute d''aménagement adapté. Écrivez un courrier à votre maire pour proposer la création d''une piste cyclable et argumenter en faveur de ce projet.',
 100, 1200),
('B', 'B2', 'lettre_reclamation', 'Espace vert menacé',
 'Un espace vert apprécié des habitants de votre quartier risque d''être remplacé par un parking. Écrivez une lettre aux autorités locales pour vous y opposer et proposer une alternative.',
 100, 1200);
