-- =====================================================================
-- 00_extensions.sql
-- Purpose: Enable required PostgreSQL/Supabase extensions and define
--          shared ENUM types used across every module.
-- =====================================================================

-- UUID generation (Supabase enables this by default, kept explicit for portability)
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Trigram search — powers fast ILIKE / fuzzy search on ingredient & product names
create extension if not exists "pg_trgm";

-- Vector similarity search — powers semantic/AI search over ingredient knowledge
create extension if not exists "vector";

-- ---------------------------------------------------------------------
-- Shared ENUM types
-- ---------------------------------------------------------------------

-- Risk classification used by ingredients, scans, and safety scores
create type risk_level as enum ('safe', 'moderate', 'high', 'unknown');

-- Regulatory status per ingredient, per country
create type regulation_status as enum ('approved', 'restricted', 'banned', 'unregulated');

-- Application-level user roles (kept separate from Supabase auth roles)
create type app_role as enum ('user', 'moderator', 'admin', 'super_admin');

-- Allergen severity, independent of ingredient risk level
create type allergen_severity as enum ('mild', 'moderate', 'severe');

-- Generic lifecycle status reused by scans / jobs / async processes
create type job_status as enum ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Notification classification
create type notification_type as enum ('scan_complete', 'weekly_digest', 'new_ban_alert', 'system', 'marketing');

-- Comparison verdict
create type comparison_winner as enum ('product_a', 'product_b', 'tie');

comment on type risk_level is 'Standard risk classification applied to ingredients, scans, and derived safety scores.';
comment on type regulation_status is 'Regulatory standing of an ingredient within a specific country.';
comment on type app_role is 'Application-level authorization role, distinct from Supabase auth.users metadata.';
-- =====================================================================
-- 01_auth_module.sql
-- Purpose: User profiles, settings, and role assignment.
-- Note: Supabase already provides `auth.users` (managed by Supabase Auth).
--       We never duplicate credentials — `public.user_profiles` extends
--       `auth.users` 1:1 via a shared primary key.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: user_profiles
-- One-to-one extension of auth.users with app-specific profile data.
-- ---------------------------------------------------------------------
create table public.user_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  avatar_url      text,
  role            app_role not null default 'user',
  date_of_birth   date,
  country_code    char(2),                       -- ISO 3166-1 alpha-2, used to default regulation lookups
  is_active       boolean not null default true,
  deleted_at      timestamptz,                   -- soft delete
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint user_profiles_full_name_len check (char_length(full_name) <= 120)
);

comment on table public.user_profiles is 'One-to-one profile extension of auth.users. Never stores credentials.';
comment on column public.user_profiles.country_code is 'ISO 3166-1 alpha-2 code, used to default country-regulation lookups.';

-- ---------------------------------------------------------------------
-- Table: user_settings
-- One-to-one. Notification/appearance/privacy preferences.
-- ---------------------------------------------------------------------
create table public.user_settings (
  user_id                 uuid primary key references public.user_profiles(id) on delete cascade,
  theme                   text not null default 'light' check (theme in ('light', 'dark', 'system')),
  language_code           char(5) not null default 'en',      -- e.g. 'en', 'hi-IN'
  notify_scan_complete    boolean not null default true,
  notify_weekly_digest    boolean not null default false,
  notify_new_ban_alert    boolean not null default true,
  marketing_opt_in        boolean not null default false,
  data_sharing_opt_in     boolean not null default false,
  updated_at              timestamptz not null default now()
);

comment on table public.user_settings is 'Per-user preferences: appearance, language, notifications, privacy.';

-- Note: `user_saved_ingredients` (many-to-many, user <-> ingredient watchlist)
-- is defined in 05_junction_tables.sql since it depends on the ingredients
-- module being created first.
-- =====================================================================
-- 02_country_module.sql
-- Purpose: Reference data for countries, used by regulation lookups.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: countries
-- Reference table — small, mostly static (~195 rows). No partitioning needed.
-- ---------------------------------------------------------------------
create table public.countries (
  id            uuid primary key default gen_random_uuid(),
  iso_code      char(2) not null,                 -- ISO 3166-1 alpha-2 ('US', 'IN', 'DE')
  iso_code_3    char(3),                           -- ISO 3166-1 alpha-3 ('USA', 'IND')
  name          text not null,
  flag_emoji    text,
  region        text,                              -- e.g. 'Europe', 'South Asia'
  created_at    timestamptz not null default now(),

  constraint countries_iso_code_uk unique (iso_code),
  constraint countries_iso_code_format check (iso_code ~ '^[A-Z]{2}$')
);

comment on table public.countries is 'Static reference list of countries used for regulation lookups (~195 rows, cached client-side).';
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
-- =====================================================================
-- 04_product_module.sql
-- Purpose: Catalogued products (as scanned/entered by users) and brands.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: brands
-- Reference/lookup table, deduplicated brand names.
-- ---------------------------------------------------------------------
create table public.brands (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  logo_url      text,
  website       text,
  created_at    timestamptz not null default now(),

  constraint brands_name_uk unique (name)
);

comment on table public.brands is 'Deduplicated brand/manufacturer reference table.';

