-- =====================================================================
-- 04_product_module.sql
-- Purpose: Catalogued products (as scanned/entered by users) and brands.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: brands
-- Reference/lookup table, deduplicated brand names.
-- ---------------------------------------------------------------------
create table public.brands (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  logo_url      text,
  website       text,
  created_at    timestamptz not null default now(),

  constraint brands_name_uk unique (name)
);

comment on table public.brands is 'Deduplicated brand/manufacturer reference table.';

-- ---------------------------------------------------------------------
-- Table: products
-- A distinct product a user has scanned. Deduplicated by barcode when
-- available so repeated scans of the same product reuse the same row.
-- ---------------------------------------------------------------------
create table public.products (
  id                uuid primary key default gen_random_uuid(),
  brand_id          uuid references public.brands(id) on delete set null,
  name              text not null,
  barcode           text,                              -- UPC/EAN, nullable until Barcode Scanner feature ships
  image_url         text,
  raw_ingredient_text text,                             -- original pasted/OCR'd text, preserved verbatim
  created_by        uuid references public.user_profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint products_name_len check (char_length(name) between 1 and 300)
);

comment on table public.products is 'Distinct scanned/catalogued product. Deduplicated by barcode where available.';
comment on column public.products.raw_ingredient_text is 'Verbatim original ingredient text as pasted or OCR-extracted, preserved for audit/reprocessing.';

-- Partial unique index: only enforce barcode uniqueness when a barcode is present
-- (see 06_indexes.sql for the full indexing rationale)
