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