-- ---------------------------------------------------------------------
-- Table: products
-- A distinct product a user has scanned. Deduplicated by barcode when
-- available so repeated scans of the same product reuse the same row.
-- ---------------------------------------------------------------------
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  brand_id          uuid references public.brands(id) on delete set null,
  name              text not null,
  barcode           text,                              -- UPC/EAN, nullable until Barcode Scanner feature ships
  image_url         text,
  raw_ingredient_text text,                             -- original pasted/OCR'd text, preserved verbatim
  created_by        uuid references public.user_profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint products_name_len check (char_length(name) between 1 and 300)
);

comment on table public.products is 'Distinct scanned/catalogued product. Deduplicated by barcode where available.';
comment on column public.products.raw_ingredient_text is 'Verbatim original ingredient text as pasted or OCR-extracted, preserved for audit/reprocessing.';

-- Partial unique index: only enforce barcode uniqueness when a barcode is present
-- (see 06_indexes.sql for the full indexing rationale)
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
-- =====================================================================
-- 06_history_module.sql
-- Purpose: Scan history, derived safety scores, AI summaries, and
--          product comparison history.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: scans
-- One row per AI analysis run by a user against a product.
-- This is the "Scan History" entity shown in the History screen.
-- ---------------------------------------------------------------------
create table public.scans (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.user_profiles(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete restrict,
  status          job_status not null default 'completed',
  ai_model_version text not null default 'ai-analyzer-v1',  -- which AI/prompt version produced this scan
  input_source    text not null default 'paste' check (input_source in ('paste', 'manual', 'ocr', 'barcode', 'voice')),
  scanned_at      timestamptz not null default now(),
  error_message   text,                                        -- populated only when status = 'failed'

  constraint scans_error_only_when_failed check (
    (status = 'failed' and error_message is not null) or
    (status <> 'failed')
  )
);

comment on table public.scans is 'One row per AI ingredient-analysis run. The core "Scan History" entity.';
comment on column public.scans.ai_model_version is 'Identifies which AI model/prompt version produced this analysis, for reproducibility and audit.';

-- ---------------------------------------------------------------------
-- Table: safety_scores
-- One-to-one with scans. Kept as its own table (rather than columns on
-- `scans`) so scoring logic/versioning can evolve independently and so
-- historical re-scoring (e.g. after a regulation change) is auditable.
-- ---------------------------------------------------------------------
create table public.safety_scores (
  scan_id           uuid primary key references public.scans(id) on delete cascade,
  score             smallint not null,
  verdict           risk_level not null,
  ingredient_count  smallint not null default 0,
  flagged_count     smallint not null default 0,      -- moderate + high risk ingredient count
  scoring_version   text not null default 'v1',
  computed_at       timestamptz not null default now(),

  constraint safety_scores_score_range check (score between 0 and 100)
);

comment on table public.safety_scores is 'Derived, versioned safety score for a scan — separated from scans for independent scoring-algorithm evolution.';

-- ---------------------------------------------------------------------
-- Table: ai_summaries
-- One-to-one with scans. The AI-generated natural-language health summary.
-- ---------------------------------------------------------------------
create table public.ai_summaries (
  scan_id         uuid primary key references public.scans(id) on delete cascade,
  summary_text    text not null,
  allergy_warning text,
  model_name      text not null default 'claude-sonnet-5',
  prompt_version  text not null default 'v1',
  token_count     integer,
  generated_at    timestamptz not null default now()
);

comment on table public.ai_summaries is 'AI-generated natural-language health summary and allergy warning for a scan.';

-- ---------------------------------------------------------------------
-- Table: comparisons
-- One row per product-comparison run between two scans.
-- ---------------------------------------------------------------------
create table public.comparisons (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.user_profiles(id) on delete cascade,
  scan_a_id         uuid not null references public.scans(id) on delete cascade,
  scan_b_id         uuid not null references public.scans(id) on delete cascade,
  winner             comparison_winner not null,
  recommendation_text text not null,
  compared_at        timestamptz not null default now(),

  constraint comparisons_distinct_scans check (scan_a_id <> scan_b_id)
);

comment on table public.comparisons is 'One row per product-comparison run, storing the two scans compared and the AI recommendation.';
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
-- =====================================================================
-- 08_notification_audit_module.sql
-- Purpose: In-app notifications and a system-wide audit trail.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: notifications
-- One row per notification delivered (or queued) to a user.
-- ---------------------------------------------------------------------
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.user_profiles(id) on delete cascade,
  type          notification_type not null,
  title         text not null,
  body          text,
  link_url      text,                                -- deep link, e.g. /app/dashboard/:scanId
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.notifications is 'In-app notification feed. Read/unread state tracked per user.';

-- ---------------------------------------------------------------------
-- Table: audit_logs
-- Append-only system-wide audit trail. Immutable by convention
-- (no UPDATE/DELETE grants — enforced via RLS/policies, see policies/).
-- Uses a generic actor/action/entity model so it covers every module,
-- current and future, without schema changes.
-- ---------------------------------------------------------------------
create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  actor_id        uuid references public.user_profiles(id) on delete set null,  -- null = system/service actor
  action          text not null,                    -- e.g. 'scan.created', 'user.deleted', 'ingredient.updated'
  entity_type     text not null,                    -- e.g. 'scan', 'ingredient', 'user_profile'
  entity_id       uuid,
  metadata        jsonb not null default '{}'::jsonb, -- flexible before/after diff or context payload
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);

