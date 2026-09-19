-- =====================================================================
-- indexes/03_vector_indexes.sql
-- Purpose: pgvector similarity-search indexes.
--
-- IMPORTANT (Supabase best practice): ivfflat indexes should be created
-- AFTER a representative amount of data is loaded, because the `lists`
-- parameter should be tuned to table size (rule of thumb: lists =
-- rows / 1000, minimum 100). Creating the index too early on an empty
-- table degrades recall. For a fresh project, run ANALYZE and re-create
-- these indexes once you have real ingredient volume (10k+ rows).
--
-- HNSW (available in pgvector >= 0.5) is preferred over ivfflat for
-- read-heavy, infrequently-rebuilt workloads like ours — better recall
-- at similar query latency, at the cost of slower index builds. We use
-- HNSW here since Supabase's managed Postgres ships pgvector >= 0.5.
-- =====================================================================

-- Ingredient semantic search (e.g. "what should I avoid if I have a
-- sulfite sensitivity" -> nearest-neighbor match against embeddings)
create index idx_ingredient_embeddings_hnsw
  on public.ingredient_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Product-to-product similarity, powers the future Recommendation Engine
create index idx_product_embeddings_hnsw
  on public.product_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Example similarity query pattern (application code reference):
--
--   select ingredient_id, 1 - (embedding <=> $1) as similarity
--   from public.ingredient_embeddings
--   order by embedding <=> $1
--   limit 10;
--
-- `<=>` is the cosine-distance operator registered by pgvector;
-- vector_cosine_ops must match the operator class used at index-creation.
