# NutriGuard AI — Database Design Document (DDD)
### Supabase PostgreSQL · Production Architecture · pgvector-ready

---

## 1. Database Overview

**Database type:** Relational (PostgreSQL 15+, as provisioned by Supabase), with `pgvector` for embedding similarity search and `pg_trgm` for fuzzy text search.

**Why PostgreSQL:**
- Mature, ACID-compliant, battle-tested at scale (millions of rows is routine, not exotic, for Postgres).
- First-class support for `JSONB` (semi-structured AI output), arrays (`aliases`), full-text search (`tsvector`), and — critically for this project — `pgvector` for AI embedding search, all in one engine instead of bolting on Elasticsearch/Pinecone.
- Rich constraint system (`CHECK`, `EXCLUDE`, partial/unique indexes) lets the database itself enforce data integrity rather than trusting application code alone — essential when "vibe coding" multiple AI-generated client surfaces against the same data.

**Why Supabase:**
- Supabase *is* PostgreSQL — no proprietary query language, no lock-in; this schema is portable to any Postgres host.
- Built-in Auth (`auth.users`), Storage (for OCR images/audio), Realtime (for live scan-status updates), and auto-generated REST/GraphQL (PostgREST) mean Row Level Security becomes the *actual* authorization layer, not just a nice-to-have — this schema is designed RLS-first accordingly.
- Managed backups, PITR, and connection pooling (PgBouncer via Supavisor) come out of the box, which materially reduces the operational burden of "AI-first" small teams.

**Design principles:**
1. **Normalize the knowledge base, denormalize the read path.** The ingredient knowledge graph (ingredients, categories, allergens, regulations, sources) is fully normalized to 3NF/BCNF to avoid duplicate/contradictory data. Expensive multi-join reads (Dashboard, Ingredient Detail) are served through views (`scan_dashboard_view`, `ingredient_full_detail_view`) rather than denormalizing the base tables.
2. **RLS-first security.** Every table defaults to zero access; access is explicitly granted per table per role (see §11).
3. **UUID primary keys everywhere.** Enables client-generated IDs (offline-first flows), avoids sequential-ID enumeration attacks, and matches Supabase Auth's `auth.users.id` type.
4. **Soft delete where history matters, hard delete where it doesn't.** `ingredients` and `user_profiles` use `deleted_at` (a scan from 2024 must still resolve the ingredient it referenced). Junction/log tables cascade-delete normally.
5. **Schema is additive-first.** Every future feature (OCR, Barcode, Voice, Nutrition, Recommendations, Admin, Analytics, Translations) has its tables designed *now*, as satellite tables keyed off `scans`/`products`/`ingredients`/`user_profiles`, so shipping them later requires new tables, not migrations that rewrite existing ones.

**Normalization strategy:** Target 3NF for all transactional/knowledge-base tables (see §17 for a table-by-table justification), with deliberate, documented denormalization only at the view layer and in two append-only analytical tables (`analytics_events`, `admin_dashboard_metrics_cache`) where join-heavy live aggregation would not scale.

**Scalability strategy:** UUID keys + covering indexes for the hot paths (`scans` by user, `ingredients` by name/trigram/fts), monthly range-partitioning for the highest-volume future table (`analytics_events`), materialized views for admin aggregates, and pgvector HNSW indexes for O(log n) semantic search instead of linear scan. See §18 for full detail.

**Security strategy:** Row Level Security enabled on all 38 tables, a single `is_admin()` helper centralizing privilege checks, `security definer` used sparingly and only for controlled RPCs, and an append-only, trigger-populated `audit_logs` table for compliance/forensics. See §11.

---

## 2. Entity Relationship Diagram (ERD)

Full Mermaid ERDs (core + future modules, split for readability) live in **[`database/docs/erd.md`](./database/docs/erd.md)**. Summary of the core join structure:

```
auth.users (Supabase-managed)
      │ 1:1
      ▼
user_profiles ──1:1──> user_settings
      │ 1:N                 │ M:N (watchlist)
      ▼                     ▼
   scans, comparisons,   ingredients ──M:N──> countries (via ingredient_country_regulations)
   notifications, products    │  │  │
                               │  │  └─M:N─> research_sources
                               │  └────M:N─> allergens
                               └───1:N────> ingredient_health_effects, ingredient_alternatives

products ──1:N──> product_ingredients ──N:1──> ingredients
products ──1:N──> scans ──1:1──> safety_scores, ai_summaries
scans, scans ──M:N (paired)──> comparisons
```

---

## 3. Database Modules

