# NutriGuard AI — API Specification Document
### REST API · v1 · Production-Ready

---

## 1. API Overview

**Purpose:** Expose every NutriGuard AI capability — ingredient knowledge, AI-powered ingredient analysis, safety scoring, allergen/regulation lookups, product comparison, scan history, notifications, and (future) OCR/barcode/voice/recommendations/admin — as a versioned, secure, frontend-agnostic REST API consumable by the React web client today and by additional clients (mobile, admin dashboard, third-party integrations) tomorrow.

**Architecture style:** Cloud-native, API-first, resource-oriented REST over HTTPS, implemented as Supabase Edge Functions (Deno/Node-compatible) sitting in front of Supabase PostgreSQL + Supabase Auth, with an AI Orchestration layer that calls Claude/GPT-5 for analysis/summarization and OpenAI Embeddings + pgvector for semantic search. Designed to be microservice-ready: each module (Auth, Ingredients, Analysis, Products, Comparison, History, Notifications, AI, Admin) is independently deployable as its own Edge Function group with no cross-module runtime coupling.

**REST principles applied:**
- **Resources, not actions**, in URLs (`/scans/{scanId}`, not `/getScan`). The one deliberate exception is `/analysis` (POST) and `/ai/*`, which represent AI *operations* rather than CRUD resources — acceptable and common REST practice for compute-triggering endpoints.
- **Nouns are plural** (`/ingredients`, `/products`, `/scans`).
- **HTTP methods carry meaning:** `GET` (read, safe, idempotent), `POST` (create / trigger a process), `PATCH` (partial update), `PUT` (full replace — not used in this API since no resource here is ever fully replaced wholesale), `DELETE` (remove).
- **Statelessness:** every request carries its own auth (Bearer JWT); no server-side session state.
- **HATEOAS:** not implemented (pragmatic choice — the API is consumed by a small number of known first-party/admin clients, not a generic hypermedia browser); may be reconsidered if third-party integrations are opened up.

**Versioning strategy:** URL path versioning — every endpoint is prefixed `/api/v1`. See §24 for the full deprecation policy.

**Naming convention:**
- `kebab-case` for multi-word path segments (`/reset-password`, `/saved-ingredients`, `/system-logs`).
- `snake_case` for all JSON field names (matches the PostgreSQL column names 1:1, avoiding a translation layer).
- Path parameters are `camelCase` (`{ingredientId}`, `{scanId}`) to visually distinguish them from static path segments.

**Response standards:** every response — success or error — uses one envelope shape (§13), so client code has exactly one shape to parse regardless of endpoint or outcome.

**Error standards:** errors are always returned with `success: false`, a human-readable `message`, and a structured `errors[]` array of `{ code, field, message }` objects — enough for both display-to-user and programmatic branching (§14).

**Authentication strategy:** Supabase Auth-issued JWTs (access + refresh token pair), sent as `Authorization: Bearer <token>`. Public/reference-data endpoints (ingredient lookup, country list, semantic search) explicitly opt out of auth (`security: []` in the OpenAPI spec) since they expose no personal data. Every personal-data or write endpoint requires a valid Bearer token; admin endpoints additionally require a role claim (§16).

---

## 2. API Modules

| Module | Base path | Endpoint count | Notes |
|---|---|---|---|
| Authentication | `/auth/*` | 8 | Register, login, logout, refresh, forgot/reset password, verify email, session |
| User | `/users/*` | 9 | Profile, settings, saved-ingredients watchlist, account deletion, data export |
| Ingredients | `/ingredients`, `/ingredient-categories`, `/countries` | 8 | Search, detail, health effects, regulations, allergens, alternatives, categories |
| Analysis | `/analysis`, `/scans/{id}/*` | 6 | Trigger analysis, safety score, AI summary, recommendations, consumption advice |
| Products | `/products/*` | 7 | CRUD, search, barcode lookup (future), OCR upload (future) |
| Comparison | `/comparisons/*` | 4 | Create/list/get/delete comparisons |
| History | `/scans`, `/scans/export` | 3 (+ shared with Analysis) | Paginated scan history, export |
| Notifications | `/notifications/*` | 4 | List, mark read (single/all), delete |
| AI (agent-facing) | `/ai/*` | 4 | Embeddings, semantic search, knowledge retrieval (RAG), voice query (future) |
| Admin (future) | `/admin/*` | 10 | Dashboard metrics, ingredient/user management, analytics, reports, audit logs |

**Total: 63 endpoints** across 10 modules. Full machine-readable definitions: **`openapi/openapi.yaml`** (OpenAPI 3.1). Importable client: **`postman/NutriGuard-AI.postman_collection.json`**.

---

## 3. Authentication APIs

> Full request/response schemas: `openapi/openapi.yaml` under the `Authentication` tag. Every endpoint below returns the standard envelope (§13).

### POST /api/v1/auth/register
- **Auth required:** No
- **Headers:** `Content-Type: application/json`
- **Request body:** `{ full_name, email, password }`
- **Success:** `201 Created` — account created, verification email sent
- **Errors:** `409` email already registered · `422` validation error
- **Validation:** `full_name` 1–120 chars · `email` valid RFC 5322 · `password` ≥8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 digit

### POST /api/v1/auth/login
- **Auth required:** No
- **Request body:** `{ email, password }`
- **Success:** `200 OK` — `{ access_token, refresh_token, expires_in, user }`
- **Errors:** `401` invalid credentials · `422` validation error

