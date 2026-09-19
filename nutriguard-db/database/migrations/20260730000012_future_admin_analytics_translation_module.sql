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
