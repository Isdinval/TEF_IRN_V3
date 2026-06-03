-- Système de Ligues pour Maitris

CREATE TABLE leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- Bronze, Argent, Or, Platine, Diamant
    min_xp INTEGER NOT NULL,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO leagues (name, min_xp, color) VALUES
('Bronze', 0, '#cd7f32'),
('Argent', 500, '#c0c0c0'),
('Or', 1500, '#ffd700'),
('Platine', 5000, '#e5e4e2'),
('Diamant', 10000, '#b9f2ff');

-- Table pour les défis hebdomadaires
CREATE TABLE weekly_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    xp_reward INTEGER DEFAULT 500,
    target_count INTEGER DEFAULT 1,
    category TEXT NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Suivi des défis par utilisateur
CREATE TABLE user_challenges (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES weekly_challenges(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, challenge_id)
);
