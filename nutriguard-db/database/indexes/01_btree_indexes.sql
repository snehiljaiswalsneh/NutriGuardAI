-- =====================================================================
-- indexes/01_btree_indexes.sql
-- Purpose: Foreign-key and lookup indexes not already implied by
--          PRIMARY KEY / UNIQUE constraints. Postgres does NOT
--          automatically index foreign key columns — every FK used in
--          a join or lookup gets an explicit index here.
-- =====================================================================

-- user_profiles
create index idx_user_profiles_role on public.user_profiles (role) where deleted_at is null;
create index idx_user_profiles_country_code on public.user_profiles (country_code);

-- ingredients
create index idx_ingredients_category_id on public.ingredients (category_id);
create index idx_ingredients_risk_level on public.ingredients (risk_level) where deleted_at is null;
create index idx_ingredients_e_number on public.ingredients (e_number) where e_number is not null;
-- Trigram index powers fast fuzzy/ILIKE search on ingredient name (autocomplete, typo tolerance)
create index idx_ingredients_name_trgm on public.ingredients using gin (name gin_trgm_ops);
-- GIN index on the array column — powers "does this alias match" lookups
create index idx_ingredients_aliases_gin on public.ingredients using gin (aliases);

-- ingredient_categories
create index idx_ingredient_categories_parent_id on public.ingredient_categories (parent_id);

-- ingredient_health_effects
create index idx_ingredient_health_effects_ingredient_id on public.ingredient_health_effects (ingredient_id);

-- ingredient_alternatives
create index idx_ingredient_alternatives_ingredient_id on public.ingredient_alternatives (ingredient_id);
create index idx_ingredient_alternatives_alt_ingredient_id on public.ingredient_alternatives (alternative_ingredient_id);

-- ingredient_allergens
create index idx_ingredient_allergens_allergen_id on public.ingredient_allergens (allergen_id);

-- ingredient_country_regulations
create index idx_icr_country_id on public.ingredient_country_regulations (country_id);
create index idx_icr_status on public.ingredient_country_regulations (status);

-- ingredient_research_sources
create index idx_irs_source_id on public.ingredient_research_sources (research_source_id);

-- brands
create index idx_brands_name_trgm on public.brands using gin (name gin_trgm_ops);

-- products
create index idx_products_brand_id on public.products (brand_id);
create index idx_products_created_by on public.products (created_by);
create index idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
-- Partial unique index: only enforce barcode uniqueness when present (nullable field)
create unique index idx_products_barcode_uk on public.products (barcode) where barcode is not null;

-- product_ingredients
create index idx_product_ingredients_product_id on public.product_ingredients (product_id);
create index idx_product_ingredients_ingredient_id on public.product_ingredients (ingredient_id);

-- user_saved_ingredients
create index idx_user_saved_ingredients_ingredient_id on public.user_saved_ingredients (ingredient_id);

-- scans — the single most frequently queried table (History screen, Dashboard)
create index idx_scans_user_id_scanned_at on public.scans (user_id, scanned_at desc);
create index idx_scans_product_id on public.scans (product_id);
create index idx_scans_status on public.scans (status) where status <> 'completed';

-- safety_scores
create index idx_safety_scores_verdict on public.safety_scores (verdict);

-- comparisons
create index idx_comparisons_user_id_compared_at on public.comparisons (user_id, compared_at desc);
create index idx_comparisons_scan_a_id on public.comparisons (scan_a_id);
create index idx_comparisons_scan_b_id on public.comparisons (scan_b_id);

-- notifications
create index idx_notifications_user_id_unread on public.notifications (user_id, created_at desc) where is_read = false;

-- audit_logs — append-only, queried by actor and by entity
create index idx_audit_logs_actor_id on public.audit_logs (actor_id);
create index idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index idx_audit_logs_created_at on public.audit_logs (created_at desc);
-- GIN index for querying/filtering inside the metadata JSONB payload
create index idx_audit_logs_metadata_gin on public.audit_logs using gin (metadata);

-- Future modules
create index idx_ocr_captures_scan_id on public.ocr_captures (scan_id);
create index idx_barcode_lookups_barcode on public.barcode_lookups (barcode);
create index idx_voice_queries_user_id on public.voice_queries (user_id, asked_at desc);
create index idx_recommendations_user_id on public.recommendations (user_id) where is_dismissed = false;
create index idx_ingredient_translations_lang on public.ingredient_translations (language_code);
create index idx_analytics_events_user_id on public.analytics_events (user_id, occurred_at desc);
create index idx_analytics_events_event_name on public.analytics_events (event_name, occurred_at desc);
