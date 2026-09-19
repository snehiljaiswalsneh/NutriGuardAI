-- =====================================================================
-- Raw SQL supplement, applied manually (or via a custom migration step)
-- immediately after the Drizzle-generated migration that creates the
-- `ingredients` table. Drizzle's schema (ingredients.schema.ts) does not
-- declare this generated column directly — see the comment at the top
-- of that file for why.
--
-- Run this once, after `npm run db:migrate` has created the base table:
--   psql "$DATABASE_URL" -f src/database/migrations/0001_ingredient_search_vector.sql
-- =====================================================================

create extension if not exists pg_trgm;

alter table public.ingredients
  add column if not exists search_vector tsvector generated always as (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(scientific_name, '') || ' ' ||
      coalesce(e_number, '') || ' ' ||
      coalesce(array_to_string(aliases, ' '), '')
    )
  ) stored;

create index if not exists idx_ingredients_search_vector on public.ingredients using gin (search_vector);
create index if not exists idx_ingredients_name_trgm on public.ingredients using gin (name gin_trgm_ops);
create index if not exists idx_ingredients_aliases_gin on public.ingredients using gin (aliases);