| Module | Tables |
|---|---|
| **Authentication** | `user_profiles`, `user_settings`, `user_saved_ingredients` (+ Supabase-managed `auth.users`) |
| **Ingredient Knowledge Base** | `ingredient_categories`, `ingredients`, `ingredient_health_effects`, `research_sources`, `ingredient_research_sources`, `ingredient_alternatives`, `allergens`, `ingredient_allergens` |
| **Regulatory** | `countries`, `ingredient_country_regulations` |
| **Product** | `brands`, `products`, `product_ingredients` |
| **History / Analysis** | `scans`, `safety_scores`, `ai_summaries`, `comparisons` |
| **AI / Vector** | `ingredient_embeddings`, `product_embeddings` |
| **Notifications & Audit** | `notifications`, `audit_logs` |
| **Future: Capture** | `ocr_captures`, `barcode_lookups`, `voice_queries` |
| **Future: Nutrition & Recommendations** | `nutrition_facts`, `user_dietary_preferences`, `recommendations` |
| **Future: Localization** | `languages`, `ingredient_translations`, `ui_translations` |
| **Future: Admin & Analytics** | `admin_roles`, `analytics_events`, `admin_dashboard_metrics_cache` |

**Total: 38 tables** across 11 modules (26 current-feature tables + 12 future-feature tables).

---

## 4–5. Table Design & Required Tables

Full column-level DDL with types, constraints, defaults, and inline rationale comments lives in **`database/schema/*.sql`** (one file per module, numbered in dependency order) — this is the authoritative source. The table below is a compact cross-reference; **for exact column definitions, open the corresponding schema file.**

| Table | Purpose | PK | Key FKs | Notable Constraints/Indexes |
|---|---|---|---|---|
| `user_profiles` | 1:1 profile extension of `auth.users` | `id` (=auth.users.id) | `id → auth.users.id` | soft delete (`deleted_at`), `role` indexed |
| `user_settings` | 1:1 preferences | `user_id` | `user_id → user_profiles.id` | `theme` CHECK enum |
| `user_saved_ingredients` | M:N watchlist | `(user_id, ingredient_id)` | both FKs cascade | composite PK doubles as unique constraint |
| `ingredient_categories` | Self-referencing category tree | `id` | `parent_id → self` | unique `slug` |
| `ingredients` | Core knowledge-base entity | `id` | `category_id → ingredient_categories` | unique `name`; generated `search_vector`; GIN + trigram indexes |
| `ingredient_health_effects` | 1:N documented effects | `id` | `ingredient_id → ingredients` | ordered via `display_order` |
| `research_sources` | Deduplicated citations | `id` | — | unique `url` |
| `ingredient_research_sources` | M:N junction | `(ingredient_id, research_source_id)` | both FKs cascade | — |
| `ingredient_alternatives` | Safer-swap suggestions | `id` | `ingredient_id`, `alternative_ingredient_id → ingredients` | CHECK: target present, not self-referencing |
| `allergens` | Reference list | `id` | — | unique `slug` |
| `ingredient_allergens` | M:N junction | `(ingredient_id, allergen_id)` | both FKs cascade | `severity` enum |
| `countries` | Static reference (~195 rows) | `id` | — | unique `iso_code`, format CHECK |
| `ingredient_country_regulations` | M:N junction w/ status | `id` | `ingredient_id`, `country_id` | unique `(ingredient_id, country_id)` |
| `brands` | Deduplicated manufacturers | `id` | — | unique `name` |
| `products` | Scanned/catalogued product | `id` | `brand_id`, `created_by → user_profiles` | partial unique index on `barcode` (nullable) |
| `product_ingredients` | Ordered M:N junction | `id` | `product_id`, `ingredient_id` (nullable) | unique `(product_id, position)`; confidence CHECK |
| `scans` | One AI analysis run | `id` | `user_id`, `product_id` | CHECK: error_message required iff failed |
| `safety_scores` | 1:1 derived score | `scan_id` | `scan_id → scans` | score CHECK 0–100 |
| `ai_summaries` | 1:1 AI narrative output | `scan_id` | `scan_id → scans` | — |
| `comparisons` | Product-vs-product record | `id` | `scan_a_id`, `scan_b_id → scans` | CHECK: distinct scans |
| `ingredient_embeddings` | 1:1 vector embedding | `ingredient_id` | `ingredient_id → ingredients` | HNSW vector index |
| `product_embeddings` | 1:1 vector embedding | `product_id` | `product_id → products` | HNSW vector index |
| `notifications` | User notification feed | `id` | `user_id → user_profiles` | partial index on unread |
| `audit_logs` | Append-only audit trail | `id` | `actor_id → user_profiles` (nullable) | GIN index on `metadata` |
| `ocr_captures` *(future)* | 1:1 OCR source data | `scan_id` | `scan_id → scans` | confidence CHECK |
| `barcode_lookups` *(future)* | 1:1 cached barcode API response | `scan_id` | `scan_id → scans` | — |
| `voice_queries` *(future)* | Voice Q&A log | `id` | `user_id`, `scan_id`, `ingredient_id` (nullable) | — |
| `nutrition_facts` *(future)* | 1:1 nutrition label data | `product_id` | `product_id → products` | non-negative CHECKs |
| `user_dietary_preferences` *(future)* | 1:N dietary tags | `id` | `user_id → user_profiles` | unique `(user_id, preference)` |
| `recommendations` *(future)* | Generic AI recommendation record | `id` | `user_id`, `source_product_id`, `recommended_product_id` | CHECK: distinct products |
| `languages` *(future)* | Supported UI languages | `code` | — | — |
| `ingredient_translations` *(future)* | Per-language ingredient copy | `id` | `ingredient_id`, `language_code` | unique `(ingredient_id, language_code)` |
| `ui_translations` *(future)* | Static UI copy | `(translation_key, language_code)` | `language_code → languages` | — |
| `admin_roles` *(future)* | Explicit, auditable admin grants | `user_id` | `user_id`, `granted_by → user_profiles` | — |
| `analytics_events` *(future)* | High-volume event stream | `id` | `user_id → user_profiles` (nullable) | **range-partitioned** by month |
| `admin_dashboard_metrics_cache` *(future)* | Precomputed daily metrics | `(metric_key, metric_date)` | — | — |