comment on table public.audit_logs is 'Append-only, generic audit trail covering every module via actor/action/entity/metadata.';
comment on column public.audit_logs.metadata is 'Flexible JSONB payload — typically a before/after diff or request context.';
-- =====================================================================
-- 09_future_capture_module.sql
-- Purpose: Future input-capture features — OCR Scanner, Barcode Scanner,
--          Voice Assistant. Designed now so `scans.input_source` values
--          ('ocr', 'barcode', 'voice') have a home once each ships.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: ocr_captures
-- One-to-one with a scan created via the OCR Scanner. Stores the raw
-- image reference and extracted text separately from the cleaned
-- `products.raw_ingredient_text` so OCR quality can be audited/improved.
-- ---------------------------------------------------------------------
create table public.ocr_captures (
  scan_id           uuid primary key references public.scans(id) on delete cascade,
  image_storage_path text not null,               -- Supabase Storage object path
  extracted_text     text not null,
  ocr_confidence     numeric(4,3),
  ocr_engine         text not null default 'tesseract-v5',
  processed_at       timestamptz not null default now(),

  constraint ocr_captures_confidence_range check (
    ocr_confidence is null or (ocr_confidence >= 0 and ocr_confidence <= 1)
  )
);

comment on table public.ocr_captures is 'Future: raw image + extracted text for scans captured via the OCR Scanner.';

-- ---------------------------------------------------------------------
-- Table: barcode_lookups
-- One-to-one with a scan created via the Barcode Scanner. Caches the
-- external barcode-database response so repeat scans of the same
-- barcode don't re-hit the third-party API.
-- ---------------------------------------------------------------------
create table public.barcode_lookups (
  scan_id             uuid primary key references public.scans(id) on delete cascade,
  barcode             text not null,
  external_provider   text not null default 'openfoodfacts',
  external_payload    jsonb not null default '{}'::jsonb,
  looked_up_at        timestamptz not null default now()
);

comment on table public.barcode_lookups is 'Future: cached third-party barcode-database response for scans created via the Barcode Scanner.';

-- ---------------------------------------------------------------------
-- Table: voice_queries
-- Log of natural-language voice questions asked about an ingredient or
-- scan (not necessarily tied 1:1 to a scan — a user may ask follow-up
-- questions about any past result).
-- ---------------------------------------------------------------------
create table public.voice_queries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.user_profiles(id) on delete cascade,
  scan_id       uuid references public.scans(id) on delete set null,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  transcript    text not null,
  ai_response   text,
  audio_storage_path text,                        -- optional, if audio is retained
  asked_at      timestamptz not null default now()
);

comment on table public.voice_queries is 'Future: log of natural-language voice questions and AI responses, optionally linked to a scan or ingredient.';
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
-- =====================================================================
-- 11_future_admin_analytics_translation_module.sql
-- Purpose: Future Multi-language Support, Admin Dashboard, and Analytics.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: languages
-- Reference table of supported UI/content languages.
-- ---------------------------------------------------------------------
create table public.languages (
  code          char(5) primary key,             -- BCP-47, e.g. 'en', 'hi-IN', 'es'
  name          text not null,
  is_active     boolean not null default false   -- flips to true as each language ships
);

comment on table public.languages is 'Future: reference table of supported UI languages (BCP-47 codes).';

-- ---------------------------------------------------------------------
-- Table: ingredient_translations
-- One-to-many: translated copy for an ingredient, per language.
-- Kept as a satellite table (rather than columns on `ingredients`) so
-- adding a language never requires a schema migration.
-- ---------------------------------------------------------------------
create table public.ingredient_translations (
  id              uuid primary key default gen_random_uuid(),
  ingredient_id   uuid not null references public.ingredients(id) on delete cascade,
  language_code   char(5) not null references public.languages(code) on delete cascade,
  name            text not null,
  description     text,
  purpose         text,
  risk_summary    text,
  translated_at   timestamptz not null default now(),

  constraint ingredient_translations_uk unique (ingredient_id, language_code)
);

comment on table public.ingredient_translations is 'Future: per-language translated copy for an ingredient, enabling Multi-language Support without touching the base table.';

-- ---------------------------------------------------------------------
-- Table: ui_translations
-- Generic key/value translation store for static UI copy (buttons,
-- labels, error messages) as opposed to ingredient content above.
-- ---------------------------------------------------------------------
create table public.ui_translations (
  translation_key text not null,
  language_code   char(5) not null references public.languages(code) on delete cascade,
  value           text not null,
  primary key (translation_key, language_code)
);

comment on table public.ui_translations is 'Future: generic key/value store for static UI copy across supported languages.';

