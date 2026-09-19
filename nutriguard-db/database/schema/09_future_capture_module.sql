-- =====================================================================
-- 09_future_capture_module.sql
-- Purpose: Future input-capture features — OCR Scanner, Barcode Scanner,
--          Voice Assistant. Designed now so `scans.input_source` values
--          ('ocr', 'barcode', 'voice') have a home once each ships.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Table: ocr_captures
-- One-to-one with a scan created via the OCR Scanner. Stores the raw
-- image reference and extracted text separately from the cleaned
-- `products.raw_ingredient_text` so OCR quality can be audited/improved.
-- ---------------------------------------------------------------------
create table public.ocr_captures (
  scan_id           uuid primary key references public.scans(id) on delete cascade,
  image_storage_path text not null,               -- Supabase Storage object path
  extracted_text     text not null,
  ocr_confidence     numeric(4,3),
  ocr_engine         text not null default 'tesseract-v5',
  processed_at       timestamptz not null default now(),

  constraint ocr_captures_confidence_range check (
    ocr_confidence is null or (ocr_confidence >= 0 and ocr_confidence <= 1)
  )
);

comment on table public.ocr_captures is 'Future: raw image + extracted text for scans captured via the OCR Scanner.';

-- ---------------------------------------------------------------------
-- Table: barcode_lookups
-- One-to-one with a scan created via the Barcode Scanner. Caches the
-- external barcode-database response so repeat scans of the same
-- barcode don't re-hit the third-party API.
-- ---------------------------------------------------------------------
create table public.barcode_lookups (
  scan_id             uuid primary key references public.scans(id) on delete cascade,
  barcode             text not null,
  external_provider   text not null default 'openfoodfacts',
  external_payload    jsonb not null default '{}'::jsonb,
  looked_up_at        timestamptz not null default now()
);

comment on table public.barcode_lookups is 'Future: cached third-party barcode-database response for scans created via the Barcode Scanner.';

-- ---------------------------------------------------------------------
-- Table: voice_queries
-- Log of natural-language voice questions asked about an ingredient or
-- scan (not necessarily tied 1:1 to a scan — a user may ask follow-up
-- questions about any past result).
-- ---------------------------------------------------------------------
create table public.voice_queries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.user_profiles(id) on delete cascade,
  scan_id       uuid references public.scans(id) on delete set null,
  ingredient_id uuid references public.ingredients(id) on delete set null,
  transcript    text not null,
  ai_response   text,
  audio_storage_path text,                        -- optional, if audio is retained
  asked_at      timestamptz not null default now()
);

comment on table public.voice_queries is 'Future: log of natural-language voice questions and AI responses, optionally linked to a scan or ingredient.';