---

## 6. Future Tables

Covered in the table above (marked *future*) and implemented in full in `schema/09_future_capture_module.sql`, `10_future_nutrition_recommendation_module.sql`, and `11_future_admin_analytics_translation_module.sql`. Design intent for each:

- **OCR (`ocr_captures`):** stores the Storage path to the source image plus raw extracted text *separately* from the cleaned `products.raw_ingredient_text`, so OCR accuracy can be measured/improved without touching the canonical product record.
- **Barcode (`barcode_lookups`):** caches the full third-party API JSON response (`external_payload jsonb`) so repeat scans of a popular barcode never re-hit the external provider.
- **Voice Assistant (`voice_queries`):** intentionally *not* 1:1 with `scans` — a user can ask multiple follow-up questions about one scan, or about an ingredient with no scan context at all, hence both FKs are nullable.
- **Nutrition Dashboard (`nutrition_facts`):** models standard label fields as explicit typed columns (queryable, CHECK-constrained) with a `jsonb` overflow column for uncommon micronutrients — the "normalize the common case, JSONB the long tail" pattern used throughout.
- **Recommendation Engine (`recommendations`):** one generic table with a `recommendation_type` discriminator rather than three separate tables, since all three (safer alternative / similar product / dietary match) share the same shape (source, target, score, reason).
- **Admin Dashboard (`admin_roles`, `admin_dashboard_metrics_cache`):** role grants are kept **out** of `user_profiles.role` for anything above `user`/`moderator` so elevation is independently auditable and revocable (`revoked_at`) without mutating the primary profile row; the metrics cache means the dashboard never runs a live aggregate query.
- **Analytics (`analytics_events`):** the only table designed with partitioning from day one, since it's the only table expected to have order-of-magnitude higher write volume than everything else combined.
- **Multi-language (`languages`, `ingredient_translations`, `ui_translations`):** satellite tables keyed by `language_code`, so shipping a new language is a data-only change — zero schema migration required.

---

## 7. Relationships

- **One-to-One:** `user_profiles` ↔ `user_settings`; `user_profiles` ↔ `auth.users`; `scans` ↔ `safety_scores`; `scans` ↔ `ai_summaries`; `scans` ↔ `ocr_captures`/`barcode_lookups`; `products` ↔ `nutrition_facts`; `ingredients`/`products` ↔ their respective `_embeddings` table. Implemented by making the child table's PK *also* a FK to the parent (e.g. `safety_scores.scan_id` is both PK and FK).
- **One-to-Many:** `ingredient_categories` → `ingredients`; `ingredients` → `ingredient_health_effects`; `brands` → `products`; `user_profiles` → `scans`/`comparisons`/`notifications`; `products` → `product_ingredients`.
- **Many-to-Many (via junction tables):**
  - `ingredients` ↔ `research_sources` via `ingredient_research_sources`
  - `ingredients` ↔ `allergens` via `ingredient_allergens`
  - `ingredients` ↔ `countries` via `ingredient_country_regulations` (junction *with attributes* — `status`, `regulation_note`)
  - `products` ↔ `ingredients` via `product_ingredients` (junction *with attributes* — `position`, `raw_text`, `match_confidence`)
  - `user_profiles` ↔ `ingredients` via `user_saved_ingredients`
  - `scans` ↔ `scans` via `comparisons` (a junction table pointing twice at the same parent table — modeled with two distinct FK columns `scan_a_id`/`scan_b_id` rather than a symmetric junction, since order matters for the A/B comparison UI)
- **Junction tables always carry a composite primary key** of the two FKs (e.g. `(ingredient_id, allergen_id)`) **except** where the relationship itself has its own identity worth referencing elsewhere (e.g. `ingredient_country_regulations` and `product_ingredients` get their own surrogate `id` because other tables — `research_sources` via `source_id`, audit logs — may need to reference a specific regulation/mapping row).

---

## 8. Data Types

