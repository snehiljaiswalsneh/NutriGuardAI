-- =====================================================================
-- 05_junction_tables.sql
-- Purpose: Junction tables that depend on multiple prior modules
--          (products <-> ingredients, users <-> ingredients).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: product_ingredients
-- Junction: many-to-many between products and ingredients, preserving
-- the original label order (important for "first 3 ingredients" style UX)
-- and the raw text fragment matched for this ingredient.
-- ---------------------------------------------------------------------
create table public.product_ingredients (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  ingredient_id   uuid references public.ingredients(id) on delete set null, -- nullable: unmatched/unknown ingredient
  raw_text        text not null,                    -- exact fragment from the label, e.g. "Sodium Nitrite (E250)"
  position        smallint not null default 0,      -- order as printed on the label
  match_confidence numeric(4,3),                     -- AI matching confidence 0.000–1.000, null if exact match

  constraint product_ingredients_uk unique (product_id, position),
  constraint product_ingredients_confidence_range check (
    match_confidence is null or (match_confidence >= 0 and match_confidence <= 1)
  )
);

comment on table public.product_ingredients is 'Junction table: ordered ingredients belonging to a scanned product, with AI match confidence.';
comment on column public.product_ingredients.ingredient_id is 'Nullable: label text that could not be confidently matched to a catalogued ingredient.';

-- ---------------------------------------------------------------------
-- Table: user_saved_ingredients
-- Junction: many-to-many, a user's ingredient watchlist for ban alerts.
-- ---------------------------------------------------------------------
create table public.user_saved_ingredients (
  user_id       uuid not null references public.user_profiles(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, ingredient_id)
);

comment on table public.user_saved_ingredients is 'Junction table: ingredients a user follows for regulatory-change alerts.';
