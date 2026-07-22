-- Module Examen Civique (CSP / CR / Naturalisation) — indépendant du TEF IRN
-- Vit hors du préfixe /tef-irn/, réutilise le pattern SRS de vocabulary / user_vocabulary_reviews.

-- 1. Table des questions de connaissance
CREATE TABLE civic_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme TEXT NOT NULL CHECK (theme IN (
        'principes_valeurs',
        'systeme_politique',
        'droits_devoirs',
        'histoire_geo_culture',
        'vivre_societe'
    )),
    mentions TEXT[] NOT NULL DEFAULT '{}', -- sous-ensemble de: 'csp', 'cr', 'naturalisation'
    question TEXT NOT NULL, -- intitulé officiel, verbatim
    options JSONB NOT NULL, -- 4 choix, ex: ["Option A", "Option B", "Option C", "Option D"]
    correct_answer TEXT NOT NULL,
    explanation TEXT, -- courte justification pédagogique
    source_ref TEXT, -- fiche thématique officielle utilisée pour la génération (traçabilité relecture)
    reviewed BOOLEAN NOT NULL DEFAULT false, -- publié seulement une fois relu manuellement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_civic_questions_theme ON civic_questions(theme);
CREATE INDEX idx_civic_questions_mentions ON civic_questions USING GIN(mentions);
CREATE INDEX idx_civic_questions_reviewed ON civic_questions(reviewed);

-- 2. Table SRS dédiée (même algo SM-2 que user_vocabulary_reviews)
CREATE TABLE user_civic_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    question_id UUID REFERENCES civic_questions(id) ON DELETE CASCADE,
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    interval_days INTEGER DEFAULT 1,
    ease_factor FLOAT DEFAULT 2.5,
    consecutive_correct INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

CREATE INDEX idx_user_civic_reviews_due ON user_civic_reviews(user_id, next_review_at);

-- 3. Table des tentatives d'examen blanc (40 questions chronométrées)
CREATE TABLE civic_exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    mention TEXT NOT NULL CHECK (mention IN ('csp', 'cr', 'naturalisation')),
    score INTEGER NOT NULL, -- nombre de bonnes réponses
    total_questions INTEGER NOT NULL DEFAULT 40,
    passed BOOLEAN NOT NULL, -- score >= 32 (80%)
    duration_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_civic_exam_attempts_user ON civic_exam_attempts(user_id, created_at DESC);

-- 4. RLS — même pattern que 20240520000007_rls_policies.sql

ALTER TABLE civic_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access for reviewed questions" ON civic_questions
    FOR SELECT USING (reviewed = true);

ALTER TABLE user_civic_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own civic reviews" ON user_civic_reviews
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own civic reviews" ON user_civic_reviews
    FOR ALL USING (auth.uid() = user_id);

ALTER TABLE civic_exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own civic exam attempts" ON civic_exam_attempts
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own civic exam attempts" ON civic_exam_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);
