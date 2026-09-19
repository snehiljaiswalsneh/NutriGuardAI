-- =====================================================================
-- seeds/01_reference_data.sql
-- Purpose: Reference/lookup data required for the app to function
--          (countries, allergens, languages) — safe to run in any env.
-- =====================================================================

insert into public.countries (iso_code, iso_code_3, name, flag_emoji, region) values
  ('US', 'USA', 'United States', '🇺🇸', 'North America'),
  ('IN', 'IND', 'India', '🇮🇳', 'South Asia'),
  ('GB', 'GBR', 'United Kingdom', '🇬🇧', 'Europe'),
  ('DE', 'DEU', 'Germany', '🇩🇪', 'Europe'),
  ('NO', 'NOR', 'Norway', '🇳🇴', 'Europe'),
  ('AU', 'AUS', 'Australia', '🇦🇺', 'Oceania'),
  ('JP', 'JPN', 'Japan', '🇯🇵', 'East Asia')
on conflict (iso_code) do nothing;

-- The EU is modeled as a pseudo-country row for regulation purposes
insert into public.countries (iso_code, iso_code_3, name, flag_emoji, region) values
  ('EU', 'EUU', 'European Union', '🇪🇺', 'Europe')
on conflict (iso_code) do nothing;

insert into public.allergens (name, slug, description) values
  ('Peanuts', 'peanuts', 'One of the most common and severe food allergies.'),
  ('Tree Nuts', 'tree-nuts', 'Includes almonds, walnuts, cashews, and more.'),
  ('Milk', 'milk', 'Dairy-derived allergen, distinct from lactose intolerance.'),
  ('Eggs', 'eggs', 'Common allergen, especially in children.'),
  ('Soy', 'soy', 'Derived from soybeans, common in processed foods.'),
  ('Wheat / Gluten', 'wheat-gluten', 'Includes wheat, barley, rye.'),
  ('Fish', 'fish', 'Finned fish allergens.'),
  ('Shellfish', 'shellfish', 'Crustacean and mollusk allergens.')
on conflict (slug) do nothing;

insert into public.languages (code, name, is_active) values
  ('en', 'English', true),
  ('hi-IN', 'हिन्दी (Hindi)', false),
  ('es', 'Español', false)
on conflict (code) do nothing;


-- =====================================================================
-- seeds/02_sample_data.sql
-- Purpose: Realistic sample records for local development and demos.
-- Safe to run repeatedly (idempotent via ON CONFLICT / fixed UUIDs).
-- =====================================================================

-- Sample ingredient category
insert into public.ingredient_categories (id, name, slug, description) values
  ('a0000000-0000-4000-8000-000000000001', 'Preservatives', 'preservatives', 'Additives that extend shelf life and prevent spoilage.')
on conflict (id) do nothing;

-- Sample ingredients
insert into public.ingredients (id, category_id, name, scientific_name, e_number, aliases, description, purpose, risk_level, risk_summary, is_natural, is_synthetic) values
  (
    'a0000000-0000-4000-8000-000000000101',
    'a0000000-0000-4000-8000-000000000001',
    'Sodium Nitrite',
    'NaNO2',
    'E250',
    array['Nitrite Curing Salt', 'Sodium Nitrite (E250)'],
    'Sodium Nitrite is a curing agent added to processed meats to prevent bacterial growth and preserve color.',
    'Preservative and color fixative used in cured/processed meats',
    'high',
    'Linked to nitrosamine formation when cooked at high heat',
    false,
    true
  ),
  (
    'a0000000-0000-4000-8000-000000000102',
    null,
    'Citric Acid',
    'C6H8O7',
    'E330',
    array['Citric Acid (E330)'],
    'Citric Acid occurs naturally in citrus fruits and is manufactured industrially as a flavoring and preservative.',
    'Flavor enhancer and natural preservative',
    'safe',
    'Naturally occurring acid, widely recognized as safe',
    true,
    false
  ),
  (
    'a0000000-0000-4000-8000-000000000103',
    null,
    'Tartrazine',
    'C16H9N4Na3O9S2',
    'E102',
    array['Yellow 5', 'Tartrazine (E102)'],
    'Tartrazine is a synthetic azo dye used to give foods a lemon-yellow color.',
    'Yellow food coloring',
    'moderate',
    'Synthetic dye linked to hyperactivity in sensitive children',
    false,
    true
  )
on conflict (id) do nothing;

-- Sample health effects
insert into public.ingredient_health_effects (ingredient_id, effect, severity, display_order) values
  ('a0000000-0000-4000-8000-000000000101', 'Nitrosamine formation has been associated with increased cancer risk in long-term studies', 'high', 1),
  ('a0000000-0000-4000-8000-000000000101', 'May trigger headaches or sensitivity reactions in a small subset of individuals', 'moderate', 2),
  ('a0000000-0000-4000-8000-000000000103', 'Associated with hyperactivity in some children (UK Food Standards Agency study)', 'moderate', 1)
on conflict do nothing;

-- Sample country regulations
insert into public.ingredient_country_regulations (ingredient_id, country_id, status, regulation_note)
select 'a0000000-0000-4000-8000-000000000101', c.id, 'approved', 'Approved with usage limits under 21 CFR 172.170'
from public.countries c where c.iso_code = 'US'
on conflict (ingredient_id, country_id) do nothing;

insert into public.ingredient_country_regulations (ingredient_id, country_id, status, regulation_note)
select 'a0000000-0000-4000-8000-000000000101', c.id, 'restricted', 'Restricted concentration limits under EU Regulation 1129/2011'
from public.countries c where c.iso_code = 'EU'
on conflict (ingredient_id, country_id) do nothing;

insert into public.ingredient_country_regulations (ingredient_id, country_id, status, regulation_note)
select 'a0000000-0000-4000-8000-000000000103', c.id, 'banned', 'Banned from food products under national food safety regulations'
from public.countries c where c.iso_code = 'NO'
on conflict (ingredient_id, country_id) do nothing;

-- Sample brand and product
insert into public.brands (id, name) values
  ('a0000000-0000-4000-8000-000000000201', 'TrailSnax')
on conflict (id) do nothing;

insert into public.products (id, brand_id, name, raw_ingredient_text) values
  (
    'a0000000-0000-4000-8000-000000000301',
    'a0000000-0000-4000-8000-000000000201',
    'Classic Cured Beef Jerky',
    'Beef, Water, Sodium Nitrite, Citric Acid, Tartrazine (E102)'
  )
on conflict (id) do nothing;

insert into public.product_ingredients (product_id, ingredient_id, raw_text, position, match_confidence) values
  ('a0000000-0000-4000-8000-000000000301', 'a0000000-0000-4000-8000-000000000101', 'Sodium Nitrite', 1, 0.98),
  ('a0000000-0000-4000-8000-000000000301', 'a0000000-0000-4000-8000-000000000102', 'Citric Acid', 2, 0.99),
  ('a0000000-0000-4000-8000-000000000301', 'a0000000-0000-4000-8000-000000000103', 'Tartrazine (E102)', 3, 0.95)
on conflict (product_id, position) do nothing;

-- Note: user_profiles / scans / safety_scores sample rows are intentionally
-- omitted here because user_profiles.id must reference a real row in
-- auth.users, which only exists once a user signs up via Supabase Auth.
-- See docs/sample_records.md for fully worked example rows to paste in
-- after creating a test user via the Supabase Auth dashboard or CLI.