-- ---------------------------------------------------------------------
-- Table: admin_roles
-- Explicit admin/moderator role grants, separate from app_role on
-- user_profiles so admin elevation is independently auditable and
-- revocable without touching the primary profile row.
-- ---------------------------------------------------------------------
create table public.admin_roles (
  user_id       uuid primary key references public.user_profiles(id) on delete cascade,
  granted_role  app_role not null check (granted_role in ('moderator', 'admin', 'super_admin')),
  granted_by    uuid references public.user_profiles(id) on delete set null,
  granted_at    timestamptz not null default now(),
  revoked_at    timestamptz
);

comment on table public.admin_roles is 'Future: explicit, auditable admin/moderator role grants for the Admin Dashboard.';

-- ---------------------------------------------------------------------
-- Table: analytics_events
-- Future: generic product-analytics event stream (page views, feature
-- usage, funnel tracking). High write volume — designed for monthly
-- range partitioning (see docs/performance.md).
-- ---------------------------------------------------------------------
create table public.analytics_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.user_profiles(id) on delete set null,
  event_name    text not null,                     -- e.g. 'scan_started', 'comparison_viewed'
  properties    jsonb not null default '{}'::jsonb,
  occurred_at   timestamptz not null default now()
) partition by range (occurred_at);

comment on table public.analytics_events is 'Future: high-volume product-analytics event stream, range-partitioned by month.';

-- Example monthly partitions (create programmatically via a scheduled
-- function in production — see functions/create_monthly_partition.sql)
create table public.analytics_events_2026_07 partition of public.analytics_events
  for values from ('2026-07-01') to ('2026-08-01');
create table public.analytics_events_2026_08 partition of public.analytics_events
  for values from ('2026-08-01') to ('2026-09-01');

-- ---------------------------------------------------------------------
-- Table: admin_dashboard_metrics_cache
-- Future: precomputed snapshot metrics (daily active users, scans/day,
-- top flagged ingredients) so the Admin Dashboard never runs expensive
-- aggregate queries live. Refreshed by a scheduled function.
-- ---------------------------------------------------------------------
create table public.admin_dashboard_metrics_cache (
  metric_key    text not null,
  metric_date   date not null,
  metric_value  jsonb not null,
  computed_at   timestamptz not null default now(),
  primary key (metric_key, metric_date)
);

comment on table public.admin_dashboard_metrics_cache is 'Future: precomputed daily metrics snapshot for the Admin Dashboard, avoiding live aggregate queries.';
-- =====================================================================
-- indexes/01_btree_indexes.sql
-- Purpose: Foreign-key and lookup indexes not already implied by
--          PRIMARY KEY / UNIQUE constraints. Postgres does NOT
--          automatically index foreign key columns — every FK used in
--          a join or lookup gets an explicit index here.
-- =====================================================================

-- user_profiles
create index idx_user_profiles_role on public.user_profiles (role) where deleted_at is null;
create index idx_user_profiles_country_code on public.user_profiles (country_code);

-- ingredients
create index idx_ingredients_category_id on public.ingredients (category_id);
create index idx_ingredients_risk_level on public.ingredients (risk_level) where deleted_at is null;
create index idx_ingredients_e_number on public.ingredients (e_number) where e_number is not null;
-- Trigram index powers fast fuzzy/ILIKE search on ingredient name (autocomplete, typo tolerance)
create index idx_ingredients_name_trgm on public.ingredients using gin (name gin_trgm_ops);
-- GIN index on the array column — powers "does this alias match" lookups
create index idx_ingredients_aliases_gin on public.ingredients using gin (aliases);

-- ingredient_categories
create index idx_ingredient_categories_parent_id on public.ingredient_categories (parent_id);

-- ingredient_health_effects
create index idx_ingredient_health_effects_ingredient_id on public.ingredient_health_effects (ingredient_id);

-- ingredient_alternatives
create index idx_ingredient_alternatives_ingredient_id on public.ingredient_alternatives (ingredient_id);
create index idx_ingredient_alternatives_alt_ingredient_id on public.ingredient_alternatives (alternative_ingredient_id);

-- ingredient_allergens
create index idx_ingredient_allergens_allergen_id on public.ingredient_allergens (allergen_id);

-- ingredient_country_regulations
create index idx_icr_country_id on public.ingredient_country_regulations (country_id);
create index idx_icr_status on public.ingredient_country_regulations (status);

-- ingredient_research_sources
create index idx_irs_source_id on public.ingredient_research_sources (research_source_id);

-- brands
create index idx_brands_name_trgm on public.brands using gin (name gin_trgm_ops);

-- products
create index idx_products_brand_id on public.products (brand_id);
create index idx_products_created_by on public.products (created_by);
create index idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
-- Partial unique index: only enforce barcode uniqueness when present (nullable field)
create unique index idx_products_barcode_uk on public.products (barcode) where barcode is not null;

-- product_ingredients
create index idx_product_ingredients_product_id on public.product_ingredients (product_id);
create index idx_product_ingredients_ingredient_id on public.product_ingredients (ingredient_id);

-- user_saved_ingredients
create index idx_user_saved_ingredients_ingredient_id on public.user_saved_ingredients (ingredient_id);

