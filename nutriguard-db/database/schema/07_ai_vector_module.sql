-- =====================================================================
-- 07_ai_vector_module.sql
-- Purpose: pgvector-backed embeddings for semantic/similarity search
--          over the ingredient knowledge base (current) and future
--          AI recommendation engine (future-ready).
-- =====================================================================

-- Embedding dimension follows OpenAI/Voyage/Claude-family text-embedding
-- models (1536-dim is the common default; adjust to match the embedding
-- model actually deployed — stored as a constant here for clarity).

-- ---------------------------------------------------------------------
-- Table: ingredient_embeddings
-- One-to-one (current) with ingredients — one semantic embedding per
-- ingredient's combined description/health-effects text. Kept as its
-- own table (rather than a column on `ingredients`) so it can be
-- re-generated independently and so the hot ingredients table stays lean.
-- ---------------------------------------------------------------------
create table public.ingredient_embeddings (
  ingredient_id   uuid primary key references public.ingredients(id) on delete cascade,
  embedding       vector(1536) not null,
  embedding_model text not null default 'text-embedding-3-large',
  source_text     text not null,                  -- the exact text that was embedded, for reproducibility
  generated_at    timestamptz not null default now()
);

comment on table public.ingredient_embeddings is 'pgvector embeddings for semantic search over ingredient knowledge (name/description/health effects).';
comment on column public.ingredient_embeddings.source_text is 'Exact source text embedded, retained so embeddings can be audited/regenerated deterministically.';

-- ---------------------------------------------------------------------
-- Table: product_embeddings
-- One-to-one (current) with products — embedding of the full ingredient
-- list, used for "similar product" recommendations (future Recommendation
-- Engine) and duplicate-product detection.
-- ---------------------------------------------------------------------
create table public.product_embeddings (
  product_id      uuid primary key references public.products(id) on delete cascade,
  embedding       vector(1536) not null,
  embedding_model text not null default 'text-embedding-3-large',
  generated_at    timestamptz not null default now()
);

comment on table public.product_embeddings is 'pgvector embedding of a product''s full ingredient list — powers similar-product recommendations.';

-- Vector similarity indexes (ivfflat/hnsw) are defined in 07_indexes_vector.sql
-- since Supabase recommends creating them after substantial data is loaded
-- (ivfflat list counts are tuned to table size).
