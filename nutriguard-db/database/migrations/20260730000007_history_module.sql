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
