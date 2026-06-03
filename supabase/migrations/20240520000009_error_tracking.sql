-- Ajout de tables pour le suivi détaillé des erreurs et le vocabulaire mémoriel (Memrise-like)

-- 1. Table pour traquer les erreurs spécifiques (pour le moteur de recommandation)
CREATE TABLE user_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- ex: 'conjugaison', 'accord-participe-passe'
    sub_category TEXT, -- ex: 'être', 'avoir'
    frequency INTEGER DEFAULT 1,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, sub_category)
);

-- 2. Table pour le SRS spécifique au vocabulaire (Memrise-like)
CREATE TABLE user_vocabulary_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vocab_id UUID REFERENCES vocabulary(id) ON DELETE CASCADE,
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    interval_days INTEGER DEFAULT 1,
    ease_factor FLOAT DEFAULT 2.5,
    consecutive_correct INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, vocab_id)
);

-- 3. Ajout de colonnes pour la monétisation par crédits (Placeholders pour le MVP)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium'));
