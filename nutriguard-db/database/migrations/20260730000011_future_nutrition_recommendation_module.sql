-- =====================================================================
-- 10_future_nutrition_recommendation_module.sql
-- Purpose: Future Nutrition Dashboard (nutrient facts) and
--          Recommendation Engine (personalized suggestions).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: nutrition_facts
-- One-to-one with products. Standard nutrition-label fields, modeled
-- explicitly (rather than JSONB) since these are well-known, queryable,
-- and benefit from CHECK constraints and aggregate queries.
-- ---------------------------------------------------------------------
create table public.nutrition_facts (
  product_id        uuid primary key references public.products(id) on delete cascade,
  serving_size_g     numeric(8,2),
  calories_kcal      numeric(8,2),
  total_fat_g        numeric(8,2),
  saturated_fat_g    numeric(8,2),
  trans_fat_g        numeric(8,2),
  cholesterol_mg     numeric(8,2),
  sodium_mg          numeric(8,2),
  total_carbs_g      numeric(8,2),
  dietary_fiber_g    numeric(8,2),
  total_sugars_g     numeric(8,2),
  added_sugars_g     numeric(8,2),
  protein_g          numeric(8,2),
  extra_nutrients    jsonb not null default '{}'::jsonb,  -- vitamins/minerals not worth dedicated columns
  source             text not null default 'label_ocr' check (source in ('label_ocr', 'manual', 'external_api')),
  updated_at         timestamptz not null default now(),

  constraint nutrition_facts_non_negative check (
    coalesce(serving_size_g, 0) >= 0 and coalesce(calories_kcal, 0) >= 0 and
    coalesce(total_fat_g, 0) >= 0 and coalesce(sodium_mg, 0) >= 0
  )
);

comment on table public.nutrition_facts is 'Future: standard nutrition-label facts per product, feeding the Nutrition Dashboard.';
comment on column public.nutrition_facts.extra_nutrients is 'JSONB overflow for less-common vitamins/minerals not worth dedicated columns.';

-- ---------------------------------------------------------------------
-- Table: user_dietary_preferences
-- One-to-many: a user's dietary restrictions/goals, used to personalize
-- the Nutrition Dashboard and feed the Recommendation Engine.
-- ---------------------------------------------------------------------
create table public.user_dietary_preferences (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.user_profiles(id) on delete cascade,
  preference    text not null,                    -- e.g. 'low_sodium', 'vegan', 'diabetic_friendly'
  created_at    timestamptz not null default now(),

  constraint user_dietary_preferences_uk unique (user_id, preference)
);

comment on table public.user_dietary_preferences is 'Future: dietary restrictions/goals per user, used for personalized recommendations.';

-- ---------------------------------------------------------------------
-- Table: recommendations
-- One row per AI-generated recommendation surfaced to a user — generic
-- enough to cover "safer alternative", "similar product", or future
-- recommendation types without new tables.
-- ---------------------------------------------------------------------
create table public.recommendations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.user_profiles(id) on delete cascade,
  source_product_id uuid references public.products(id) on delete cascade,
  recommended_product_id uuid references public.products(id) on delete cascade,
  recommendation_type text not null default 'safer_alternative'
                        check (recommendation_type in ('safer_alternative', 'similar_product', 'dietary_match')),
  score              numeric(5,4),                 -- similarity/confidence score, 0.0000–1.0000
  reason             text,
  is_dismissed       boolean not null default false,
  created_at         timestamptz not null default now(),

  constraint recommendations_distinct_products check (
    recommended_product_id is distinct from source_product_id
  )
);

comment on table public.recommendations is 'Future: generic AI recommendation record (safer alternative, similar product, dietary match).';
