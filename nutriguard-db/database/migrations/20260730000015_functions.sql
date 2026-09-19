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
