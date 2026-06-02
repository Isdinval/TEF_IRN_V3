-- Table pour la répétition espacée (SRS)
CREATE TABLE user_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    interval_days INTEGER DEFAULT 1,
    ease_factor FLOAT DEFAULT 2.5,
    consecutive_correct INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
