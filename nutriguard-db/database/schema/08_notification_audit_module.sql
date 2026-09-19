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
