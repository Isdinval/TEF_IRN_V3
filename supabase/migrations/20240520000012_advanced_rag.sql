-- Migration pour le RAG (Retrieval Augmented Generation) avancé

-- 1. Activer pgvector (déjà fait dans init mais on assure)
CREATE EXTENSION IF NOT EXISTS pgvector;

-- 2. Table pour les connaissances théoriques du TEF (Règles, Syntaxe, Conseils)
CREATE TABLE tef_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB,
    embedding VECTOR(1536), -- Pour OpenAI text-embedding-3-small
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Fonction de recherche de similitude cosinus
CREATE OR REPLACE FUNCTION match_tef_knowledge (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INTEGER
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tef_knowledge.id,
    tef_knowledge.content,
    tef_knowledge.metadata,
    1 - (tef_knowledge.embedding <=> query_embedding) AS similarity
  FROM tef_knowledge
  WHERE 1 - (tef_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 4. Ajout d'une colonne de référence dans ai_feedback
ALTER TABLE ai_feedback ADD COLUMN IF NOT EXISTS knowledge_references JSONB;