-- scans — the single most frequently queried table (History screen, Dashboard)
create index idx_scans_user_id_scanned_at on public.scans (user_id, scanned_at desc);
create index idx_scans_product_id on public.scans (product_id);
create index idx_scans_status on public.scans (status) where status <> 'completed';

-- safety_scores
create index idx_safety_scores_verdict on public.safety_scores (verdict);

-- comparisons
create index idx_comparisons_user_id_compared_at on public.comparisons (user_id, compared_at desc);
create index idx_comparisons_scan_a_id on public.comparisons (scan_a_id);
create index idx_comparisons_scan_b_id on public.comparisons (scan_b_id);

-- notifications
create index idx_notifications_user_id_unread on public.notifications (user_id, created_at desc) where is_read = false;

-- audit_logs — append-only, queried by actor and by entity
create index idx_audit_logs_actor_id on public.audit_logs (actor_id);
create index idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index idx_audit_logs_created_at on public.audit_logs (created_at desc);
-- GIN index for querying/filtering inside the metadata JSONB payload
create index idx_audit_logs_metadata_gin on public.audit_logs using gin (metadata);

-- Future modules
create index idx_ocr_captures_scan_id on public.ocr_captures (scan_id);
create index idx_barcode_lookups_barcode on public.barcode_lookups (barcode);
create index idx_voice_queries_user_id on public.voice_queries (user_id, asked_at desc);
create index idx_recommendations_user_id on public.recommendations (user_id) where is_dismissed = false;
create index idx_ingredient_translations_lang on public.ingredient_translations (language_code);
create index idx_analytics_events_user_id on public.analytics_events (user_id, occurred_at desc);
create index idx_analytics_events_event_name on public.analytics_events (event_name, occurred_at desc);
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
-- =====================================================================
-- functions/01_business_logic.sql
-- Purpose: Reusable server-side business logic, callable from the
--          application via Supabase RPC (supabase.rpc('function_name')).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Function: calculate_safety_score
-- Computes a 0-100 safety score from a scan's ingredient risk levels.
-- Kept in the database (rather than app code only) so scoring stays
-- consistent regardless of which client/service calls it.
-- ---------------------------------------------------------------------
create or replace function public.calculate_safety_score(p_scan_id uuid)
returns table (score smallint, verdict risk_level, ingredient_count smallint, flagged_count smallint)
language plpgsql
stable
as $$
declare
  v_total smallint;
  v_high smallint;
  v_moderate smallint;
  v_score smallint;
  v_verdict risk_level;
begin
  select count(*),
         count(*) filter (where i.risk_level = 'high'),
         count(*) filter (where i.risk_level = 'moderate')
  into v_total, v_high, v_moderate
  from public.product_ingredients pi
  join public.scans s on s.product_id = pi.product_id
  join public.ingredients i on i.id = pi.ingredient_id
  where s.id = p_scan_id;

  if v_total = 0 then
    return query select 0::smallint, 'unknown'::risk_level, 0::smallint, 0::smallint;
    return;
  end if;

  -- Weighted deduction: high-risk ingredients cost more than moderate ones
  v_score := greatest(0, 100 - (v_high * 15) - (v_moderate * 6));

  v_verdict := case
    when v_score >= 80 then 'safe'
    when v_score >= 55 then 'moderate'
    else 'high'
  end;

  return query select v_score, v_verdict, v_total, (v_high + v_moderate)::smallint;
end;
$$;

comment on function public.calculate_safety_score(uuid) is 'Computes a 0-100 safety score + verdict for a scan from its ingredients'' risk levels. Weighted: high risk -15, moderate -6.';

-- ---------------------------------------------------------------------
-- Function: search_ingredients_semantic
-- Nearest-neighbor semantic search over ingredient_embeddings.
-- ---------------------------------------------------------------------
create or replace function public.search_ingredients_semantic(
  p_query_embedding vector(1536),
  p_match_count integer default 10
)
returns table (ingredient_id uuid, name text, similarity numeric)
language sql
stable
as $$
  select
    i.id,
    i.name,
    (1 - (e.embedding <=> p_query_embedding))::numeric(6,4) as similarity
  from public.ingredient_embeddings e
  join public.ingredients i on i.id = e.ingredient_id
  where i.deleted_at is null
  order by e.embedding <=> p_query_embedding
  limit p_match_count;
$$;

comment on function public.search_ingredients_semantic(vector, integer) is 'Semantic nearest-neighbor search over ingredient embeddings using cosine distance.';

-- ---------------------------------------------------------------------
-- Function: get_user_scan_stats
-- Aggregate stats for a user's Profile/Quick-stats screens.
-- ---------------------------------------------------------------------
create or replace function public.get_user_scan_stats(p_user_id uuid)
returns table (total_scans bigint, avg_safety_score numeric, last_scan_at timestamptz)
language sql
stable
as $$
  select
    count(*),
    round(avg(ss.score), 1),
    max(s.scanned_at)
  from public.scans s
  left join public.safety_scores ss on ss.scan_id = s.id
  where s.user_id = p_user_id;
$$;

comment on function public.get_user_scan_stats(uuid) is 'Aggregate scan statistics for a user, used by Profile/Home quick-stats widgets.';


