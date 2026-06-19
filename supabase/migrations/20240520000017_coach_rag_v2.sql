-- Amélioration du RAG pour le Coach (Recherche sur tef_knowledge + documents_embeddings)

DROP FUNCTION IF EXISTS match_knowledge_for_coach;

CREATE OR REPLACE FUNCTION match_knowledge_for_coach (
  query_text TEXT,
  query_embedding VECTOR(1536) DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.25,
  match_count INTEGER DEFAULT 6
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT,
  source TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH combined_knowledge AS (
    SELECT
      tk.id, tk.content, tk.metadata, tk.embedding, 'tef_knowledge'::TEXT as source_name
    FROM tef_knowledge tk
    UNION ALL
    SELECT
      de.id, de.content, de.metadata, de.embedding, 'documents'::TEXT as source_name
    FROM documents_embeddings de
  )
  SELECT
    ck.id,
    ck.content,
    ck.metadata,
    CASE
      WHEN query_embedding IS NOT NULL AND ck.embedding IS NOT NULL
      THEN (1 - (ck.embedding <=> query_embedding))::FLOAT
      ELSE 0::FLOAT
    END AS similarity,
    ck.source_name
  FROM combined_knowledge ck
  WHERE
    (query_embedding IS NOT NULL AND ck.embedding IS NOT NULL AND 1 - (ck.embedding <=> query_embedding) > match_threshold)
    OR
    (ck.content ILIKE '%' || query_text || '%')
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Index GIN pour la recherche textuelle sur tef_knowledge
CREATE INDEX IF NOT EXISTS idx_tef_knowledge_content_gin ON tef_knowledge USING gin (to_tsvector('french', content));
CREATE INDEX IF NOT EXISTS idx_documents_embeddings_content_gin ON documents_embeddings USING gin (to_tsvector('french', content));
