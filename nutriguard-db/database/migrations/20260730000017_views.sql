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