### POST /api/v1/auth/logout
- **Auth required:** Yes
- **Headers:** `Authorization: Bearer <access_token>`
- **Success:** `204 No Content`
- **Errors:** `401` not authenticated

### POST /api/v1/auth/refresh-token
- **Auth required:** No (uses refresh token as credential)
- **Request body:** `{ refresh_token }`
- **Success:** `200 OK` — new `{ access_token, refresh_token, expires_in }`
- **Errors:** `401` refresh token invalid/expired/revoked

### POST /api/v1/auth/forgot-password
- **Auth required:** No
- **Request body:** `{ email }`
- **Success:** `200 OK` — always returned regardless of whether the email exists, to prevent account enumeration
- **Validation:** `email` valid format (existence is never confirmed/denied in the response)

### POST /api/v1/auth/reset-password
- **Auth required:** No (uses reset token as credential)
- **Request body:** `{ reset_token, new_password }`
- **Success:** `200 OK`
- **Errors:** `400` token invalid/expired · `422` password fails policy

### POST /api/v1/auth/verify-email
- **Auth required:** No
- **Request body:** `{ email, otp }` (6-digit numeric)
- **Success:** `200 OK` — returns a fresh token pair (auto-login post-verification)
- **Errors:** `400` OTP invalid/expired

### GET /api/v1/auth/session
- **Auth required:** Yes
- **Success:** `200 OK` — confirms the current token is valid, returns `{ user_id, expires_at }`
- **Errors:** `401` session invalid/expired

---

## 4. Ingredient APIs

### GET /api/v1/ingredients
Search ingredients. **Auth:** No. **Query params:** `q` (free text, matched via full-text + trigram fuzzy search), `risk_level`, `category_id`, `page`, `limit`, `sort`. **Success:** `200` — paginated `Ingredient[]`.

### GET /api/v1/ingredients/{ingredientId}
Full ingredient detail (description, scientific name, purpose, risk level). **Auth:** No. **Errors:** `404` not found.

### GET /api/v1/ingredients/{ingredientId}/health-effects
Documented health effects, ordered for display. **Auth:** No.

### GET /api/v1/ingredients/{ingredientId}/regulations
Per-country regulatory status. **Auth:** No. **Query params:** `country_code` (optional filter).

### GET /api/v1/ingredients/{ingredientId}/allergens
Allergen classifications + severity. **Auth:** No.

### GET /api/v1/ingredients/{ingredientId}/alternatives
Safer-alternative suggestions (catalogued ingredient or free-text product). **Auth:** No.

### GET /api/v1/ingredient-categories
Full category tree. **Auth:** No.

### GET /api/v1/countries
Reference country list (for regulation filters/lookups). **Auth:** No.

---

## 5. AI Analysis APIs

### POST /api/v1/analysis
Triggers the full pipeline: ingredient matching → safety scoring → AI summary generation → allergen detection. **Auth:** Yes. **Request:** `{ product_name?, brand_name?, ingredient_text, input_source }`. **Success:** `202 Accepted` — `{ scan_id, status: "processing" }` (async; poll or subscribe to Realtime). **Errors:** `422` empty/too-long text · `429` AI rate limit.

### GET /api/v1/scans/{scanId}
Full scan result — safety score, AI summary, ingredient breakdown, allergy warning (the Dashboard payload). **Auth:** Yes (owner or admin). **Success:** `200` (completed) or `202` (still processing). **Errors:** `404`.

### GET /api/v1/scans/{scanId}/safety-score
Just the score + verdict + counts. **Auth:** Yes.

### GET /api/v1/scans/{scanId}/ai-summary
Just the AI narrative + allergy warning. **Auth:** Yes.

### GET /api/v1/scans/{scanId}/recommendations
Safer-alternative recommendations derived from this scan's flagged ingredients. **Auth:** Yes.

### GET /api/v1/scans/{scanId}/consumption-advice
Plain-language guidance (e.g. "safe occasionally", "avoid if pregnant"), personalized against the user's dietary preferences if set (future). **Auth:** Yes.

---

## 6. Product APIs

### GET /api/v1/products
Search products by name/barcode. **Auth:** No.

### POST /api/v1/products
Create a product. **Auth:** Yes. **Request:** `{ name, brand_name?, barcode?, image_url? }`. **Errors:** `409` barcode already exists.

### GET /api/v1/products/{productId}
Get a product. **Auth:** No. **Errors:** `404`.

### PATCH /api/v1/products/{productId}
Update a product. **Auth:** Yes, owner or admin. **Errors:** `403` not owner/admin.

