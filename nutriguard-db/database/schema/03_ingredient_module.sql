-- =====================================================================
-- 03_ingredient_module.sql
-- Purpose: The core "AI knowledge base" — ingredients, categories, risk
--          classification, health effects, alternatives, allergens,
--          country regulations, and research sources.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: ingredient_categories
-- Self-referencing tree (e.g. "Preservatives" -> "Nitrate/Nitrite curing agents")
-- ---------------------------------------------------------------------
create table public.ingredient_categories (
  id            uuid primary key default gen_random_uuid(),
  parent_id     uuid references public.ingredient_categories(id) on delete set null,
  name          text not null,
  slug          text not null,
  description   text,
  created_at    timestamptz not null default now(),

  constraint ingredient_categories_slug_uk unique (slug)
);

comment on table public.ingredient_categories is 'Self-referencing category tree for ingredients (e.g. Preservatives > Nitrite curing agents).';

-- ---------------------------------------------------------------------
-- Table: ingredients
-- The central knowledge-base entity. One row per known ingredient/additive.
-- ---------------------------------------------------------------------
create table public.ingredients (
  id                  uuid primary key default gen_random_uuid(),
  category_id         uuid references public.ingredient_categories(id) on delete set null,
  name                text not null,
  scientific_name     text,
  e_number            text,                        -- e.g. 'E250', nullable — not all ingredients have one
  aliases             text[] not null default '{}', -- alternate label names, used for text search matching
  description         text,
  purpose             text,                         -- why it's used in food (preservative, colorant, etc.)
  risk_level          risk_level not null default 'unknown',
  risk_summary         text,                         -- short one-line reason shown in ingredient table rows
  is_natural          boolean not null default false,
  is_synthetic        boolean not null default false,
  search_vector       tsvector generated always as (
                        to_tsvector('english',
                          coalesce(name, '') || ' ' ||
                          coalesce(scientific_name, '') || ' ' ||
                          coalesce(e_number, '') || ' ' ||
                          coalesce(array_to_string(aliases, ' '), '')
                        )
                      ) stored,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,                   -- soft delete (retain for historical scan integrity)

  constraint ingredients_name_uk unique (name),
  constraint ingredients_name_len check (char_length(name) between 1 and 200)
);

comment on table public.ingredients is 'Central AI knowledge-base entity: one row per known ingredient/additive.';
comment on column public.ingredients.aliases is 'Alternate label names (e.g. "Sodium Nitrite" vs "Nitrite Curing Salt") used to match free-text scanned input.';
comment on column public.ingredients.search_vector is 'Generated tsvector for full-text search across name/scientific name/E-number/aliases.';

-- ---------------------------------------------------------------------
-- Table: ingredient_health_effects
-- One-to-many: an ingredient can have several documented health effects.
-- ---------------------------------------------------------------------
create table public.ingredient_health_effects (
  id              uuid primary key default gen_random_uuid(),
  ingredient_id   uuid not null references public.ingredients(id) on delete cascade,
  effect          text not null,
  severity        risk_level not null default 'unknown',
  display_order   smallint not null default 0,
  created_at      timestamptz not null default now()
);

comment on table public.ingredient_health_effects is 'Documented health effects for an ingredient, ordered for display in Ingredient Detail.';

-- ---------------------------------------------------------------------
-- Table: research_sources
-- Normalized citation store — reused across ingredients (many-to-many).
-- ---------------------------------------------------------------------
create table public.research_sources (
  id            uuid primary key default gen_random_uuid(),
  label         text not null,
  url           text not null,
  publisher     text,                                -- e.g. 'WHO', 'FDA', 'EFSA'
  published_at  date,
  created_at    timestamptz not null default now(),

  constraint research_sources_url_uk unique (url)
);

comment on table public.research_sources is 'Normalized citation/source records, reused across many ingredients.';

-- ---------------------------------------------------------------------
-- Table: ingredient_research_sources
-- Junction: many-to-many between ingredients and research_sources.
-- ---------------------------------------------------------------------
create table public.ingredient_research_sources (
  ingredient_id       uuid not null references public.ingredients(id) on delete cascade,
  research_source_id  uuid not null references public.research_sources(id) on delete cascade,
  primary key (ingredient_id, research_source_id)
);

comment on table public.ingredient_research_sources is 'Junction table: many-to-many between ingredients and their cited research sources.';

-- ---------------------------------------------------------------------
-- Table: ingredient_alternatives
-- Self-referencing many-to-many: ingredient -> safer replacement ingredient.
-- A textual product-level alternative is also supported via alt_product_name
-- for cases where the "alternative" isn't itself a catalogued ingredient.
-- ---------------------------------------------------------------------
create table public.ingredient_alternatives (
  id                    uuid primary key default gen_random_uuid(),
  ingredient_id         uuid not null references public.ingredients(id) on delete cascade,
  alternative_ingredient_id uuid references public.ingredients(id) on delete set null,
  alt_product_name      text,                        -- free-text label when no catalogued ingredient exists yet
  reason                text not null,
  score_delta           smallint not null default 0, -- expected safety-score improvement, e.g. +18
  created_at            timestamptz not null default now(),

  constraint ingredient_alternatives_target_present check (
    alternative_ingredient_id is not null or alt_product_name is not null
  ),
  constraint ingredient_alternatives_not_self check (
    alternative_ingredient_id is distinct from ingredient_id
  )
);

comment on table public.ingredient_alternatives is 'Safer-alternative recommendations. Points to another catalogued ingredient or a free-text product name.';

-- ---------------------------------------------------------------------
-- Table: allergens
-- Reference list of standard allergen categories (top 14 + extensible).
-- ---------------------------------------------------------------------
create table public.allergens (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null,
  description   text,

  constraint allergens_slug_uk unique (slug)
);

comment on table public.allergens is 'Reference list of standard allergen categories (e.g. peanuts, soy, tree nuts, gluten).';

-- ---------------------------------------------------------------------
-- Table: ingredient_allergens
-- Junction: many-to-many between ingredients and allergens.
-- ---------------------------------------------------------------------
create table public.ingredient_allergens (
  ingredient_id   uuid not null references public.ingredients(id) on delete cascade,
  allergen_id     uuid not null references public.allergens(id) on delete cascade,
  severity        allergen_severity not null default 'moderate',
  note            text,                                -- e.g. "may contain traces of"
  primary key (ingredient_id, allergen_id)
);

comment on table public.ingredient_allergens is 'Junction table: many-to-many between ingredients and standard allergen categories.';

-- ---------------------------------------------------------------------
-- Table: ingredient_country_regulations
-- Junction: many-to-many between ingredients and countries, with a status.
-- ---------------------------------------------------------------------
create table public.ingredient_country_regulations (
  id              uuid primary key default gen_random_uuid(),
  ingredient_id   uuid not null references public.ingredients(id) on delete cascade,
  country_id      uuid not null references public.countries(id) on delete cascade,
  status          regulation_status not null default 'unregulated',
  regulation_note text,
  effective_date  date,
  source_id       uuid references public.research_sources(id) on delete set null,
  updated_at      timestamptz not null default now(),

  constraint ingredient_country_regulations_uk unique (ingredient_id, country_id)
);

comment on table public.ingredient_country_regulations is 'Junction table: per-country regulatory status of an ingredient (approved/restricted/banned).';
