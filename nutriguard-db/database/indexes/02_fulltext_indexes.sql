-- =====================================================================
-- indexes/02_fulltext_indexes.sql
-- Purpose: Full-text search over the ingredient knowledge base.
-- =====================================================================

-- Powers "search ingredients or past scans" in the global Navbar search box.
-- ingredients.search_vector is a generated/stored column (see schema/03),
-- so this GIN index makes `@@` queries against it sub-millisecond even
-- at millions of rows.
create index idx_ingredients_search_vector on public.ingredients using gin (search_vector);

-- Full-text search across product names (paired with pg_trgm index in
-- 01_btree_indexes.sql for fuzzy matching; this one is for token/phrase search)
create index idx_products_fts on public.products using gin (to_tsvector('english', name));
