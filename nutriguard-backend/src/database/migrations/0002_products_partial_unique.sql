-- Supplement to the Drizzle-generated migration for `products`.
-- Partial unique index: barcode is nullable until the Barcode Scanner
-- feature ships, so a plain `unique()` column constraint would reject
-- multiple NULLs incorrectly on some interpretations — a partial index
-- expresses "unique only when present" precisely. Apply immediately
-- after the migration that creates the `products` table.
create unique index if not exists idx_products_barcode_uk
  on products (barcode)
  where barcode is not null;
