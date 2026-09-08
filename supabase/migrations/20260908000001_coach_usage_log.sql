-- M4 (plan MoSCoW Assistant LlamaKusi) : instrumentation coût/usage du coach IA.
-- On loggue les tokens bruts (pas un coût en euros/dollars) pour rester valable
-- même si la tarification OpenAI change -- le coût se recalcule a posteriori
-- avec la grille tarifaire du moment, à partir de prompt_tokens/completion_tokens.

CREATE TABLE IF NOT EXISTS coach_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    -- Nombre de tool calls déclenchés par le LLM sur cet échange (get_resources,
    -- get_next_recommendation, etc.) -- signal utile pour repérer un prompt/des
    -- tools mal calibrés qui consomment plus que nécessaire.
    tool_calls_count INTEGER NOT NULL DEFAULT 0,
    -- Nombre de steps (maxSteps: 5 côté route.ts) -- si souvent proche de 5,
    -- c'est un signal que le plafond est régulièrement atteint.
    steps_count INTEGER NOT NULL DEFAULT 1,
    model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE coach_usage_log ENABLE ROW LEVEL SECURITY;

-- Écriture : la route edge du coach insère authentifiée en tant que l'utilisateur
-- (createServerClient + cookies), donc auth.uid() = user_id au moment de l'insert.
DO $$ BEGIN
    CREATE POLICY "Users can insert their own usage logs"
        ON coach_usage_log FOR INSERT
        WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Lecture : même pattern que chat_sessions/chat_messages, même si aucune UI
-- utilisateur n'expose ces données aujourd'hui (analyse admin/SQL direct).
DO $$ BEGIN
    CREATE POLICY "Users can view their own usage logs"
        ON coach_usage_log FOR SELECT
        USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_coach_usage_log_user_id ON coach_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_usage_log_created_at ON coach_usage_log(created_at);
