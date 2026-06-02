-- Table Vocabulaire pour Maitris
CREATE TABLE vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    example TEXT,
    level TEXT CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
    category TEXT NOT NULL, -- ex: 'Travail', 'Santé', 'Administration'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Progression Leçons
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, lesson_id)
);