| Use case | Type | Rationale |
|---|---|---|
| All primary/foreign keys | `uuid` (default `gen_random_uuid()`) | Matches `auth.users.id`; safe for client-generated IDs; no enumeration risk |
| Short reference codes | `char(2)` / `char(5)` | ISO 3166 / BCP-47 codes — fixed-length, indexable, self-documenting |
| Names, descriptions, free text | `text` (never `varchar(n)`) | Postgres `text` and `varchar` perform identically; `text` avoids arbitrary length ceilings, length is enforced via `CHECK` where it actually matters (see `ingredients_name_len`) |
| Flags | `boolean` | `is_active`, `is_natural`, `is_read`, etc. |
| All timestamps | `timestamptz` (never bare `timestamp`) | Stores in UTC, converts on display — mandatory for a global product |
| AI/flexible payloads | `jsonb` (never `json`) | Binary-stored, indexable (GIN), supports containment queries — used for `audit_logs.metadata`, `nutrition_facts.extra_nutrients`, `analytics_events.properties` |
| Scores / money-like precision | `numeric(p,s)` (never `float`/`real`) | Exact decimal representation — used for `match_confidence`, nutrition values, recommendation scores |
| Counts, small enumerable ranges | `smallint` | `position`, `display_order`, `ingredient_count` — saves space at scale vs `integer` |
| Alternate names | `text[]` | `ingredients.aliases` — avoids a satellite table for a small, rarely-queried list; matched via GIN index |
| Full-text search | `tsvector` (generated column) | `ingredients.search_vector` — precomputed and stored, not computed per-query |
| AI embeddings | `vector(1536)` (pgvector) | `ingredient_embeddings.embedding`, `product_embeddings.embedding` |
| Closed enumerations | native PostgreSQL `ENUM` | `risk_level`, `regulation_status`, `app_role`, `allergen_severity`, `job_status`, `notification_type`, `comparison_winner` — self-documenting, storage-efficient, and reject invalid values at the type level rather than via `CHECK (x in (...))` scattered everywhere |
| Network metadata | `inet` | `audit_logs.ip_address` |

---

## 9. Indexing Strategy

Full DDL in `database/indexes/*.sql`. Summary by category:

- **Primary indexes:** automatic on every `PRIMARY KEY` (B-tree) — covers `id`/composite-key lookups.
- **Foreign-key indexes:** PostgreSQL does **not** auto-index FK columns — every FK used in a join gets an explicit B-tree index (`idx_ingredients_category_id`, `idx_scans_product_id`, `idx_product_ingredients_ingredient_id`, etc.) to prevent sequential scans on cascade deletes and joins.
- **Composite indexes:** `idx_scans_user_id_scanned_at (user_id, scanned_at desc)` — the single most important index in the schema, since "a user's scans, newest first" is the History screen's core query; `idx_comparisons_user_id_compared_at` mirrors the same pattern.
- **Partial indexes:** `idx_products_barcode_uk` (unique, `where barcode is not null`) since barcode is nullable until the Barcode Scanner ships; `idx_notifications_user_id_unread` (`where is_read = false`) since unread notifications are the only ones queried hot-path; `idx_scans_status` (`where status <> 'completed'`) since 99%+ of scans will be `completed` and only the exceptions need fast lookup.
- **Full-text search (GIN):** `idx_ingredients_search_vector` on the generated `tsvector` column — powers the global Navbar search; `idx_products_fts` mirrors this for product names.
- **Trigram (GIN, `pg_trgm`):** `idx_ingredients_name_trgm`, `idx_products_name_trgm`, `idx_brands_name_trgm` — powers fuzzy/typo-tolerant `ILIKE '%term%'` search, which plain B-tree indexes cannot accelerate.
- **JSONB (GIN):** `idx_audit_logs_metadata_gin` — supports containment queries (`metadata @> '{"key": "value"}'`) against the audit trail without a full scan.
- **Array (GIN):** `idx_ingredients_aliases_gin` — supports `aliases && ARRAY[...]` matching when reconciling free-text label input against known alternate names.
- **Vector (HNSW, pgvector ≥0.5):** `idx_ingredient_embeddings_hnsw`, `idx_product_embeddings_hnsw` using `vector_cosine_ops` — chosen over `ivfflat` because our workload is read-heavy with infrequent bulk re-indexing, where HNSW's better recall at similar query latency wins; see the caveat in `indexes/03_vector_indexes.sql` about timing index creation relative to data volume.

---

## 10. Constraints