-- =====================================================================
-- functions/02_partition_maintenance.sql
-- Purpose: Scheduled maintenance function to pre-create the next
--          month's analytics_events partition (call monthly via
--          pg_cron or a Supabase scheduled Edge Function).
-- =====================================================================

create or replace function public.create_next_analytics_partition()
returns void
language plpgsql
as $$
declare
  v_start date := date_trunc('month', now() + interval '1 month');
  v_end   date := v_start + interval '1 month';
  v_name  text := 'analytics_events_' || to_char(v_start, 'YYYY_MM');
begin
  execute format(
    'create table if not exists public.%I partition of public.analytics_events for values from (%L) to (%L)',
    v_name, v_start, v_end
  );
end;
$$;

comment on function public.create_next_analytics_partition() is 'Pre-creates next month''s analytics_events partition. Schedule via pg_cron: monthly on the 25th.';
-- =====================================================================
-- triggers/01_updated_at_triggers.sql
-- Purpose: Automatically maintain `updated_at` on every table that has
--          the column, instead of relying on application code.
-- =====================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'Generic trigger function: stamps updated_at = now() on every UPDATE.';

-- Bind to every table that has an `updated_at` column
create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

create trigger trg_ingredients_updated_at
  before update on public.ingredients
  for each row execute function public.set_updated_at();

create trigger trg_ingredient_country_regulations_updated_at
  before update on public.ingredient_country_regulations
  for each row execute function public.set_updated_at();

create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger trg_nutrition_facts_updated_at
  before update on public.nutrition_facts
  for each row execute function public.set_updated_at();


-- =====================================================================
-- triggers/02_audit_triggers.sql
-- Purpose: Automatically write to audit_logs on sensitive mutations,
--          instead of relying on every application code path to remember.
-- =====================================================================

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text := lower(tg_op) || '.' || tg_table_name;
  v_entity_id uuid;
begin
  v_entity_id := case
    when tg_op = 'DELETE' then old.id
    else new.id
  end;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    v_action,
    tg_table_name,
    v_entity_id,
    jsonb_build_object(
      'old', case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
      'new', case when tg_op in ('UPDATE', 'INSERT') then to_jsonb(new) else null end
    )
  );

  return coalesce(new, old);
end;
$$;

comment on function public.write_audit_log() is 'Generic trigger function: writes an audit_logs row on INSERT/UPDATE/DELETE with a before/after JSONB diff.';

-- Bind to sensitive tables only (avoid instrumenting every table —
-- high-write tables like scans/notifications are intentionally excluded
-- to keep write amplification low; add selectively as compliance needs grow)
create trigger trg_audit_user_profiles
  after insert or update or delete on public.user_profiles
  for each row execute function public.write_audit_log();

create trigger trg_audit_ingredients
  after insert or update or delete on public.ingredients
  for each row execute function public.write_audit_log();

create trigger trg_audit_admin_roles
  after insert or update or delete on public.admin_roles
  for each row execute function public.write_audit_log();
-- =====================================================================
-- views/01_views.sql
-- Purpose: Convenience views for common read patterns, and a
--          materialized view for expensive dashboard aggregates.
-- =====================================================================

-- ---------------------------------------------------------------------
-- View: scan_dashboard_view
-- Denormalized single-query source for the Analysis Dashboard screen —
-- avoids the client issuing 4-5 separate queries per page load.
-- ---------------------------------------------------------------------
create or replace view public.scan_dashboard_view as
select
  s.id as scan_id,
  s.user_id,
  s.scanned_at,
  p.id as product_id,
  p.name as product_name,
  b.name as brand_name,
  ss.score as safety_score,
  ss.verdict,
  ss.ingredient_count,
  ss.flagged_count,
  ai.summary_text as ai_summary,
  ai.allergy_warning
from public.scans s
join public.products p on p.id = s.product_id
left join public.brands b on b.id = p.brand_id
left join public.safety_scores ss on ss.scan_id = s.id
left join public.ai_summaries ai on ai.scan_id = s.id
where s.status = 'completed';

comment on view public.scan_dashboard_view is 'Denormalized read model for the Analysis Dashboard screen — one query instead of five.';

-- ---------------------------------------------------------------------
-- View: ingredient_full_detail_view
-- Denormalized single-query source for the Ingredient Detail screen.
-- ---------------------------------------------------------------------
create or replace view public.ingredient_full_detail_view as
select
  i.id as ingredient_id,
  i.name,
  i.scientific_name,
  i.e_number,
  i.risk_level,
  i.description,
  i.purpose,
  coalesce(
    jsonb_agg(distinct jsonb_build_object('country', c.name, 'flag', c.flag_emoji, 'status', icr.status))
      filter (where c.id is not null),
    '[]'
  ) as country_regulations,
  coalesce(
    jsonb_agg(distinct jsonb_build_object('effect', ihe.effect, 'severity', ihe.severity))
      filter (where ihe.id is not null),
    '[]'
  ) as health_effects
from public.ingredients i
left join public.ingredient_country_regulations icr on icr.ingredient_id = i.id
left join public.countries c on c.id = icr.country_id
left join public.ingredient_health_effects ihe on ihe.ingredient_id = i.id
where i.deleted_at is null
group by i.id;

