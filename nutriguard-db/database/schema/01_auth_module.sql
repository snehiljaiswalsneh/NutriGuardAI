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