- **`NOT NULL`:** applied to every column that has no valid "empty" state (e.g. `ingredients.name`, `scans.user_id`, `safety_scores.score`).
- **`UNIQUE`:** `ingredients.name`, `countries.iso_code`, `brands.name`, `research_sources.url`, `allergens.slug`, plus composite uniques on every junction table's natural key (e.g. `(ingredient_id, country_id)` on `ingredient_country_regulations`).
- **`CHECK`:** score ranges (`safety_scores.score between 0 and 100`), confidence ranges (`match_confidence between 0 and 1`), format validation (`countries.iso_code ~ '^[A-Z]{2}$'`), conditional requirements (`scans`: `error_message` required exactly when `status = 'failed'`), self-reference guards (`ingredient_alternatives`: `alternative_ingredient_id <> ingredient_id`), and non-negative numeric guards (`nutrition_facts`).
- **`DEFAULT`:** `gen_random_uuid()` on every PK; `now()` on every timestamp; sensible enum defaults (`risk_level DEFAULT 'unknown'` rather than `NULL`, so every read gets an explicit, renderable value).
- **`FOREIGN KEY` + cascade behavior:**
  - `ON DELETE CASCADE` — used where the child row is meaningless without the parent (e.g. `user_settings`, junction tables, `safety_scores`/`ai_summaries` off `scans`).
  - `ON DELETE SET NULL` — used where the child row should survive the parent's deletion (e.g. `products.brand_id`, `ingredients.category_id`, `audit_logs.actor_id` — an audit record must outlive the user it describes).
  - `ON DELETE RESTRICT` — used exactly once, deliberately: `scans.product_id` — a product that has scan history attached cannot be deleted outright (protects the integrity of a user's History), it must be soft-handled at the application layer instead.

---

## 11. Security Design

- **Row Level Security (RLS):** enabled on **all 38 tables** (`database/policies/01_rls_policies.sql`). Postgres's default-deny-once-enabled behavior means any table without an explicit policy for an operation silently rejects that operation — this is treated as a feature, not a gap (e.g. `audit_logs` intentionally has no `UPDATE`/`DELETE` policy at all, making the audit trail tamper-proof at the database level).
- **Supabase policy patterns used:**
  - **Public-read reference data** (`ingredients`, `countries`, `allergens`, etc.): `using (true)` for `SELECT` — this is shared knowledge, not personal data.
  - **Owner-scoped personal data** (`scans`, `comparisons`, `notifications`, `user_settings`): `using (auth.uid() = user_id)`.
  - **Admin-gated writes to the knowledge base**: `with check (public.is_admin())`, where `is_admin()` is a single `security definer` SQL function checking `admin_roles` — centralizing this logic means a future policy audit only has one function to review, not 20 duplicated subqueries.
  - **Service-role-only tables** (e.g. `product_embeddings` writes): `using (auth.role() = 'service_role')` — embeddings are generated by a backend job, never directly by a client.
- **Role-based access:**
  - **User roles:** plain authenticated users (`app_role = 'user'`), the default and by far the largest population.
  - **Admin roles:** `moderator`, `admin`, `super_admin`, tracked in the dedicated `admin_roles` table (not just a column) so grants are independently timestamped, attributable (`granted_by`), and revocable (`revoked_at`) without an audit gap.
- **Encryption:** Supabase encrypts data at rest (AES-256) and in transit (TLS) by default at the infrastructure level; no application-level column encryption is used for this schema, since no payment/SSN-grade data is stored — if health-profile PII expands in the future (e.g. detailed medical conditions), revisit with `pgcrypto`'s `pgp_sym_encrypt` on those specific columns.
- **API access:** Supabase's auto-generated PostgREST API is the *only* client-facing access path in this architecture — there is no separate backend service with elevated DB credentials for standard CRUD, which is precisely why RLS is treated as the primary (not secondary) authorization boundary throughout this document.
- **Audit trail:** `audit_logs` is populated automatically via trigger (`write_audit_log()`) on sensitive tables (`user_profiles`, `ingredients`, `admin_roles`) rather than relying on application code to remember to log — see §14/`triggers/01_triggers.sql`.

---

## 12. AI Knowledge Database

The "AI knowledge database" *is* the Ingredient Knowledge Base module (§3) — deliberately modeled as normalized relational data, not a single JSONB blob per ingredient, so that:

- **Risk levels** (`ingredients.risk_level`) are a queryable, indexable enum — "show me every high-risk ingredient" is a single indexed query, not a JSON-scan.
- **Health effects** are their own table (`ingredient_health_effects`) so severity and display order are structured, not string-parsed.
- **Research references** are deduplicated (`research_sources`) and linked via junction (`ingredient_research_sources`) — the same WHO report cited by 200 ingredients is stored once.
- **Country regulations** are a proper junction with attributes (`ingredient_country_regulations`), so "which ingredients are banned in Norway" and "what's Sodium Nitrite's status everywhere" are both single-query answers.
- **Alternatives** point back into the same `ingredients` table where possible (self-referencing FK), falling back to free text (`alt_product_name`) only when no catalogued replacement exists yet — keeping the graph connected as the knowledge base grows.
- **Allergens** are a shared reference list (`allergens`) linked via junction (`ingredient_allergens`) with per-relationship `severity`, rather than a free-text allergen column on `ingredients`.

This structure is what makes the AI Health Summary generation *reliable*: the LLM orchestrator queries structured rows (risk level, health effects, country status, allergens) as grounding context rather than re-deriving facts from scratch on every scan.

---

## 13. Vector Search Design

- **Embedding tables:** `ingredient_embeddings` (1:1 with `ingredients`) and `product_embeddings` (1:1 with `products`), each storing `vector(1536)` — sized for common embedding models (OpenAI `text-embedding-3-large` / Voyage-family); adjust the dimension to match whichever embedding model is actually deployed.
- **Why separate tables, not a column on `ingredients`/`products`:** keeps the hot, frequently-updated base tables lean (embeddings are ~6KB each at 1536 dimensions) and lets embeddings be regenerated independently (e.g. after switching embedding models) without touching the source-of-truth row.
- **Embedding generation:** triggered by a backend job (Edge Function or scheduled worker) whenever an ingredient/product's descriptive text changes — `source_text` is stored alongside the vector specifically so regeneration is deterministic and auditable (you can always see exactly what text produced a given embedding).
- **Similarity search:** `search_ingredients_semantic(query_embedding, match_count)` (see `functions/01_functions.sql`) wraps the `<=>` cosine-distance operator behind a stable SQL function, callable via `supabase.rpc('search_ingredients_semantic', ...)` from the client — this is how a future Voice Assistant answers "what should I avoid if I'm sensitive to sulfites" without exact keyword matching.
- **Semantic search vs. full-text search:** the two are complementary, not redundant — `pg_trgm`/`tsvector` (§9) handle exact/fuzzy *lexical* matching (typos, partial names), while pgvector handles *conceptual* matching (a user's natural-language question that shares no keywords with the ingredient's stored description).
- **Indexing:** HNSW indexes (§9) — created eagerly in the migration set for a working fresh deploy, with an explicit note to re-tune/rebuild once real embedding volume exists.

---

## 14. Scan History Design

The `scans` table plus its two 1:1 satellites (`safety_scores`, `ai_summaries`) together store everything the Scan History and Dashboard screens need:

| Requirement | Stored as |
|---|---|
| Original input | `products.raw_ingredient_text` (verbatim paste/OCR text) + `product_ingredients.raw_text` per matched fragment |
| AI output | `ai_summaries.summary_text`, `.allergy_warning` |
| Safety score | `safety_scores.score`, `.verdict`, `.ingredient_count`, `.flagged_count` |
| Analysis date | `scans.scanned_at` |
| AI version | `scans.ai_model_version`; `ai_summaries.model_name` + `.prompt_version`; `safety_scores.scoring_version` |

Splitting these into three tables (rather than one wide `scans` table) means the scoring algorithm and the AI-summary prompt can each version and evolve independently — re-running scoring v2 against historical scans doesn't touch the immutable AI narrative that was actually shown to the user at the time, preserving historical accuracy of "what the user was told."

---

## 15. Product Comparison Design

`comparisons` stores exactly the required fields — `scan_a_id`, `scan_b_id` (each resolving through `scans` → `products`/`safety_scores` for full product context), `winner` (enum: `product_a` / `product_b` / `tie`), `recommendation_text` (the AI-generated plain-language verdict), and `compared_at`. Comparisons reference **scans**, not products directly, so a comparison always reflects the exact safety score/AI summary that existed *at comparison time* — even if the underlying ingredient knowledge base is later updated (e.g. a new regulation changes an ingredient's risk level), historical comparisons remain a faithful record of what was actually shown to the user.

---

## 16. Database Flow

See **[`database/docs/data_flow.md`](./database/docs/data_flow.md)** for full Mermaid sequence diagrams covering: User Registration, Ingredient Analysis (Scan), Product Comparison, and Scan History Retrieval.

---

## 17. Normalization

| Form | Definition applied | Example |
|---|---|---|
| **1NF** | Every column holds a single atomic value; no repeating groups. | `ingredients.aliases` is the one deliberate exception — a Postgres `array` is still considered 1NF-compliant in practice since it's a single, well-typed, indexable value (not a comma-joined string), and modeling it as a satellite table would be pure overhead for a short, rarely-queried list. |
| **2NF** | Every non-key attribute is fully functionally dependent on the *whole* primary key (relevant only to composite-key tables). | `ingredient_allergens (ingredient_id, allergen_id) → severity, note` — `severity` depends on the *combination* of ingredient+allergen (a given ingredient might be severe for one allergen category and mild for another), not on either key alone. |
| **3NF** | No transitive dependencies — non-key attributes depend on the key, the whole key, and nothing but the key. | `ingredients` does **not** store `category_name` (only `category_id`) — category name lives solely in `ingredient_categories`, avoiding update anomalies if a category is renamed. |
| **BCNF** | Every determinant is a candidate key. | `ingredient_country_regulations`: the natural key `(ingredient_id, country_id)` uniquely determines `status`, and no other attribute in the table determines any other — satisfied by the `unique (ingredient_id, country_id)` constraint. |

**Deliberate denormalization (and why it's safe):** `scan_dashboard_view` and `ingredient_full_detail_view` (§ views) join across 5+ normalized tables to produce a flattened read shape — this is denormalization *at the view layer only*. The underlying tables remain fully normalized; the view is regenerated from source on every query (or refreshed on a schedule for the one `MATERIALIZED VIEW`, `admin_daily_metrics`), so there is no duplicated-data integrity risk, only a performance/read-convenience trade-off.

---

## 18. Performance Optimization

- **Partitioning:** `analytics_events` is range-partitioned by month (`schema/11_..._module.sql`) — the only table expected to grow fast enough to need it. `functions/01_functions.sql` includes `create_next_analytics_partition()`, intended to run monthly via `pg_cron`.
- **Materialized views:** `admin_daily_metrics` precomputes scan-volume/risk aggregates so the Admin Dashboard never runs a live `GROUP BY` over the entire `scans` table; refreshed nightly via `REFRESH MATERIALIZED VIEW CONCURRENTLY` (requires the unique index already defined on `metric_date`).
- **Caching:** `admin_dashboard_metrics_cache` (key/date/JSONB) is a secondary, even-cheaper cache for ad-hoc dashboard widgets that don't warrant a full materialized view; reference data (`countries`, `allergens`, `languages`) is intended to be cached client-side (~195/~15/~10 rows respectively — effectively static).
- **Query optimization:** the generated/stored `tsvector` (`ingredients.search_vector`) avoids recomputing full-text vectors per query; the `scan_dashboard_view` avoids 4–5 round trips becoming one; every hot foreign key has a covering index (§9) specifically so Postgres's planner never falls back to a sequential scan on the tables expected to hold millions of rows (`scans`, `product_ingredients`, `ingredients`).
- **Connection pooling:** use Supabase's built-in Supavisor (PgBouncer-compatible) pooler in **transaction mode** for serverless/edge-function client connections (short-lived, high concurrency) and **session mode** only for migration tooling that needs prepared statements or advisory locks.
- **Pagination:** every "list" query (Scan History, Comparison list, Notifications) is designed around the composite `(user_id, created_at/scanned_at desc)` indexes (§9) for efficient **keyset pagination** (`WHERE scanned_at < $last_seen ORDER BY scanned_at DESC LIMIT 20`) rather than `OFFSET`-based pagination, which degrades badly past a few thousand rows.

---

## 19. Backup Strategy

Full runbook in **[`database/backups/BACKUP_STRATEGY.md`](./database/backups/BACKUP_STRATEGY.md)** — summary: Supabase-managed daily snapshots + continuous WAL/PITR as the primary mechanism, supplemented by a nightly `pg_dump` logical export copied to cold object storage, with a documented RPO ≤5 min / RTO ≤1 hr disaster-recovery target.

---

## 20. Migration Strategy

- **Database versioning:** every schema change is a new, timestamp-prefixed file under `database/migrations/` (Supabase CLI convention: `YYYYMMDDHHMMSS_description.sql`), applied strictly in filename order. Already-applied migrations are **never edited** — a correction ships as a new forward migration.
- **Schema migration workflow:** author the change in the relevant `database/schema/<module>.sql` file first (so the "current state by module" documentation stays accurate), then create the corresponding timestamped file in `database/migrations/` with the actual `ALTER`/`CREATE` statements, then run `supabase db push` (or `psql` against each environment in order: local → staging → production).
- **Rollback:** Postgres DDL is largely irreversible in the general case (e.g. a dropped column's data is gone), so the convention here is **forward-only migrations** — a "rollback" is itself a new migration that reverses the previous change where structurally possible, restoring from a pre-migration backup (§19) where it isn't.
- **Future updates:** the modular `schema/` file-per-domain structure means adding a wholly new feature (e.g. a hypothetical "Meal Planning" module) is a new file + new migration, touching zero existing files — the additive-first design principle (§1) in practice.

---

## 21. Sample Records

Representative seed rows for every core table are in **`database/seeds/01_seed_data.sql`** (reference data: countries, allergens, languages) and its second section (realistic sample ingredients — Sodium Nitrite/Citric Acid/Tartrazine — with health effects, country regulations, a sample brand/product, and matched `product_ingredients`). `user_profiles`/`scans`/`safety_scores` sample rows are intentionally **not** hardcoded there, since `user_profiles.id` must reference a real `auth.users` row created through Supabase Auth — create a test user first (Dashboard or `supabase auth` CLI), then insert dependent sample rows using that real UUID.

---

## 22. SQL Schema

The complete, executable `CREATE TABLE` statements (with constraints, indexes, foreign keys, and inline comments) are provided as real files, not just excerpted here — see **`database/schema/`** (by module) and **`database/migrations/`** (deployment order). A single concatenated reference copy is also provided at **`database/schema/full_schema_consolidated.sql`** for search/diff convenience.

---

## 23. Folder Structure

```
database/
├── schema/       # Per-module CREATE TABLE source of truth (12 files, dependency-ordered)
├── migrations/   # Sequential, timestamped deployment files (19 files — this is what runs)
├── seeds/        # Reference data + realistic sample records
├── policies/     # Row Level Security policies (all 38 tables)
├── triggers/     # updated_at maintenance + audit-log triggers
├── functions/    # RPC business logic: safety scoring, semantic search, stats, partition maintenance
├── views/        # scan_dashboard_view, ingredient_full_detail_view, admin_daily_metrics (materialized)
├── indexes/      # B-tree/FK, full-text, and pgvector indexes (documented separately from schema/)
├── backups/      # Backup/restore/DR runbook
├── docs/         # Mermaid ERD + data-flow diagrams
└── README.md     # How the folders relate + deployment instructions
```

---

## 24. Best Practices

- **Naming convention:** tables and columns are `snake_case`, always singular-domain-plural-table (`ingredients`, not `ingredient`); junction tables are named `parent_child` (`ingredient_allergens`); boolean columns are prefixed `is_`/`has_`; enum types are suffixed by what they classify (`risk_level`, not just `risk`).
- **UUID strategy:** `gen_random_uuid()` (pgcrypto) as the default on every PK — chosen over `uuid_generate_v4()` since `gen_random_uuid()` is built into core Postgres 13+ and needs no extension beyond `pgcrypto`, which Supabase enables by default.
- **Timestamp strategy:** `timestamptz` everywhere, `now()` as the default, application code always converts to the user's local timezone at render time — never store or compare naive `timestamp`.
- **Soft delete:** applied only where historical referential integrity matters (`user_profiles.deleted_at`, `ingredients.deleted_at`) — every query against these tables filters `WHERE deleted_at IS NULL` (enforced in RLS `SELECT` policies, not left to app-layer discipline).
- **Audit trail:** trigger-based (`write_audit_log()`), not application-layer, so it can never be silently skipped by a code path that forgot to log.
- **Triggers:** used sparingly and only for cross-cutting concerns that must never be skipped (`updated_at` maintenance, audit logging) — business logic that's better tested/versioned lives in `functions/`, called explicitly, not hidden in a trigger.
- **Views:** used for read-shape convenience (`scan_dashboard_view`) and for genuinely expensive aggregates (`admin_daily_metrics`, materialized) — never used to bypass RLS (views run with the querying user's permissions by default; `security_invoker` semantics are preserved).
- **Stored procedures/functions:** `plpgsql`/`sql` functions exposed via Supabase RPC for logic that must be consistent regardless of calling client (`calculate_safety_score`, `search_ingredients_semantic`) — kept `STABLE` or `IMMUTABLE` where possible so the query planner can optimize around them.

---

## 25. Final Database Summary

**Advantages:**
- Fully normalized knowledge base eliminates duplicate/contradictory ingredient data as the catalog scales into the tens of thousands of ingredients.
- RLS-first design means the database itself is the authorization boundary — a compromised or buggy client cannot read/write data it shouldn't, independent of application-layer bugs.
- Every future feature in the brief (OCR, Barcode, Voice, Nutrition, Recommendations, Admin, Analytics, Multi-language) has a designed home today — no "future features" require schema surgery on existing tables, only additive migrations.
- pgvector is integrated as a first-class citizen (not bolted on), enabling semantic search without a second search infrastructure.

**Trade-offs:**
- Normalization depth (8 tables just for the ingredient knowledge base) means more joins per read — mitigated via views, but still a conscious cost vs. a flatter, JSONB-heavy alternative design.
- `analytics_events` partitioning requires ongoing operational care (monthly partition creation via `pg_cron`) — a maintenance burden a simpler unpartitioned table wouldn't have, accepted deliberately for the expected write volume.
- Forward-only migrations mean schema mistakes are corrected by new migrations, not edits — slightly more verbose history in exchange for a reliable, replayable audit of every change ever made.

**Future scalability:** designed to comfortably support millions of users (`user_profiles`/`scans` scale linearly with covering composite indexes), millions of products (barcode-deduplicated, partial-unique-indexed), and millions of ingredient records (fully indexed for exact, fuzzy, full-text, and semantic search) without structural changes — only data volume and index/partition tuning change as the system grows.

**Estimated table count:** 38 tables (26 current + 12 future) across 11 modules, plus Supabase-managed `auth.*`/`storage.*` schemas.

**Estimated relationships:** ~45 foreign-key relationships; 9 many-to-many junction tables; 10 one-to-one satellite tables.

**Performance expectations:** sub-10ms indexed point lookups (scan-by-id, ingredient-by-id) and sub-100ms composite-indexed list queries (scan history, comparisons) at millions-of-rows scale on Supabase's standard compute tiers; full-text and trigram search sub-50ms at the ingredient-catalog sizes described in this brief; vector similarity search sub-100ms via HNSW at 100k+ embeddings.
