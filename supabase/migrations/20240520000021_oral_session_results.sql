-- Migration : persistance des sessions d'entraînement à l'oral + leur analyse IA

CREATE TABLE IF NOT EXISTS oral_session_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    scenario_id UUID REFERENCES oral_exam_scenarios(id) ON DELETE SET NULL,
    section TEXT CHECK (section IN ('A', 'B')),
    level TEXT CHECK (level IN ('A2', 'B1', 'B2')),
    ended_by TEXT NOT NULL CHECK (ended_by IN ('user', 'ai', 'timeout')) DEFAULT 'user',
    transcript JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ role: "candidat" | "coach", text: string }]
    overall_score INTEGER, -- 0-100
    estimated_level TEXT CHECK (estimated_level IN ('<A1', 'A1', 'A2', 'B1', 'B2')),
    scores JSONB NOT NULL DEFAULT '{}'::jsonb, -- scores par critère de la grille officielle
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
    general_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oral_session_results_user_id ON oral_session_results(user_id);
CREATE INDEX IF NOT EXISTS idx_oral_session_results_created_at ON oral_session_results(created_at DESC);

ALTER TABLE oral_session_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view their own oral results"
        ON oral_session_results FOR SELECT
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own oral results"
        ON oral_session_results FOR INSERT
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
