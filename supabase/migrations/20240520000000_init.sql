-- Schema Database pour LlamaKusi (TEF IRN AI Coach)

-- Extension pour la recherche vectorielle (RAG future)
CREATE EXTENSION IF NOT EXISTS pgvector;

-- 1. PROFILES
-- Étend la table auth.users de Supabase
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    current_level TEXT CHECK (current_level IN ('A1', 'A2', 'B1', 'B2')),
    goal_level TEXT CHECK (goal_level IN ('A2', 'B1', 'B2')),
    total_xp INTEGER DEFAULT 0,
    streak_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. LESSONS
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Markdown ou JSON (pour structure complexe)
    level TEXT CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
    category TEXT CHECK (category IN ('grammaire', 'vocabulaire', 'conjugaison', 'syntaxe', 'orthographe')),
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. EXERCISES
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('qcm', 'trous', 'reformulage', 'association', 'ecrit', 'oral')),
    level TEXT CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
    instructions TEXT NOT NULL,
    content JSONB NOT NULL, -- { questions: [], options: [], correct_answers: [] }
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. EXERCISE ATTEMPTS
CREATE TABLE exercise_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    score FLOAT,
    is_completed BOOLEAN DEFAULT FALSE,
    answers JSONB, -- Réponses fournies par l'utilisateur
    feedback_id UUID, -- Référence optionnelle vers ai_feedback
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AI FEEDBACK (Focus Expression Écrite)
CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES exercise_attempts(id) ON DELETE CASCADE,
    overall_score INTEGER, -- 0-100 ou score TEF
    estimated_level TEXT,
    global_comment TEXT,
    detailed_annotations JSONB, -- [ { line: 1, error: "...", correction: "...", explanation: "..." } ]
    improved_version TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RECOMMENDATIONS
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('lesson', 'exercise', 'review')),
    reference_id UUID, -- ID de la leçon ou de l'exercice recommandé
    reason TEXT, -- Ex: "Tu confonds souvent le futur et le conditionnel"
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. STREAKS / GAMIFICATION
CREATE TABLE user_streaks (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_check_in DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. EMBEDDINGS (RAG)
CREATE TABLE documents_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB,
    embedding VECTOR(1536) -- Taille standard pour OpenAI text-embedding-3-small
);

-- Fonctions & Triggers (Exemple : Mise à jour auto de updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
