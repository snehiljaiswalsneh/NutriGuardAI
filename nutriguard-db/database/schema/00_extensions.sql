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
