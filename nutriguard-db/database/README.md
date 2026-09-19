# NutriGuard AI — Database

Production-ready Supabase/PostgreSQL schema for NutriGuard AI, an AI-powered food ingredient safety analyzer.

See **`../NutriGuard-AI-Database-Design-Document.md`** for the full Database Design Document (ERD, module breakdown, normalization rationale, indexing strategy, security design, performance/backup/migration strategy, and sample records).

## Folder structure

```
database/
├── schema/       # Hand-authored, per-module CREATE TABLE source of truth (read this to understand the model)
├── migrations/   # Sequential, timestamped deployment files — this is what actually runs against Supabase
├── seeds/        # Reference data (countries, allergens, languages) + realistic sample rows
├── policies/     # Row Level Security policies (all tables default-deny; explicit opt-in per table)
├── triggers/     # updated_at maintenance + audit-log triggers
├── functions/    # RPC-callable business logic (safety score calc, semantic search, stats)
├── views/        # Read-model views + one materialized view for admin metrics
├── indexes/      # B-tree, full-text (GIN), and pgvector (HNSW) indexes, documented separately from schema/
├── backups/      # Backup/restore/DR runbook (see BACKUP_STRATEGY.md)
└── docs/         # ERD + data-flow diagrams (Mermaid), sample record reference
```

## Deploying to Supabase

### Option A — Supabase CLI (recommended)

```bash
supabase init                 # if not already a Supabase project
cp database/migrations/*.sql supabase/migrations/
supabase db push               # applies all migrations in order
supabase db seed               # optional: loads seeds/ data (wire seed.sql to source seeds/*.sql)
```

### Option B — psql / SQL editor

Run every file in `migrations/` **in filename order** (they are timestamp-prefixed) against your Supabase project's connection string, then optionally run `seeds/01_seed_data.sql`.

```bash
for f in database/migrations/*.sql; do
  psql "$SUPABASE_DB_URL" -f "$f"
done
```

## Why `schema/` AND `migrations/` both exist

`schema/` is organized **by module** (auth, ingredients, products, history, etc.) so a developer can open one file and understand one part of the domain. `migrations/` contains the exact same statements, concatenated into the **dependency-safe sequential order** Supabase actually needs to run them in (extensions → reference tables → dependent tables → indexes → functions → triggers → views → RLS policies). When the schema evolves, add a new module file under `schema/` **and** a new timestamped file under `migrations/` — never edit an already-applied migration in place.

## Important notes

- **pgvector indexes** (`migrations/..._vector_indexes.sql`) use HNSW and are safe to run on an empty table, but per Supabase/pgvector best practice, re-run `ANALYZE` and consider rebuilding once you have real embedding volume (10k+ rows) for optimal recall.
- **RLS is enabled on every table.** There is no table in this schema that is readable/writable by default — every access path is an explicit policy in `policies/01_rls_policies.sql`.
- **`auth.users` is never duplicated.** `public.user_profiles` extends it 1:1 and is the only table application code should query for user data.