comment on view public.ingredient_full_detail_view is 'Denormalized read model for the Ingredient Detail screen, pre-aggregating country regulations and health effects as JSON.';

-- ---------------------------------------------------------------------
-- Materialized View: admin_daily_metrics
-- Expensive platform-wide aggregates for the Admin Dashboard. Refreshed
-- on a schedule (see functions/ + pg_cron), never computed live.
-- ---------------------------------------------------------------------
create materialized view public.admin_daily_metrics as
select
  date_trunc('day', s.scanned_at) as metric_date,
  count(*) as total_scans,
  count(distinct s.user_id) as active_users,
  round(avg(ss.score), 1) as avg_safety_score,
  count(*) filter (where ss.verdict = 'high') as high_risk_scans
from public.scans s
left join public.safety_scores ss on ss.scan_id = s.id
group by date_trunc('day', s.scanned_at)
with no data;

comment on materialized view public.admin_daily_metrics is 'Refreshed daily via pg_cron: platform-wide scan volume and risk metrics for the Admin Dashboard.';

create unique index idx_admin_daily_metrics_date on public.admin_daily_metrics (metric_date);

-- Refresh pattern (run via pg_cron, nightly at 01:00 UTC):
--   refresh materialized view concurrently public.admin_daily_metrics;
-- =====================================================================
-- policies/01_rls_policies.sql
-- Purpose: Enable Row Level Security on every table and define access
--          policies. Supabase exposes the DB directly over PostgREST,
--          so RLS is the primary authorization boundary — every table
--          must default to "deny all" and explicitly opt in to access.
--
-- Convention:
--   - auth.uid() -> the currently authenticated Supabase user's UUID
--   - Reference/lookup tables (countries, ingredients, allergens, etc.)
--     are public-readable (SELECT) since they contain no personal data
--     and power the core "look up an ingredient" value proposition.
--   - Personal data tables (scans, comparisons, notifications, etc.)
--     are scoped strictly to `user_id = auth.uid()`.
--   - Writes to the knowledge base (ingredients, categories, etc.) are
--     restricted to admin/moderator roles via the is_admin() helper.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper function: is_admin
-- Centralizes the admin check so policies stay short and consistent.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_roles
    where user_id = auth.uid()
      and revoked_at is null
      and granted_role in ('admin', 'super_admin')
  );
$$;

comment on function public.is_admin() is 'Returns true if the current auth.uid() holds an active admin/super_admin grant. Used throughout RLS policies.';

-- =====================================================================
-- Auth module
-- =====================================================================
alter table public.user_profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_saved_ingredients enable row level security;

create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users manage their own settings"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own saved ingredients"
  on public.user_saved_ingredients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================================
-- Ingredient knowledge base — public read, admin-only write
-- =====================================================================
alter table public.ingredient_categories enable row level security;
alter table public.ingredients enable row level security;
alter table public.ingredient_health_effects enable row level security;
alter table public.research_sources enable row level security;
alter table public.ingredient_research_sources enable row level security;
alter table public.ingredient_alternatives enable row level security;
alter table public.allergens enable row level security;
alter table public.ingredient_allergens enable row level security;
alter table public.countries enable row level security;
alter table public.ingredient_country_regulations enable row level security;

create policy "Public can read ingredient categories" on public.ingredient_categories for select using (true);
create policy "Admins manage ingredient categories" on public.ingredient_categories for insert with check (public.is_admin());
create policy "Admins update ingredient categories" on public.ingredient_categories for update using (public.is_admin());
create policy "Admins delete ingredient categories" on public.ingredient_categories for delete using (public.is_admin());

create policy "Public can read ingredients" on public.ingredients for select using (deleted_at is null or public.is_admin());
create policy "Admins manage ingredients" on public.ingredients for insert with check (public.is_admin());
create policy "Admins update ingredients" on public.ingredients for update using (public.is_admin());
create policy "Admins delete ingredients" on public.ingredients for delete using (public.is_admin());

create policy "Public can read health effects" on public.ingredient_health_effects for select using (true);
create policy "Admins manage health effects" on public.ingredient_health_effects for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read research sources" on public.research_sources for select using (true);
create policy "Admins manage research sources" on public.research_sources for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read ingredient sources" on public.ingredient_research_sources for select using (true);
create policy "Admins manage ingredient sources" on public.ingredient_research_sources for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read alternatives" on public.ingredient_alternatives for select using (true);
create policy "Admins manage alternatives" on public.ingredient_alternatives for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read allergens" on public.allergens for select using (true);
create policy "Admins manage allergens" on public.allergens for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read ingredient allergens" on public.ingredient_allergens for select using (true);
create policy "Admins manage ingredient allergens" on public.ingredient_allergens for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read countries" on public.countries for select using (true);
create policy "Admins manage countries" on public.countries for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read country regulations" on public.ingredient_country_regulations for select using (true);
create policy "Admins manage country regulations" on public.ingredient_country_regulations for all using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Product module — public read (products are shared knowledge once
-- scanned), owner-or-admin write
-- =====================================================================
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_ingredients enable row level security;

