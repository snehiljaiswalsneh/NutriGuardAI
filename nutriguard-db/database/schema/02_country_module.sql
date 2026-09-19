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