### DELETE /api/v1/products/{productId}
Delete a product. **Auth:** Yes, admin only. **Errors:** `409` product has scan history attached (protected — matches the DB's `ON DELETE RESTRICT` on `scans.product_id`).

### GET /api/v1/products/barcode/{barcode} *(future)*
External/local barcode lookup. **Auth:** No. **Errors:** `404` not found · `501` feature disabled.

### POST /api/v1/products/ocr-upload *(future)*
Multipart image upload for OCR extraction. **Auth:** Yes. **Request:** `multipart/form-data`, field `image` (JPEG/PNG/WEBP, ≤8MB). **Success:** `202` — returns `scan_id` to poll. **Errors:** `413` too large · `415` unsupported type · `501` feature disabled.

---

## 7. Comparison APIs

### POST /api/v1/comparisons
Compare Product A vs Product B by their scan IDs. **Auth:** Yes. **Request:** `{ scan_a_id, scan_b_id }`. **Success:** `201` — `{ comparison_id, winner, recommendation_text }`. **Errors:** `422` scans not distinct / not owned by caller.

Returns, once resolved via `GET /comparisons/{id}`:
- **Safety scores** for both products
- **Differences** (ingredient count, harmful ingredient count, risk level deltas)
- **Recommendation** — AI-generated plain-language verdict naming the safer product

### GET /api/v1/comparisons
List the user's past comparisons, paginated. **Auth:** Yes.

### GET /api/v1/comparisons/{comparisonId}
Full comparison detail. **Auth:** Yes. **Errors:** `404`.

### DELETE /api/v1/comparisons/{comparisonId}
Delete a comparison record. **Auth:** Yes.

---

## 8. Scan History APIs

### POST /api/v1/analysis
*(Save Scan — see §5; a scan is created as the side effect of triggering analysis, not via a separate "save" call, since a scan without an analysis result would be a meaningless empty record.)*

### GET /api/v1/scans
Paginated, filterable, searchable scan history. **Auth:** Yes. **Query params:** `risk_level`, `from_date`, `to_date`, `q` (product name search), `page`/`limit` or `cursor` (keyset pagination — preferred, see §19), `sort`.

### DELETE /api/v1/scans/{scanId}
Delete a single scan from history. **Auth:** Yes, owner. **Errors:** `404`.

### GET /api/v1/scans/export
Export full scan history. **Auth:** Yes. **Query params:** `format` (`csv` | `json` | `pdf`, default `csv`). **Success:** `202` — export job queued, download link delivered via email/webhook (kept async since large histories can take several seconds to render, especially as PDF).

---

## 9. User APIs

### GET /api/v1/users/me
Current user's profile. **Auth:** Yes.

### PATCH /api/v1/users/me
Update `full_name`, `avatar_url`, `country_code`. **Auth:** Yes. **Errors:** `422`.

### GET /api/v1/users/me/settings
Appearance/language/notification/privacy settings. **Auth:** Yes.

### PATCH /api/v1/users/me/settings
Update `theme` (`light`/`dark`/`system`), `language_code`, notification toggles, `marketing_opt_in`, `data_sharing_opt_in`. **Auth:** Yes.

### GET /api/v1/users/me/saved-ingredients
Ingredient watchlist (for new-ban alerts). **Auth:** Yes.

### POST /api/v1/users/me/saved-ingredients
Add an ingredient to the watchlist. **Auth:** Yes. **Request:** `{ ingredient_id }`.

### DELETE /api/v1/users/me/saved-ingredients/{ingredientId}
Remove from watchlist. **Auth:** Yes. **Errors:** `404`.

### DELETE /api/v1/users/me/account
Permanently delete account + data. **Auth:** Yes. **Request:** `{ confirmation: "DELETE" }` (typed confirmation required, matching the Profile screen's UX). **Success:** `202` — queued async purge. **Errors:** `422` confirmation text incorrect.

### GET /api/v1/users/me/export
Full personal-data export (GDPR-style portability). **Auth:** Yes. **Success:** `202` — queued, delivered via email link.

---

## 10. Notification APIs

### GET /api/v1/notifications
List notifications. **Auth:** Yes. **Query params:** `unread_only`, `page`, `limit`.

### PATCH /api/v1/notifications/{notificationId}/read
Mark one notification as read. **Auth:** Yes.

### PATCH /api/v1/notifications/read-all
Mark all as read. **Auth:** Yes.

### DELETE /api/v1/notifications/{notificationId}
Delete a notification. **Auth:** Yes.

*(Notification preferences are managed via `PATCH /users/me/settings`, §9 — not duplicated as a separate endpoint, since they're a subset of the same settings resource.)*

---

## 11. Admin APIs *(Future)*

All endpoints below require role `admin` or `super_admin` (enforced via the `admin_roles` table + RLS, §16). Not part of the v1 public contract until the Admin Dashboard ships — included now so the URL/shape is stable when it does.

- `GET /api/v1/admin/dashboard/metrics` — precomputed daily platform metrics (scan volume, active users, avg safety score, high-risk scan count)
- `GET /api/v1/admin/ingredients` · `POST /api/v1/admin/ingredients` · `PATCH /api/v1/admin/ingredients/{id}` · `DELETE /api/v1/admin/ingredients/{id}` — ingredient knowledge-base management (moderation view, includes soft-deleted rows)
- `GET /api/v1/admin/users` — user list/search
- `PATCH /api/v1/admin/users/{id}/role` — grant/revoke admin roles (**`super_admin` only** — a stricter gate than the other admin endpoints)
- `GET /api/v1/admin/analytics/events` — raw analytics event query
- `GET /api/v1/admin/reports` — generate scan-volume/risk-distribution/user-growth reports (async, `202`)
- `GET /api/v1/admin/system-logs` — query the audit trail (`audit_logs` table)

---

## 12. API Request Format

All requests use `Content-Type: application/json` except file uploads (`multipart/form-data`, OCR upload only). All request bodies are JSON objects (never bare arrays/scalars at the top level, so the shape can be extended with new optional fields without breaking clients).

**Example — trigger analysis:**
```json
POST /api/v1/analysis
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{
  "product_name": "Classic Cured Beef Jerky",
  "brand_name": "TrailSnax",
  "ingredient_text": "Beef, Water, Sodium Nitrite, Citric Acid, Tartrazine (E102)",
  "input_source": "paste"
}
```

**Example — compare two scans:**
```json
POST /api/v1/comparisons
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{
  "scan_a_id": "b6f1c2d0-1111-4a11-8a11-000000000001",
  "scan_b_id": "c7a2d3e1-2222-4b22-8b22-000000000002"
}
```

---

## 13. API Response Format

Every endpoint — success or failure — returns this exact envelope:

```json
{
  "success": true,
  "message": "",
  "data": {},
  "meta": {},
  "errors": []
}
```

| Field | Type | Description |
|---|---|---|
| `success` | boolean | `true` for 2xx, `false` for 4xx/5xx |
| `message` | string | Human-readable summary; empty string when nothing noteworthy to say |
| `data` | object \| array | The actual payload; empty object `{}` on errors or no-content responses |
| `meta` | object | Pagination info (§19), or other response metadata (e.g. `next_cursor`); empty object when not applicable |
| `errors` | array | Array of `{ code, field, message }`; empty array on success |

**Example success (paginated list):**
```json
{
  "success": true,
  "message": "",
  "data": [
    { "scan_id": "b6f1...", "product_name": "Classic Cured Beef Jerky", "safety_score": 62, "verdict": "moderate", "scanned_at": "2026-07-28T14:32:00Z" }
  ],
  "meta": { "page": 1, "limit": 20, "total_items": 4, "total_pages": 1, "next_cursor": null },
  "errors": []
}
```

**Example error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {},
  "meta": {},
  "errors": [
    { "code": "VALIDATION_ERROR", "field": "email", "message": "must be a valid email address" }
  ]
}
```

---

## 14. Error Handling

| Category | HTTP Status | `errors[].code` | Example |
|---|---|---|---|
| Validation errors | `422 Unprocessable Entity` | `VALIDATION_ERROR` | Missing required field, invalid email format, password too short |
| Authentication errors | `401 Unauthorized` | `AUTH_INVALID_CREDENTIALS`, `AUTH_TOKEN_EXPIRED`, `AUTH_TOKEN_INVALID` | Wrong password; expired access token |
| Authorization errors | `403 Forbidden` | `FORBIDDEN_ROLE`, `FORBIDDEN_OWNER` | Non-admin hitting `/admin/*`; editing another user's product |
| Not found | `404 Not Found` | `NOT_FOUND` | Unknown `scanId`/`ingredientId` |
| Conflict | `409 Conflict` | `DUPLICATE_RESOURCE` | Registering an email that already exists; duplicate barcode |
| AI errors | `502 Bad Gateway` / `503 Service Unavailable` | `AI_PROVIDER_ERROR`, `AI_TIMEOUT` | Claude/GPT-5 API failure or timeout during analysis |
| Database errors | `500 Internal Server Error` | `DATABASE_ERROR` | Unexpected constraint violation, connection failure |
| Timeout errors | `504 Gateway Timeout` | `UPSTREAM_TIMEOUT` | Edge Function exceeded its execution budget |
| Rate limit errors | `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED` | Too many `/analysis` calls in the rate window (§18) |

**Design rule:** every 4xx is the client's fault and actionable (fix the request); every 5xx is the server's fault and retriable (§27 retry strategy). AI errors are deliberately mapped to `502`/`503`, not `500` — an AI provider outage is an upstream dependency failure, not a bug in NutriGuard AI's own code, and clients should treat it as retriable.

---

## 15. Status Codes

| Code | Meaning | Used for |
|---|---|---|
| `200 OK` | Success, response body present | GET, PATCH (in place), most reads |
| `201 Created` | Resource created | POST `/auth/register`, `/products`, `/comparisons`, `/users/me/saved-ingredients` |
| `202 Accepted` | Accepted for async processing | POST `/analysis`, `/products/ocr-upload`, `DELETE /users/me/account`, exports, reports |
| `204 No Content` | Success, no body | `DELETE` endpoints, `/auth/logout` |
| `400 Bad Request` | Malformed request (rare — usually superseded by 422) | Invalid/expired reset token |
| `401 Unauthorized` | Missing/invalid/expired auth | All protected endpoints without a valid Bearer token |
| `403 Forbidden` | Authenticated but not permitted | Role/ownership mismatch |
| `404 Not Found` | Resource doesn't exist (or isn't visible to this caller, per RLS) | Any `{id}` lookup |
| `409 Conflict` | Uniqueness/state conflict | Duplicate email, duplicate barcode, deleting a product with scan history |
| `413 Payload Too Large` | Upload exceeds limit | OCR image >8MB |
| `415 Unsupported Media Type` | Wrong file type | OCR upload not JPEG/PNG/WEBP |
| `422 Unprocessable Entity` | Semantically invalid request body | Validation failures (§17) |
| `429 Too Many Requests` | Rate limit hit | Analysis/AI endpoints, login attempts |
| `500 Internal Server Error` | Unexpected server-side failure | Bugs, DB errors |
| `502 Bad Gateway` | Upstream AI provider failure | Claude/GPT-5/OpenAI Embeddings error |
| `503 Service Unavailable` | Planned maintenance / upstream outage | AI provider down |
| `504 Gateway Timeout` | Execution exceeded time budget | Long-running analysis exceeding Edge Function limits |

---

## 16. Authentication

- **JWT:** Supabase Auth issues signed JWTs (`access_token`) containing `sub` (user UUID), `role` claim, `email`, and standard `exp`/`iat`. Access tokens are short-lived (**1 hour**); refresh tokens are long-lived (**30 days**, rotated on each use).
- **Bearer token usage:** every protected request carries `Authorization: Bearer <access_token>`. There is no cookie-based session — the API is fully stateless, suited to Edge Functions and multiple client types (web, future mobile).
- **Refresh token flow:** client detects a `401` with code `AUTH_TOKEN_EXPIRED`, calls `POST /auth/refresh-token` with the stored `refresh_token`, receives a new pair, retries the original request once. Refresh tokens are stored in `httpOnly` secure storage on web (never `localStorage`) to reduce XSS exfiltration risk.
- **Role-Based Access Control (RBAC):**

| Role | Applies to | Access |
|---|---|---|
| **Guest** (no token) | Anonymous visitors | Public reference data only: ingredient search/detail, country list, semantic search, product lookup by ID/barcode |
| **User** (default `app_role`) | Every registered account | All personal endpoints scoped to their own `user_id` (scans, comparisons, settings, notifications) |
| **Moderator** | `admin_roles` grant | Read access to `/admin/*` moderation views; cannot grant roles or delete users |
| **Admin** | `admin_roles` grant | Full `/admin/*` except role management |
| **Super Admin** | `admin_roles` grant | Everything, including `PATCH /admin/users/{id}/role` |

Role checks happen at **two layers**, deliberately redundant: the Edge Function checks the JWT's role claim before doing any work (fail fast, saves a DB round-trip on obviously-unauthorized calls), and PostgreSQL Row Level Security re-checks at the data layer via `is_admin()` (the actual authorization boundary — see the Database Design Document §11). The API layer check is a UX/performance optimization; the RLS check is the real security guarantee.

---

## 17. Validation Rules

| Field | Rule |
|---|---|
| `email` | RFC 5322 format, max 254 chars, lowercased before storage, uniqueness enforced at the DB level |
| `password` | Min 8 chars, max 72 chars (bcrypt limit), ≥1 uppercase, ≥1 lowercase, ≥1 digit; checked against a common-password denylist |
| Ingredient name (`name`) | 1–200 chars, required; `aliases[]` each 1–200 chars |
| `ingredient_text` (analysis input) | 1–5000 chars, required; rejected if it contains no comma/newline-separated tokens at all (likely not an ingredient list) |
| Product name (`name`) | 1–300 chars, required |
| `barcode` | 8–14 digits (UPC-A/UPC-E/EAN-8/EAN-13 lengths), numeric only, validated via check-digit algorithm before external lookup |
| OCR file upload | MIME type ∈ `{image/jpeg, image/png, image/webp}`, max size 8MB, min resolution 400×400px (rejects unusably low-res label photos before wasting an OCR call) |
| `country_code` | Exactly 2 uppercase letters, must exist in the `countries` reference table |
| `full_name` | 1–120 chars |
| Pagination `limit` | Integer 1–100 (requests above 100 are clamped, not rejected, to keep the API forgiving) |

All validation failures return `422` with one `errors[]` entry per invalid field, so a form can highlight every problem at once rather than one-at-a-time.

---

## 18. Security

Follows **OWASP API Security Top 10** throughout:

- **HTTPS:** enforced everywhere (Vercel + Supabase both terminate TLS by default); HTTP requests are redirected, never served.
- **Rate limiting:** tiered by endpoint sensitivity/cost —
  - `/auth/login`, `/auth/forgot-password`: 5 requests / 15 min / IP (brute-force protection)
  - `/analysis`, `/ai/*`: 20 requests / hour / user (AI compute cost protection)
  - All other authenticated endpoints: 300 requests / 5 min / user
  - Guest/public endpoints: 60 requests / min / IP
  - Exceeding a limit returns `429` with a `Retry-After` header.
- **CORS:** allow-list of known frontend origins only (production domain + Vercel preview-deployment pattern + `localhost` in development); credentials mode restricted to those origins; wildcard `*` never used alongside credentialed requests.
- **CSRF:** not applicable in the traditional cookie-session sense (the API is Bearer-token/stateless, not cookie-authenticated), which itself eliminates the classic CSRF attack vector — no `SameSite`-cookie-based session exists to forge.
- **SQL injection prevention:** 100% parameterized queries via Supabase's client libraries / PostgREST; no string-concatenated SQL anywhere in the architecture; RLS is a second line of defense even if a query were somehow malformed.
- **XSS protection:** all user-supplied text (product names, ingredient text) is stored and returned as-is (never executed) — the API returns JSON, never HTML, so reflected/stored XSS would require a frontend rendering bug, not an API one; the frontend is responsible for output-encoding on render (React does this by default).
- **Prompt injection prevention:** user-supplied `ingredient_text` is passed to the LLM inside a strictly-delimited, clearly-labeled context block with an explicit system instruction that content inside the block is *data to analyze*, never *instructions to follow*; the AI Orchestrator additionally strips/flags suspicious control-phrases ("ignore previous instructions", role-play framing) before prompting, and the LLM's output is schema-validated (structured JSON) before being persisted — a successful injection that produced malformed output is rejected at the parsing stage rather than silently stored.
- **Input sanitization:** every request body is validated against its OpenAPI schema (type, length, format, enum) before touching business logic; free-text fields are stored as parameterized values (never interpolated into queries or shell commands).
- **API key management:** third-party provider keys (Claude, GPT-5, OpenAI Embeddings) live only in Supabase Edge Function environment secrets / Vercel environment variables — never in client bundles, never in git. Client-facing Supabase `anon` key is public-by-design (RLS is what actually protects data, not key secrecy).
- **Secrets management:** rotated via the hosting platform's secret manager (Vercel/Supabase project settings), never hardcoded; `service_role` key (which bypasses RLS) is used only in trusted server-side Edge Function contexts, never exposed to any client.

---

## 19. Pagination

Two complementary strategies, chosen per endpoint based on access pattern:

- **Offset-based (`page` + `limit`):** used for smaller, rarely-deep-paginated lists (`/ingredients`, `/products`, `/comparisons`, `/notifications`). Simple, supports "jump to page N."
- **Cursor-based (`cursor`, keyset pagination):** used for `/scans` (Scan History), the single highest-volume list a user will page through — avoids the `OFFSET` performance cliff at scale. `cursor` is an opaque, base64-encoded encoding of the last-seen `scanned_at` + `scan_id` tiebreaker; the response's `meta.next_cursor` is passed as the next request's `cursor` param. When both `page` and `cursor` are supplied, `cursor` wins.
- **Sorting:** `sort` query param, e.g. `sort=-scanned_at` (leading `-` = descending) or `sort=safety_score` (ascending). Default sort is always the most recent/most relevant first.
- **Filtering:** endpoint-specific query params (`risk_level`, `category_id`, `from_date`/`to_date`, `unread_only`, etc.) — always additive (AND-combined), never a generic query-language, to keep the API predictable and cacheable.
- **Searching:** `q` query param on searchable resources (`/ingredients`, `/products`, `/scans`) — full-text + trigram fuzzy match server-side (see the Database Design Document §9 for the indexing strategy behind this).

**Standard `meta` shape for paginated responses:**
```json
{ "page": 1, "limit": 20, "total_items": 143, "total_pages": 8, "next_cursor": "eyJzY2FubmVkX2F0Ij..." }
```

---

## 20. AI APIs (Agent-Facing)

These endpoints are consumed both by the frontend (semantic search box, future Voice Assistant) and internally by the AI Orchestrator itself — documented as first-class API surface since "AI Agent Based" is a stated architecture goal, and a future standalone agent (or third-party integration) should be able to call them directly.

### POST /api/v1/ai/embeddings
Generate an embedding vector for arbitrary text via OpenAI Embeddings. Primarily a service-to-service call (ingredient/product embedding generation jobs); exposed for future client-side semantic-search-as-you-type. **Auth:** Yes. **Errors:** `429` embedding-provider rate limit.

### POST /api/v1/ai/semantic-search
Vector similarity search over the ingredient knowledge base via pgvector (`ingredient_embeddings`, HNSW index). **Auth:** No. **Request:** `{ query, match_count? }`. **Response:** ranked ingredients with cosine-similarity scores. This is the "conceptual" search complement to `GET /ingredients?q=` (lexical/fuzzy) — see the Database Design Document §13 for when each is used.

### POST /api/v1/ai/knowledge-retrieval
Retrieval-Augmented-Generation (RAG) support endpoint: given a question and/or `ingredient_id`, returns structured grounding context (risk level, health effects, country regulations, allergens, top-matching research sources) for an LLM to reason over — **used internally by `/analysis`**, and will back the future Voice Assistant so answers are grounded in the knowledge base rather than hallucinated. **Auth:** Yes.

### POST /api/v1/ai/voice-query *(future)*
Submit a transcribed voice question, optionally scoped to a `scan_id`/`ingredient_id`. **Auth:** Yes. **Errors:** `501` until the Voice Assistant ships.

**Prompt/summary/recommendation generation** (the "Prompt Submission," "Summary Generation," and "Recommendation" capabilities listed in the brief) are **not** separately exposed as raw endpoints — they are internal steps of `POST /analysis` (§5) and `POST /comparisons` (§7). This is a deliberate design choice: exposing "submit an arbitrary prompt to Claude/GPT-5" as a public API surface would be both a security risk (arbitrary LLM proxy) and outside NutriGuard AI's product scope. If a future internal tool genuinely needs raw prompt access, it should be a separate, `service_role`-only internal endpoint, not part of the public v1 contract.

---

## 21. API Sequence Diagrams

Full Mermaid sequence diagrams for **Login**, **Ingredient Analysis**, **Product Comparison**, and **History Retrieval** are in **[`docs/sequence-diagrams.md`](./docs/sequence-diagrams.md)**.

---

## 22. OpenAPI Specification

The complete OpenAPI 3.1 document — all 63 endpoints, 12 reusable schemas, security schemes, parameters, and examples — is provided as a real, validated file: **[`openapi/openapi.yaml`](./openapi/openapi.yaml)**.

- Validated to parse as well-formed OpenAPI 3.1 YAML with zero dangling `$ref`s (checked programmatically during authoring).
- Import directly into **Swagger UI**, **Postman** (`File → Import`), **Insomnia**, or **Bruno** for interactive exploration.
- A ready-to-use **Postman collection** (generated from this spec, preserving folder-per-module structure and example request bodies) is included at **[`postman/NutriGuard-AI.postman_collection.json`](./postman/NutriGuard-AI.postman_collection.json)** — 63 requests across 10 folders, with `{{base_url}}` and `{{access_token}}` collection variables pre-wired.

---

## 23. Folder Structure

Recommended backend structure (Node.js / Supabase Edge Functions). **No implementation code is included in this deliverable, per the brief — this is the recommended layout only, for the team that implements it:**

```
backend/
├── routes/          # Thin route definitions per module (auth, ingredients, analysis, products, ...)
├── controllers/      # Request/response handling — parses input, calls services, shapes the envelope
├── services/         # Business logic (safety scoring orchestration, comparison logic, notification dispatch)
├── ai/               # AI Orchestrator: prompt templates, Claude/GPT-5 client, embeddings client, RAG context builder
├── middleware/        # Auth (JWT verification), rate limiting, CORS, request logging, error-envelope formatter
├── validators/        # Per-endpoint request-schema validation (mirrors openapi.yaml schemas)
├── repositories/       # Data-access layer wrapping Supabase client calls (one repository per DB module)
├── config/             # Environment/config loading, provider client initialization
├── database/            # (See the separate Database Design Document deliverable — migrations live there, not here)
├── utils/                # Shared helpers (pagination cursor encode/decode, response envelope builder)
└── tests/                  # Unit, integration, contract, load, security (§25)
```

---

## 24. API Versioning Strategy

- **v1:** the entire contract in this document. All paths prefixed `/api/v1`.
- **v2 (future):** introduced only for **breaking** changes (removed fields, changed field types, changed auth model) — additive changes (new optional fields, new endpoints, new enum values) ship into v1 without a version bump, since they don't break existing clients.
- **Deprecation policy:** a deprecated v1 endpoint/field is marked in the OpenAPI spec (`deprecated: true`) and announced with a minimum **6-month** sunset window before removal; deprecated endpoints return a `Deprecation` and `Sunset` HTTP header (per RFC 8594) so automated clients can detect it programmatically, not just via changelog.
- **Backward compatibility:** within v1, the API only ever adds — it never removes a field, changes a field's type, or changes a status code for an existing scenario. New enum values (e.g. a new `risk_level`) are additive and documented; clients are expected to handle unknown enum values gracefully (treat as `unknown`), not to exhaustively switch on today's known set.
- **Running v1 and v2 concurrently:** both versions are served side-by-side during any migration period — there is no forced simultaneous cutover; clients migrate at their own pace within the deprecation window.

---

## 25. Testing Strategy

| Test type | Scope | Tooling suggestion |
|---|---|---|
| **Unit tests** | Individual service/validator functions (e.g. safety-score weighting, password-policy validator) in isolation | Vitest/Jest |
| **Integration tests** | Full request→response cycle against a real (test) Supabase instance, including RLS behavior | Supertest + a seeded test Supabase project |
| **Contract tests** | Every response actually matches its OpenAPI schema — prevents server/spec drift | `openapi-response-validator` or Dredd against `openapi.yaml` |
| **Load tests** | `/analysis` and `/scans` under concurrent load (the two hottest paths) — validate rate limiting and DB index performance hold at target scale | k6 or Artillery |
| **Security tests** | OWASP API Top 10 checklist: auth bypass attempts, RLS-escape attempts (cross-user data access), injection payloads, rate-limit evasion | OWASP ZAP (automated scan) + manual pentest checklist |
| **Mock APIs** | Frontend development against a mocked API before the backend is ready, using the OpenAPI spec as the mock's source of truth | Prism (`@stoplight/prism-cli mock openapi.yaml`) or the provided Postman collection's example responses |

**Priority order for a new endpoint:** contract test (does it match the spec?) → unit tests for its business logic → integration test (does it actually work against the DB?) → only then load/security tests as the endpoint matures toward production traffic.

---

## 26. API Documentation

This deliverable is compatible, out of the box, with:

- **Swagger UI:** point at `openapi/openapi.yaml` (e.g. `swagger-ui-cli serve openapi/openapi.yaml`, or host via any static Swagger UI instance) for interactive, browsable docs with "Try it out."
- **OpenAPI tooling generally:** the spec is standards-compliant OpenAPI 3.1 — usable with code generators (`openapi-generator`, `orval` for TypeScript client generation against the React frontend), linters (`spectral lint openapi/openapi.yaml`), and mock servers (Prism, §25).
- **Postman:** import `openapi/openapi.yaml` directly (Postman natively supports OpenAPI 3.1 import) **or** import the pre-built `postman/NutriGuard-AI.postman_collection.json` for a ready-organized collection with example bodies already filled in.
- **Bruno:** Bruno supports OpenAPI import in the same way as Postman — import `openapi/openapi.yaml` via `Import Collection`.
- **Insomnia:** supports direct OpenAPI 3.1 import (`Create → Import From → File`) using the same `openapi/openapi.yaml`.

No documentation drift risk: because Swagger UI, Postman, Bruno, and Insomnia all consume the **same single source file**, regenerating documentation for any of them after a spec change is a re-import, not a rewrite.

---

## 27. Best Practices

- **REST naming:** consistently plural nouns, `kebab-case` paths, `snake_case` JSON fields (§1) — applied without exception across all 63 endpoints.
- **Idempotency:** all `GET`/`PUT`/`DELETE` operations are naturally idempotent. `POST /analysis` and `POST /comparisons` are the two non-idempotent creates most likely to be double-submitted (e.g. a flaky mobile network retry) — clients should send an `Idempotency-Key` header (a client-generated UUID) on these two endpoints; the server deduplicates by key for a 24-hour window, returning the original `202`/`201` response rather than creating a duplicate scan/comparison.
- **Caching:** public reference-data endpoints (`/ingredients`, `/ingredient-categories`, `/countries`) are safe to cache aggressively — `Cache-Control: public, max-age=300` (5 min) at the CDN/edge layer, since this data changes infrequently and is identical for every guest.
- **ETags:** returned on `GET /ingredients/{id}` and `GET /products/{id}` (the two resources most likely to be polled/re-fetched unchanged); clients send `If-None-Match` and receive `304 Not Modified` when unchanged, saving bandwidth on the Ingredient Detail screen's frequent back-navigation pattern.
- **Compression:** `gzip`/`brotli` response compression enabled at the platform/CDN layer (Vercel does this automatically) — meaningful given how much of the payload is repetitive JSON (ingredient arrays, health-effect lists).
- **Retry strategy:** clients should retry `429`/`502`/`503`/`504` with exponential backoff + jitter (e.g. 500ms, 1s, 2s, capped at 3 attempts); `429` responses include a `Retry-After` header the client should honor as a floor. `4xx` other than `429` should **never** be retried without changing the request.
- **Timeouts:** Edge Function execution budget capped at 25s for synchronous endpoints (comfortably under typical platform limits); anything that could exceed this (AI analysis, OCR, exports, reports) is modeled as **async** (`202` + poll/webhook/Realtime), never as a long-held synchronous request — this is why `/analysis` returns `202` rather than blocking until the LLM responds.
- **Logging:** structured JSON logs per request (`request_id`, `user_id` if authenticated, `route`, `status`, `duration_ms`) — `request_id` is generated per request and echoed back in an `X-Request-Id` response header so a user-reported issue can be traced end-to-end.
- **Observability:** the three pillars —
  - **Metrics:** request rate/latency/error-rate per endpoint (feeds `admin_dashboard_metrics_cache` from the Database Design Document), AI-provider latency/error-rate tracked separately from the API's own latency so an upstream Claude/GPT-5 slowdown is immediately distinguishable from a NutriGuard AI regression.
  - **Logs:** structured, `request_id`-correlated (above).
  - **Traces:** distributed tracing across API → AI Orchestrator → LLM provider → Postgres, so a slow `/analysis` call's time can be broken down by stage (ingredient matching vs. LLM call vs. DB write) rather than seen only as one opaque duration.

---

## 28. Final API Summary

**Advantages:**
- One consistent response envelope and error-code taxonomy across all 63 endpoints means frontend integration code is written once, not once per module.
- Fully specified in machine-readable OpenAPI 3.1 — the frontend team can generate a typed client, mock the API, and start building before the backend is fully implemented.
- Async-by-default for anything AI/compute-heavy (`analysis`, OCR, exports, reports) avoids the single biggest scaling failure mode of "AI-powered SaaS" APIs: synchronous requests blocked on a slow LLM call.
- Security is layered (API-level role check + database-level RLS), not dependent on any single control — matches OWASP defense-in-depth guidance.
- Every future feature in the brief (OCR, Barcode, Voice, Recommendations, Admin, Analytics, Multi-language) already has a stable endpoint shape reserved (many marked `501` today), so shipping them later is additive, not a breaking renegotiation of the contract.

**Scalability:** stateless JWT auth + Edge Function deployment scales horizontally with zero shared session state; cursor-based pagination on the highest-volume list (`/scans`) avoids the offset-pagination performance cliff at millions of rows; rate limiting protects the AI-cost-bearing endpoints specifically, rather than uniformly throttling the whole API.

**Security:** HTTPS-only, tiered rate limiting, strict CORS, parameterized queries + RLS (SQL injection structurally prevented at two layers), explicit prompt-injection mitigations around all LLM-bound user input, secrets confined to server-side environments only.

**Maintainability:** single source-of-truth OpenAPI spec drives docs (Swagger/Postman/Bruno/Insomnia) and can drive contract tests and generated clients — spec drift is a CI failure, not a silent bug.

**Future expansion:** v1→v2 versioning policy with a defined 6-month deprecation window means the contract can evolve without breaking existing integrations; the module boundaries (Auth/Ingredients/Analysis/Products/Comparison/History/Notifications/AI/Admin) map directly onto independently-deployable Edge Function groups if/when true microservice separation is warranted.

**Trade-offs:**
- No HATEOAS means clients must have out-of-band knowledge of URL structure (acceptable for a small set of first-party/known clients; would need revisiting for an open third-party ecosystem).
- Async-everywhere for AI endpoints adds client-side complexity (polling or Realtime subscription) compared to a naive synchronous call — a deliberate trade of simplicity for reliability at scale.
- `PUT` is unused by design (§1) — a minor deviation from "complete" REST semantics, judged acceptable since no resource in this domain is ever meaningfully replaced wholesale rather than partially updated.
