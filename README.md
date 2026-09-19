# NutriGuard AI

> **AI-Powered Food Ingredient Safety & Regulatory Intelligence Platform**

NutriGuard AI is an intelligent nutritional safety platform that analyzes packaged food ingredient labels to protect consumers from harmful additives, deceptive labeling, and allergens. By pairing a deterministic, database-backed safety scoring engine with large language models (Google Gemini and NVIDIA NIM), NutriGuard AI decodes obscure chemical additives, evaluates regional regulatory compliance across international jurisdictions, flags allergens, and suggests healthier food alternatives.

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [The Solution](#-the-solution)
- [Key Features](#-key-features)
- [AI & Intelligent Analysis Architecture](#-ai--intelligent-analysis-architecture)
- [How It Works](#-how-it-works)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Design](#-database-design)
- [API Architecture & Endpoints](#-api-architecture--endpoints)
- [Security & Trust Architecture](#-security--trust-architecture)
- [Installation & Local Setup](#-installation--local-setup)
- [Environment Variables](#-environment-variables)
- [Running the Project](#-running-the-project)
- [API Documentation & Specification](#-api-documentation--specification)
- [Screenshots & UI Preview](#-screenshots--ui-preview)
- [Live Demo](#-live-demo)
- [Future Improvements](#-future-improvements)
- [Project Status](#-project-status)
- [Author](#-author)

---

## ❗ Problem Statement

Modern grocery shelves are dominated by ultra-processed foods containing complex synthetic additives, emulsifiers, artificial colorants, and preservatives. Consumers face multiple compounding challenges:

1. **Obscure Chemical Naming:** Harmful or controversial substances are frequently listed under unfamiliar chemical synonyms or ambiguous E-numbers (e.g., E102, E250, TBHQ, BHA), concealing their true composition from shoppers.
2. **Conflicting Global Regulations:** An additive legally permitted by the United States FDA may be strictly banned or heavily restricted by the European EFSA, UK FSA, or India's FSSAI due to known health risks (such as Titanium Dioxide / E171, Potassium Bromate, or Red 40).
3. **Hidden Allergens & Sensitivities:** Severe allergens (peanuts, tree nuts, gluten, soy, dairy, sulfites) are often buried inside technical ingredient lists without clear warnings.
4. **Lack of Transparent, Grounded Guidance:** Generic consumer AI chatbots frequently hallucinate nutrition facts, fabricate safety scores, or lack verifiable scientific evidence, creating mistrust when dealing with health-adjacent decisions.

---

## 💡 The Solution

NutriGuard AI bridges the gap between scientific toxicology databases and everyday consumer grocery decisions through a **"Deterministic-First, AI-Second"** architecture:

- **100% Deterministic Safety Scoring:** Ingredient risks, allergen classifications, and numerical safety scores (0–100) are computed strictly from verified database records and reproducible arithmetic algorithms—never hallucinated by generative models.
- **Multijurisdictional Regulatory Intelligence:** Additives are cross-referenced across global authorities (US FDA, EU EFSA, UK FSA, India FSSAI, Health Canada, Japan MHLW) to show whether an ingredient is approved, restricted, or banned.
- **Grounded AI Explanations:** Google Gemini and NVIDIA NIM synthesize complex chemical and toxicological data into human-readable health summaries, positive/negative health findings, and dietary warnings.
- **Actionable Alternatives:** Suggests catalogued, safer alternatives with higher safety scores to empower healthier purchasing choices.

> **Medical Disclaimer:** NutriGuard AI provides educational analysis and nutritional safety information based on publicly available regulatory and scientific literature. It does not provide medical diagnoses, treatment advice, or clinical certifications.

---

## ✨ Key Features

### 🔍 Ingredient Knowledge & Deep Search
- Comprehensive directory of food ingredients, botanical extracts, preservatives, and food dyes.
- Multi-tier matching supporting canonical names, scientific binomials, common trade aliases, and international E-numbers.
- Natural vs. synthetic classification, technological food purposes, and linked toxicological research sources.

### 🛡️ Harmful & Restricted Additive Detection
- Instant identification of high-risk and moderate-risk chemicals (e.g., Sodium Nitrite, BHA/BHT, Tartrazine).
- Cross-referencing against jurisdictional ban lists and permissible daily intake thresholds.

### ⚠️ Batch Allergen Detection
- Automated scanning for major international allergen categories: Milk, Eggs, Fish, Crustacean Shellfish, Tree Nuts, Peanuts, Wheat/Gluten, Soybeans, Sesame, and Sulfites.
- Severity ratings (High, Moderate, Mild) displayed prominently before consumption.

### 📊 Deterministic Safety Score Engine
- Transparent, audit-grade arithmetic deduction scoring on a 0–100 scale.
- Clear verdict thresholds:
  - **Safe (80–100):** Minimal or no flagged additives.
  - **Moderate (55–79):** Contains additives with moderate health concerns or specific regional warnings.
  - **High Risk (0–54):** Contains heavily flagged, high-risk, or banned substances.

### 🌐 Country-Specific Regulatory Insights
- Comparative regulatory intelligence across global jurisdictions:
  - United States (FDA)
  - European Union (EFSA)
  - United Kingdom (FSA)
  - India (FSSAI)
  - Canada (Health Canada)
  - Japan (MHLW)
- View explicit ban statuses, permissible maximum concentrations, and mandatory warning label requirements.

### 🤖 Grounded AI Health Summaries
- Context-aware explanations highlighting key positive traits (e.g., whole foods, natural antioxidants) and negative flags (e.g., artificial colorings, endocrine disruptors).
- Tailored consumption advice and allergy advisories verified through strict output schemas.

### 🔄 Product Comparison
- Side-by-side comparison of two scanned products.
- Automated score differential analysis with deterministic winner selection and AI-generated comparative recommendations.

### 📜 Scan History & Data Export
- Comprehensive user history tracking with cursor-based pagination.
- Instant export of past scans in structured **CSV** and **JSON** formats for offline review.

### 🔐 Full Authentication & Role-Based Access
- Secure authentication powered by Supabase Auth (Email/Password and Google OAuth).
- Role-based authorization (`user`, `admin`, `super_admin`) protecting administrative metrics and ingredient database management.

### 🎨 Modern UI with Internationalization
- Intuitive, accessible UI built with React 18, Tailwind CSS, and Lucide icons.
- Light and dark theme toggle.
- Multilingual context support (English, Hindi, and regional localization support).

---

## 🧠 AI & Intelligent Analysis Architecture

NutriGuard AI implements an enterprise-grade, multi-stage AI pipeline designed around **zero hallucination of facts**:

```
Raw Ingredient Text
        │
        ▼
[ Security Layer: Input Sanitizer & Prompt Injection Guard ]
        │
        ▼
[ Stage 1: Parsing & Normalization ]
        ├── Exact Match (Postgres ILIKE)
        ├── Alias Match (Postgres array contains)
        ├── Fuzzy Matching (pg_trgm trigram similarity)
        └── Semantic Fallback (pgvector + Gemini Embeddings)
        │
        ▼
[ Stage 2: Deterministic Regulatory & Allergen Analysis ]
        ├── Database Regulatory Matrix Lookup
        └── Allergen Cross-Reference
        │
        ▼
[ Stage 3: Deterministic Safety Score Calculator ]
        └── Arithmetic Deduction Formula (LLM-Free)
        │
        ▼
[ Stage 4: Grounded LLM Synthesis & Explanation ]
        ├── Primary Provider: Google Gemini (gemini-3.5-flash)
        └── Failover Provider: NVIDIA NIM (meta/llama-3.1-70b-instruct)
        │
        ▼
[ Stage 5: Schema & Grounding Validation ]
        └── Zod Validation + Hallucination / Consistency Checks
```

### 1. Dual-Provider LLM Orchestration with Failover
- **Primary LLM:** Google Gemini (`gemini-3.5-flash` via `@google/generative-ai`) optimized for rapid response times and structured JSON generation.
- **Secondary Failover:** NVIDIA NIM (`meta/llama-3.1-70b-instruct` via OpenAI-compatible SDK) as an automatic failover if the primary provider encounters network timeouts, rate limits, or service outages.
- **Failover Logic:** Encapsulated inside `LlmOrchestrationClient`. Sub-agents receive validated outputs regardless of which provider fulfilled the request.
- **Deterministic Fallback:** If both LLM providers are unreachable or output fails validation, the system falls back to a template-based summary—guaranteeing that scans complete reliably without failing the user experience.

### 2. Multi-Tier Knowledge Retrieval
Before any LLM prompt is constructed, ingredients are resolved against the database using a 4-tier hierarchy:
1. **Tier 1 (Exact Match):** Case-insensitive string match against canonical ingredient names (`matchConfidence: 1.0`).
2. **Tier 2 (Alias Match):** Match against known chemical, commercial, or regional synonyms (`matchConfidence: 0.95`).
3. **Tier 3 (Trigram Fuzzy Match):** PostgreSQL `pg_trgm` similarity search (threshold `>= 0.35`) for typos and label variations.
4. **Tier 4 (Vector Semantic Match):** Embedding generation via `gemini-embedding-001` queried against `ingredient_embeddings` using `pgvector` cosine similarity (`<=>` distance `<= 0.30`).

### 3. Dedicated Sub-Agents
- **`IngredientMatchingAgent`:** Parses raw comma- and newline-delimited ingredient labels, removes extraneous formatting, and maps fragments to database entities.
- **`SummaryAgent`:** Consumes established facts (matched ingredients, risk levels, allergen tags, safety scores) and produces structured explanations. It is strictly constrained by prompt rules never to contradict the calculated score.
- **`ComparisonAgent`:** Analyzes two completed scans to generate trade-off evaluations, with an enforced guardrail that automatically aligns the declared "winner" with the higher deterministic safety score.

### 4. AI Security & Guardrails
- **Prompt Injection Defense:** `checkPromptInjection()` screens inputs for system override attempts, jailbreaks, roleplay instructions, and delimiter attacks.
- **Input Sanitization:** Strips control characters, non-printable unicode, and excessive character lengths prior to model ingestion.
- **Response Validation:** Validates model responses against strict Zod schemas and validates that the model does not introduce non-existent ingredients.
- **In-Memory Caching:** LRU cache for prompt completions (`prompt-cache.ts`) and vector embeddings (`embedding-cache.ts`) to minimize latency and external API costs.

---

## ⚙️ How It Works

```
                     ┌───────────────────────────┐
                     │   User / Web Frontend     │
                     └─────────────┬─────────────┘
                                   │  1. POST /api/v1/analysis
                                   ▼
                     ┌───────────────────────────┐
                     │     Hono Backend API      │
                     └─────────────┬─────────────┘
                                   │  2. Sanitize & Screen
                                   ▼
                     ┌───────────────────────────┐
                     │   Prompt Injection Guard  │
                     └─────────────┬─────────────┘
                                   │  3. Multi-tier Query
                                   ▼
                     ┌───────────────────────────┐
                     │ Postgres / pgvector DB    │
                     │ (Exact / Trigram / Vector)│
                     └─────────────┬─────────────┘
                                   │  4. Enrich Facts
                                   ▼
       ┌───────────────────────────────────────────────────────┐
       │             Deterministic Engines                     │
       │  • Allergen Detection Service                         │
       │  • Country Regulatory Lookup Service                  │
       │  • Safety Score Calculator (Base 100 - Deductions)    │
       └───────────────────────────┬───────────────────────────┘
                                   │  5. Pass Grounded Context
                                   ▼
       ┌───────────────────────────────────────────────────────┐
       │             AI Orchestrator                           │
       │  • Google Gemini (Primary)                            │
       │  • NVIDIA NIM / Llama 3.1 70B (Failover)              │
       │  • Zod Response Validator                             │
       └───────────────────────────┬───────────────────────────┘
                                   │  6. Persist & Respond
                                   ▼
                     ┌───────────────────────────┐
                     │   Full Dashboard Result   │
                     │  (Score, Risks, Summary)  │
                     └───────────────────────────┘
```

1. **Submission:** The user enters an ingredient list via text paste or manual input.
2. **Sanitization:** The backend cleans the input and checks for adversarial prompt injection patterns.
3. **Retrieval:** Ingredients are normalized, extracted, and resolved against the database using exact, alias, trigram, and vector similarity search.
4. **Deterministic Analysis:** Risk levels, regulatory bans, and allergens are assembled; the safety score (0–100) is deterministically calculated.
5. **AI Synthesis:** Structured facts are injected into prompt templates. Gemini (or NVIDIA NIM failover) formats the findings into plain-language summaries.
6. **Delivery:** The structured payload is stored in PostgreSQL and delivered to the frontend dashboard.

---

## 🏗️ System Architecture

| Layer | Component | Description |
|---|---|---|
| **Client Layer** | Single-Page Application | React 18 SPA bundled with Vite, featuring responsive views, client-side routing, and Tailwind styling. |
| **API Layer** | Hono Framework | High-performance, lightweight TypeScript server running on Node.js with built-in route modularity and Zod validation. |
| **Data Layer** | Supabase & PostgreSQL | Relational storage with Drizzle ORM, Row Level Security (RLS), GIN full-text search, and `pgvector` extensions. |
| **AI Layer** | Multi-Model Orchestration | Gemini 3.5 Flash + NVIDIA NIM Llama 3.1 70B with automatic fallback, embedding generation, and prompt injection guards. |
| **Auth Layer** | Supabase Auth | Identity management with JWT verification, session management, and role-based access control. |

---

## 💻 Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 18 (TypeScript) | Core user interface library |
| **Build Tool** | Vite 5 | Fast development server and production bundler |
| **Frontend Styling** | Tailwind CSS 3.4 | Utility-first responsive design tokens and dark mode |
| **UI Components & Icons** | Lucide React | Clean, accessible iconography |
| **Data Visualization** | Recharts | Risk distribution and score visualization charts |
| **State & Data Fetching**| TanStack React Query v5 | Server state management, caching, and polling |
| **Form Handling** | React Hook Form + Zod | Type-safe form validation |
| **Backend Framework** | Hono 4.6 (`@hono/node-server`) | Ultra-lightweight, high-speed TypeScript API server |
| **Runtime Environment** | Node.js (>= 22.0.0) | Server-side JavaScript runtime |
| **Database & ORM** | PostgreSQL + Drizzle ORM | Relational schema, migrations, type-safe queries |
| **Postgres Driver** | `postgres` (postgres-js) | Fast PostgreSQL client for Node.js |
| **Vector Database** | `pgvector` (PostgreSQL extension) | Vector similarity storage and cosine distance search |
| **Full-Text & Fuzzy** | `pg_trgm`, `tsvector` (GIN) | Fast trigram fuzzy search and text search |
| **AI / LLM (Primary)** | Google Gemini (`gemini-3.5-flash`) | Primary model for structured summary generation |
| **AI / LLM (Failover)**| NVIDIA NIM (`llama-3.1-70b-instruct`)| High-throughput secondary model failover |
| **Embeddings** | `gemini-embedding-001` | Semantic text embedding generation |
| **Authentication** | Supabase Auth (`@supabase/supabase-js`)| OAuth, JWT tokens, user lifecycle management |
| **Security & Validation**| Zod, Envalid, Jose | Strict schema validation, JWT verification, env typing |
| **Logging** | Pino & Pino-Pretty | Structured JSON logging with development formatting |
| **Testing** | Vitest | Unit and integration test suite |

---

## 📁 Project Structure

```
NutriGuard AI/
├── docs/                               # Project documentation
│   ├── ARCHITECTURE.md                 # System architecture documentation
│   └── SRS.md                          # Software Requirements Specification
│
├── nutriguard-api-spec/                # Comprehensive API Specification Package
│   ├── docs/
│   │   └── sequence-diagrams.md        # Mermaid diagrams (Login, Analysis, Comparison, History)
│   ├── openapi/
│   │   └── openapi.yaml                # OpenAPI 3.1 schema specification (63 endpoints)
│   ├── postman/
│   │   └── NutriGuard-AI.postman_collection.json # Ready-to-import Postman collection
│   ├── NutriGuard-AI-API-Specification.md # Full 28-section technical API specification
│   └── README.md                       # API spec package documentation
│
├── nutriguard-backend/                 # Node.js + Hono Backend Service
│   ├── src/
│   │   ├── ai/                         # AI orchestration subsystem
│   │   │   ├── agents/                 # IngredientMatching, Summary, Comparison agents
│   │   │   ├── cache/                  # In-memory LRU prompt and embedding caches
│   │   │   ├── clients/                # Gemini, NVIDIA NIM, and Orchestration clients
│   │   │   ├── embeddings/             # Embedding and vector-store services (pgvector)
│   │   │   ├── monitoring/             # AI latency, token, and workflow loggers
│   │   │   ├── prompts/                # Versioned prompt templates
│   │   │   ├── retrievers/             # Knowledge retriever & prompt context builder
│   │   │   ├── schemas/                # Zod schemas for AI outputs
│   │   │   ├── security/               # Input sanitizer & prompt injection guard
│   │   │   ├── validators/             # Response validator & consistency checks
│   │   │   └── workflows/              # AnalysisWorkflow & ComparisonWorkflow orchestrators
│   │   ├── database/
│   │   │   ├── client.ts               # Drizzle database connection
│   │   │   ├── migrate.ts              # Drizzle migration runner
│   │   │   ├── seed.ts                 # Database seeder
│   │   │   └── schema/                 # 8 Drizzle schema files (users, ingredients, etc.)
│   │   ├── middleware/                 # Auth, CORS, Rate-limit, Request-ID, Security-headers
│   │   ├── modules/                    # Domain feature modules
│   │   │   ├── admin/                  # Admin metrics and user management
│   │   │   ├── allergens/              # Allergen lookup and scan detection
│   │   │   ├── alternatives/           # Safer alternative recommendation engine
│   │   │   ├── analysis/               # Scan lifecycle (POST /analysis, GET /scans/:id)
│   │   │   ├── auth/                   # Registration, login, session, RBAC
│   │   │   ├── barcode/                # Future barcode scanner stub (501)
│   │   │   ├── comparison/             # Product comparison operations
│   │   │   ├── country-regulations/    # Regulatory lookup across jurisdictions
│   │   │   ├── health/                 # Health check endpoints
│   │   │   ├── ingredients/            # Search, detail, health effects, categories
│   │   │   ├── notifications/          # Notification dispatch and management
│   │   │   ├── ocr/                    # Future OCR upload stub (501)
│   │   │   ├── safety-score/           # Deterministic arithmetic deduction engine
│   │   │   ├── scan-history/           # Cursor-paginated history and CSV/JSON export
│   │   │   └── voice/                  # Future voice assistant stub (501)
│   │   ├── shared/                     # Config, Envalid env, constants, errors, logger, utils
│   │   ├── app.ts                      # Hono application routing
│   │   └── server.ts                   # HTTP server entrypoint
│   ├── tests/                          # Vitest unit and integration tests
│   ├── .env.example                    # Backend environment configuration template
│   └── package.json
│
├── nutriguard-db/                      # Database Schema, Migrations & Scripts
│   ├── database/
│   │   ├── backups/                    # Backup and disaster recovery procedures
│   │   ├── docs/                       # ERD diagrams and documentation
│   │   ├── functions/                  # Stored procedures & RPC functions
│   │   ├── indexes/                    # B-tree, GIN full-text, and HNSW vector indexes
│   │   ├── migrations/                 # Timestamped SQL migrations
│   │   ├── policies/                   # Row Level Security (RLS) policies
│   │   ├── schema/                     # Modular SQL table definitions
│   │   ├── seeds/                      # Seed data (countries, allergens, ingredients)
│   │   ├── triggers/                   # Automatic timestamp and audit triggers
│   │   └── views/                      # Dashboard materialized views and queries
│   ├── NutriGuard-AI-Database-Design-Document.md # 40KB+ complete DB design doc
│   └── README.md
│
├── nutriguard-frontend/                # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── api/                        # Typed HTTP API client & resource methods
│   │   ├── components/                 # Shared UI components (SafetyScoreCard, Navbar, etc.)
│   │   │   └── ui/                     # Base primitives (Button, Input, Card, Badge)
│   │   ├── context/                    # AuthContext, ThemeContext, LanguageContext
│   │   ├── data/                       # Fallback mock data and types
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── lib/                        # Supabase client and styling helpers
│   │   ├── pages/                      # Application routes and pages
│   │   │   ├── auth/                   # Login, Signup, ForgotPassword, OtpVerification
│   │   │   ├── AnalyzingLoading.tsx    # Staged progress loading state
│   │   │   ├── Comparison.tsx          # Side-by-side product comparison view
│   │   │   ├── Dashboard.tsx           # Full analysis results dashboard
│   │   │   ├── ErrorPages.tsx          # 404, 500, Network error screens
│   │   │   ├── FutureFeature.tsx       # Placeholder pages for OCR / Barcode / Voice
│   │   │   ├── HelpSources.tsx         # Regulatory scientific sources & documentation
│   │   │   ├── History.tsx             # Scan history with filtering and CSV/JSON export
│   │   │   ├── Home.tsx                # Ingredient input & scan submission
│   │   │   ├── IngredientDetail.tsx    # Deep dive on individual ingredients
│   │   │   ├── Landing.tsx             # Marketing landing page
│   │   │   └── Profile.tsx             # User profile, theme, and language preferences
│   │   ├── App.tsx                     # React Router definition
│   │   └── main.tsx                    # Application mount
│   ├── .env.example                    # Frontend environment configuration template
│   └── package.json
│
├── scripts/                            # Automation and background process scripts
│   ├── start-daemon.mjs                # Starts backend & frontend detached in background
│   └── stop-daemon.mjs                 # Gracefully terminates running background daemons
│
├── NutriGuard-AI-Design-Document.md    # UI/UX specification & design document
├── package.json                        # Root package runner (concurrently scripts)
├── start.sh                            # Shell script to start background services
├── stop.sh                             # Shell script to stop background services
└── README.md                           # Main repository documentation (this file)
```

---

## 🗄️ Database Design

NutriGuard AI utilizes a robust PostgreSQL schema managed via both hand-authored modular SQL scripts and Drizzle ORM definitions:

### Core Tables
1. **`user_profiles`:** Extends `auth.users` 1:1 with user role (`user`, `admin`, `super_admin`), display name, dietary preferences, and account status.
2. **`ingredients`:** Authoritative ingredient records including canonical name, scientific name, E-number, description, technological purpose, default risk level (`safe`, `moderate`, `high`, `unknown`), and origin flags (`is_natural`, `is_synthetic`).
3. **`ingredient_aliases`:** Synonyms, commercial names, and alternate spellings mapped to canonical ingredient IDs.
4. **`ingredient_categories` / `ingredient_category_mappings`:** Functional taxonomy (e.g., Preservatives, Emulsifiers, Artificial Sweeteners, Colorants).
5. **`ingredient_health_effects`:** Documented health impacts, target organ systems, and associated severity levels.
6. **`countries` & `country_regulations`:** Country profiles (ISO-3166) and additive regulatory records (approval status: `approved`, `restricted`, `banned`; max permissible limits; mandatory label warnings).
7. **`allergens` & `ingredient_allergens`:** Predefined allergen taxonomies and mapping tables for instant allergen cross-referencing.
8. **`safer_alternatives`:** Curated mappings of controversial ingredients to cleaner, healthier substitutes with health rationales.
9. **`products` & `product_ingredients`:** Scanned product metadata (name, brand, raw ingredient label) and normalized ingredient junction records.
10. **`scans`:** Scan execution records with execution status (`pending`, `processing`, `completed`, `failed`), input source, and user references.
11. **`safety_scores`:** Deterministically computed score (0–100), risk verdict, flagged ingredient count, and detailed deduction breakdowns.
12. **`ai_summaries`:** LLM-generated health summaries, positive/negative findings, and personalized dietary warnings.
13. **`ingredient_embeddings`:** High-dimensional vector embeddings (`vector(3072)` / `vector(768)`) for semantic similarity retrieval.
14. **`comparisons`:** Multi-product comparative analysis records storing side-by-side metrics and recommendations.
15. **`notifications` & `audit_logs`:** In-app notification queue and immutable system audit logging.

### Advanced Database Capabilities
- **Row Level Security (RLS):** Enabled on all tables. Users are restricted to querying their own scans, profiles, and comparisons; public reference tables (ingredients, regulations) are read-only.
- **Full-Text & Trigram Indexing:** Accelerated ingredient search via GIN indexes on `name` using `gin_trgm_ops` and `to_tsvector('english', name)`.
- **HNSW / IVFFlat Vector Indexing:** Fast cosine distance similarity indexing on the `ingredient_embeddings` table.
- **Reporting Views:** Pre-joined `scan_dashboard_view` for high-throughput single-query dashboard hydration.

---

## 🔌 API Architecture & Endpoints

The backend exposes a clean REST API versioned at `/api/v1`. The complete API is fully documented in an OpenAPI 3.1 specification (`nutriguard-api-spec/openapi/openapi.yaml`).

### Key Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/v1/auth/register` | Register new user account | No |
| `POST` | `/api/v1/auth/login` | Authenticate user & receive JWT | No |
| `POST` | `/api/v1/auth/refresh` | Refresh expired access token | No |
| `GET`  | `/api/v1/auth/session` | Get active user profile & session | Yes |
| `POST` | `/api/v1/analysis` | Submit ingredient text for analysis | Yes |
| `GET`  | `/api/v1/scans` | List scan history (cursor-paginated) | Yes |
| `GET`  | `/api/v1/scans/:id` | Retrieve full scan analysis dashboard | Yes |
| `DELETE`| `/api/v1/scans/:id` | Delete scan from user history | Yes |
| `GET`  | `/api/v1/scans/export` | Export history as CSV or JSON | Yes |
| `GET`  | `/api/v1/ingredients` | Search ingredients (exact, alias, trigram) | Yes |
| `GET`  | `/api/v1/ingredients/:id` | Retrieve detailed ingredient profile | Yes |
| `GET`  | `/api/v1/country-regulations/:id` | Get regulatory status across countries | Yes |
| `GET`  | `/api/v1/alternatives/:id` | Fetch healthier ingredient alternatives | Yes |
| `POST` | `/api/v1/comparisons` | Compare two completed scans | Yes |
| `GET`  | `/api/v1/comparisons/:id` | Get detailed comparison result | Yes |
| `GET`  | `/api/v1/notifications` | List user notifications | Yes |
| `PATCH`| `/api/v1/notifications/:id/read`| Mark notification as read | Yes |
| `GET`  | `/api/v1/admin/dashboard/metrics` | Fetch system metrics (Admin only) | Admin |
| `GET`  | `/api/v1/health` | Service health status & uptime | No |

---

## 🔒 Security & Trust Architecture

- **Stateless JWT Verification:** Fast-path token authentication using `jose` to verify Supabase-issued tokens locally via JWT secret or JWKS without requiring a network round-trip per request.
- **Fail-Fast Environment Validation:** Uses `envalid` to validate and type-check all environment variables during boot. The application refuses to start with missing or malformed keys.
- **Database Row Level Security (RLS):** Every database table operates under default-deny policies, ensuring tenant isolation at the database layer.
- **Dual-Layer RBAC:** Role-based checks (`user`, `admin`, `super_admin`) are enforced in Hono API middleware and reaffirmed by PostgreSQL policies.
- **Prompt Injection Defense:** Dedicated algorithmic checks (`prompt-injection.guard.ts`) detect delimiter hijacking, roleplay jailbreaks, and injection attempts.
- **Input Sanitization:** Strips control characters, non-printable unicode, and excessive character lengths (`input-sanitizer.ts`).
- **Rate Limiting:** Sliding-window in-memory rate limiter configured via environment variables to guard against brute-force and DoS attacks.
- **Strict CORS & Security Headers:** Configurable origin allowlists, content-type nosniff, frame-options deny, and HSTS headers.

---

## 🚀 Installation & Local Setup

### Prerequisites
- **Node.js:** `>= 22.0.0`
- **npm:** `>= 10.0.0`
- **Supabase Account / Local PostgreSQL:** A running Supabase project (or PostgreSQL instance with `pgvector` and `pg_trgm` enabled).
- **API Keys:** Google Gemini API Key and NVIDIA NIM API Key.

### 1. Clone the Repository
```bash
git clone https://github.com/snehiljaiswal/NutriGuardAI.git
cd NutriGuardAI
```

### 2. Install Dependencies
Install dependencies across the root workspace and subprojects:
```bash
# Install root orchestration dependencies
npm install

# Install backend dependencies
cd nutriguard-backend && npm install && cd ..

# Install frontend dependencies
cd nutriguard-frontend && npm install && cd ..
```

---

## 🔑 Environment Variables

### Backend Configuration (`nutriguard-backend/.env`)
Copy `nutriguard-backend/.env.example` to `nutriguard-backend/.env` and configure:

```env
# Application Settings
NODE_ENV=development
PORT=3000
API_BASE_PATH=/api/v1
LOG_LEVEL=debug

# Supabase Auth & Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
DATABASE_URL=postgresql://postgres:password@localhost:5432/nutriguard
DATABASE_POOL_MAX=10

# AI Provider Keys
GEMINI_API_KEY=your-google-gemini-api-key
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
NVIDIA_API_KEY=your-nvidia-nim-api-key
AI_PRIMARY_MODEL=gemini-3.5-flash
AI_SECONDARY_MODEL=meta/llama-3.1-70b-instruct

# Security & CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://nutriguard.ai
RATE_LIMIT_WINDOW_MS=300000
RATE_LIMIT_MAX_REQUESTS=300

# Feature Flags (Future Modules)
FEATURE_OCR_ENABLED=false
FEATURE_BARCODE_ENABLED=false
FEATURE_VOICE_ENABLED=false
```

### Frontend Configuration (`nutriguard-frontend/.env`)
Copy `nutriguard-frontend/.env.example` to `nutriguard-frontend/.env` and configure:

```env
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Supabase Public Endpoint (Safe for client exposure)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🏃 Running the Project

### Database Setup & Migrations
Run the database migrations and seed default ingredient and regulatory data:

```bash
cd nutriguard-backend
npm run db:migrate
npm run db:seed
cd ..
```

### Option A: Run Concurrently (Interactive Terminal)
Launch both the backend API and frontend development server with a single command from the project root:

```bash
npm run dev
```
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3000`
- **API Health Check:** `http://localhost:3000/api/v1/health`

### Option B: Run as Detached Background Daemons
To run services in the background with persistent logging to `.logs/`:

```bash
# Start background services
./start.sh
# or: npm run start:bg

# Stop background services
./stop.sh
# or: npm run stop:bg
```

### Option C: Run Individually
In separate terminal tabs:

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

### Testing & Code Quality
```bash
# Backend unit & integration tests
cd nutriguard-backend
npm run test
npm run test:coverage
npm run typecheck
npm run lint

# Frontend type check & build verification
cd ../nutriguard-frontend
npm run build
```

---

## 📖 API Documentation & Specification

The repository includes complete OpenAPI 3.1 specifications, interactive client collections, and architectural sequence diagrams:

- **[Full API Specification Document](nutriguard-api-spec/NutriGuard-AI-API-Specification.md):** 28-section comprehensive document detailing request/response contracts, status codes, and security policies.
- **[OpenAPI 3.1 Specification](nutriguard-api-spec/openapi/openapi.yaml):** Machine-readable YAML definition covering all 63 endpoints and schemas.
- **[Postman Collection](nutriguard-api-spec/postman/NutriGuard-AI.postman_collection.json):** Import-ready Postman collection with configured environments and variables.
- **[API Sequence Diagrams](nutriguard-api-spec/docs/sequence-diagrams.md):** Detailed Mermaid diagrams illustrating authentication, analysis workflows, product comparisons, and history queries.

To inspect the API interactively using Swagger UI:
```bash
npx swagger-ui-watcher nutriguard-api-spec/openapi/openapi.yaml
```

---

## 📸 Screenshots & UI Preview

| Desktop Dashboard | Ingredient Drill-Down |
|:---:|:---:|
| ![Dashboard Preview](https://placehold.co/600x350/0f172a/10b981?text=NutriGuard+AI+Dashboard) | ![Ingredient Detail](https://placehold.co/600x350/0f172a/38bdf8?text=Ingredient+Safety+Analysis) |

| Product Comparison | Mobile View |
|:---:|:---:|
| ![Product Comparison](https://placehold.co/600x350/0f172a/f59e0b?text=Side-by-Side+Comparison) | ![Mobile View](https://placehold.co/300x500/0f172a/10b981?text=Mobile+Scan+View) |

*(Screenshots will be updated upon final cloud staging deployment)*

---

## 🌐 Live Demo

Coming soon.

---

## 🔮 Future Improvements

The following capabilities are architected in the project specifications and gated behind feature flags for future releases:

- [ ] **Optical Character Recognition (OCR) Engine:** Direct camera capture and image upload to automatically extract ingredient text from physical packages (`FEATURE_OCR_ENABLED`).
- [ ] **Barcode Scanner & Catalog Integration:** Instant lookup via UPC/EAN barcodes integrating with OpenFoodFacts and commercial food databases (`FEATURE_BARCODE_ENABLED`).
- [ ] **Voice-Assisted Queries:** Voice interaction and screen-reader audio feedback for visually impaired users (`FEATURE_VOICE_ENABLED`).
- [ ] **Asynchronous Task Queue:** Migration of the synchronous analysis pipeline to a distributed background worker queue (e.g., BullMQ or Redis) for handling large ingredient batches with real-time push updates.
- [ ] **Personalized Dietary Profiles:** Custom user allergen profiles that dynamically adjust safety scores based on individual intolerances (e.g., Celiac, Lactose intolerance, Vegan).

---

## 📊 Project Status

- **Core Application:** Completed.
- **Backend API:** All 15 functional modules fully implemented and integrated.
- **Frontend SPA:** Complete user flows implemented (Landing, Auth, Home, Dashboard, Detail, Compare, History, Profile).
- **Database & Migrations:** Production-ready PostgreSQL schemas, indexes, views, and RLS policies defined.
- **Deployment Status:** Currently prepared for containerized and cloud staging deployment.

---

## 👨‍💻 Author

**Snehil Jaiswal**
- **GitHub:** [@snehiljaiswalsneh](https://github.com/snehiljaiswalsneh)
- **Repository:** [NutriGuardAI](https://github.com/snehiljaiswalsneh/NutriGuardAI)

---

## 📄 License

This repository does not currently contain a public open-source license. All rights reserved by the author.
