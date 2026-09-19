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
