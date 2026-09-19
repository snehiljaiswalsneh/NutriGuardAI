# API Sequence Diagrams — NutriGuard AI

## 1. Login

```mermaid
sequenceDiagram
    participant Client
    participant API as API (Edge Function)
    participant Auth as Supabase Auth
    participant DB as Postgres

    Client->>API: POST /api/v1/auth/login {email, password}
    API->>Auth: signInWithPassword(email, password)
    Auth-->>API: access_token, refresh_token, user
    API->>DB: select user_profiles where id = user.id
    DB-->>API: profile row
    API-->>Client: 200 { success, data: { access_token, refresh_token, user } }
    Note over Client: Client stores tokens, attaches<br/>Authorization: Bearer access_token to future requests
```

## 2. Ingredient Analysis

```mermaid
sequenceDiagram
    participant Client
    participant API as API (Edge Function)
    participant DB as Postgres
    participant Orchestrator as AI Orchestrator
    participant LLM as Claude / GPT-5
    participant Vector as pgvector

    Client->>API: POST /api/v1/analysis {ingredient_text, input_source}
    API->>DB: insert products, insert scans (status=processing)
    API-->>Client: 202 { data: { scan_id, status: "processing" } }
    API->>Orchestrator: enqueue(scan_id) [async]

    Orchestrator->>DB: match ingredient_text against ingredients (trigram + FTS)
    Orchestrator->>Vector: semantic fallback search for unmatched fragments
    Orchestrator->>LLM: prompt with matched + unmatched context
    LLM-->>Orchestrator: structured JSON (risk, summary, allergens)
    Orchestrator->>DB: insert product_ingredients, safety_scores, ai_summaries
    Orchestrator->>DB: update scans set status='completed'
    DB-->>Client: Realtime push (Supabase Realtime channel: scans:scan_id)

    Client->>API: GET /api/v1/scans/{scanId}
    API->>DB: select from scan_dashboard_view where scan_id = ...
    DB-->>API: full dashboard payload
    API-->>Client: 200 { data: { safety_score, ai_summary, ingredients, ... } }
```

## 3. Product Comparison

```mermaid
sequenceDiagram
    participant Client
    participant API as API (Edge Function)
    participant DB as Postgres
    participant Orchestrator as AI Orchestrator

    Client->>API: POST /api/v1/comparisons {scan_a_id, scan_b_id}
    API->>DB: verify both scans exist and belong to auth.uid()
    API->>DB: select safety_scores for scan_a_id, scan_b_id
    API->>Orchestrator: generate_recommendation(scan_a, scan_b)
    Orchestrator-->>API: { winner, recommendation_text }
    API->>DB: insert comparisons
    DB-->>API: comparison_id
    API-->>Client: 201 { data: { comparison_id, winner, recommendation_text } }

    Client->>API: GET /api/v1/comparisons/{comparisonId}
    API->>DB: select comparison joined to both scans' dashboard views
    DB-->>API: full comparison payload
    API-->>Client: 200 { data: { product_a, product_b, winner, recommendation_text } }
```

## 4. History Retrieval

```mermaid
sequenceDiagram
    participant Client
    participant API as API (Edge Function)
    participant DB as Postgres

    Client->>API: GET /api/v1/scans?limit=20&cursor=...
    API->>DB: select from scan_dashboard_view where user_id = auth.uid() and scanned_at < cursor order by scanned_at desc limit 20
    Note over DB: RLS policy auto-filters to auth.uid();<br/>composite index (user_id, scanned_at desc) used
    DB-->>API: 20 scan rows + next cursor
    API-->>Client: 200 { data: [...], meta: { next_cursor } }
```
