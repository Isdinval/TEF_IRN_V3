-- 1. Create parcours table if it doesn't exist
CREATE TABLE IF NOT EXISTS parcours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
    category TEXT CHECK (category IN ('grammaire', 'vocabulaire', 'conjugaison', 'syntaxe', 'orthographe')),
    objective TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(level, category)
);

-- 2. Create user_parcours_progress table
CREATE TABLE IF NOT EXISTS user_parcours_progress (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    parcours_id UUID REFERENCES parcours(id) ON DELETE CASCADE,
    current_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress_percent INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, parcours_id)
);

-- 3. Add last_active_parcours_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_parcours_id UUID REFERENCES parcours(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE parcours ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_parcours_progress ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Parcours are viewable by everyone" ON parcours FOR SELECT USING (true);

CREATE POLICY "Users can view their own parcours progress"
ON user_parcours_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own parcours progress"
ON user_parcours_progress FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Seed some parcours if they don't exist
INSERT INTO parcours (level, category, objective)
VALUES
('A1', 'conjugaison', 'Maîtriser les bases de la conjugaison au présent.'),
('A1', 'vocabulaire', 'Apprendre le vocabulaire essentiel de la vie quotidienne.'),
('A2', 'grammaire', 'Approfondir les règles grammaticales fondamentales.'),
('B1', 'syntaxe', 'Savoir construire des phrases complexes et structurer un discours.')
ON CONFLICT (level, category) DO NOTHING;