create policy "Public can read brands" on public.brands for select using (true);
create policy "Authenticated users can add brands" on public.brands for insert with check (auth.role() = 'authenticated');
create policy "Admins manage brands" on public.brands for update using (public.is_admin());

create policy "Public can read products" on public.products for select using (true);
create policy "Authenticated users can add products" on public.products for insert with check (auth.role() = 'authenticated');
create policy "Owners or admins can update products" on public.products for update using (created_by = auth.uid() or public.is_admin());

create policy "Public can read product ingredients" on public.product_ingredients for select using (true);
create policy "Authenticated users can add product ingredients" on public.product_ingredients for insert with check (auth.role() = 'authenticated');

-- =====================================================================
-- History module — strictly owner-scoped
-- =====================================================================
alter table public.scans enable row level security;
alter table public.safety_scores enable row level security;
alter table public.ai_summaries enable row level security;
alter table public.comparisons enable row level security;

create policy "Users manage their own scans"
  on public.scans for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

create policy "Users read safety scores for their own scans"
  on public.safety_scores for select
  using (exists (select 1 from public.scans s where s.id = scan_id and (s.user_id = auth.uid() or public.is_admin())));

create policy "System can insert safety scores"
  on public.safety_scores for insert
  with check (exists (select 1 from public.scans s where s.id = scan_id and s.user_id = auth.uid()));

create policy "Users read AI summaries for their own scans"
  on public.ai_summaries for select
  using (exists (select 1 from public.scans s where s.id = scan_id and (s.user_id = auth.uid() or public.is_admin())));

create policy "System can insert AI summaries"
  on public.ai_summaries for insert
  with check (exists (select 1 from public.scans s where s.id = scan_id and s.user_id = auth.uid()));

create policy "Users manage their own comparisons"
  on public.comparisons for all
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- =====================================================================
-- AI / Vector module — public read (shared knowledge), admin-only write
-- =====================================================================
alter table public.ingredient_embeddings enable row level security;
alter table public.product_embeddings enable row level security;

create policy "Public can read ingredient embeddings" on public.ingredient_embeddings for select using (true);
create policy "Admins manage ingredient embeddings" on public.ingredient_embeddings for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read product embeddings" on public.product_embeddings for select using (true);
create policy "System manages product embeddings" on public.product_embeddings for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- =====================================================================
-- Notifications & Audit
-- =====================================================================
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users read their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users mark their own notifications read"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- audit_logs is append-only and admin-readable only; no update/delete
-- policy is defined at all, which means those operations are denied
-- outright (Postgres default-deny once RLS is enabled).
create policy "Admins read audit logs"
  on public.audit_logs for select
  using (public.is_admin());

create policy "System can insert audit logs"
  on public.audit_logs for insert
  with check (true);

-- =====================================================================
-- Future modules
-- =====================================================================
alter table public.ocr_captures enable row level security;
alter table public.barcode_lookups enable row level security;
alter table public.voice_queries enable row level security;
alter table public.nutrition_facts enable row level security;
alter table public.user_dietary_preferences enable row level security;
alter table public.recommendations enable row level security;
alter table public.languages enable row level security;
alter table public.ingredient_translations enable row level security;
alter table public.ui_translations enable row level security;
alter table public.admin_roles enable row level security;
alter table public.analytics_events enable row level security;
alter table public.admin_dashboard_metrics_cache enable row level security;

create policy "Users read OCR captures for their own scans" on public.ocr_captures for select
  using (exists (select 1 from public.scans s where s.id = scan_id and s.user_id = auth.uid()));

create policy "Users read barcode lookups for their own scans" on public.barcode_lookups for select
  using (exists (select 1 from public.scans s where s.id = scan_id and s.user_id = auth.uid()));

create policy "Users manage their own voice queries" on public.voice_queries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Public can read nutrition facts" on public.nutrition_facts for select using (true);
create policy "Authenticated users add nutrition facts" on public.nutrition_facts for insert with check (auth.role() = 'authenticated');

create policy "Users manage their own dietary preferences" on public.user_dietary_preferences for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read their own recommendations" on public.recommendations for select using (auth.uid() = user_id);
create policy "Users dismiss their own recommendations" on public.recommendations for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Public can read languages" on public.languages for select using (true);
create policy "Admins manage languages" on public.languages for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read ingredient translations" on public.ingredient_translations for select using (true);
create policy "Admins manage ingredient translations" on public.ingredient_translations for all using (public.is_admin()) with check (public.is_admin());

create policy "Public can read ui translations" on public.ui_translations for select using (true);
create policy "Admins manage ui translations" on public.ui_translations for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins read admin_roles" on public.admin_roles for select using (public.is_admin());
create policy "Super admins manage admin_roles" on public.admin_roles for all
  using (exists (select 1 from public.admin_roles r where r.user_id = auth.uid() and r.granted_role = 'super_admin' and r.revoked_at is null));

create policy "System inserts analytics events" on public.analytics_events for insert with check (true);
create policy "Admins read analytics events" on public.analytics_events for select using (public.is_admin());

create policy "Admins read dashboard metrics cache" on public.admin_dashboard_metrics_cache for select using (public.is_admin());
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
