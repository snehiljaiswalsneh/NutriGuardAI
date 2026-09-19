-- =====================================================================
-- Supplementary Migration for Vector Search (pgvector)
--
-- Sets up the `vector` extension, creates the `ingredient_embeddings`
-- table, and creates an IVFFlat index for cosine distance vector searches.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.ingredient_embeddings (
  ingredient_id UUID PRIMARY KEY REFERENCES public.ingredients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  risk_level risk_level NOT NULL DEFAULT 'unknown',
  embedding vector(3072) NOT NULL, -- size 3072 matches text-embedding-3-large and gemini-embedding-001 output dimensions
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IVFFlat index for Cosine Distance vector searches (<=> operator).
-- (Note: 100 lists is standard for small-to-medium tables).
CREATE INDEX IF NOT EXISTS idx_ingredient_embeddings_vector 
  ON public.ingredient_embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
