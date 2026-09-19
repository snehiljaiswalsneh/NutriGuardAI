# Entity Relationship Diagram — NutriGuard AI

> Rendered with Mermaid. Split into two diagrams for readability — **Core** (current features) and **Future** (OCR/Barcode/Voice/Nutrition/Recommendation/Admin/Analytics) — since a single diagram with 38 tables is unreadable. Both diagrams share the same `ingredients` / `products` / `scans` entities as join points.

## Core ERD (current features)

```mermaid
erDiagram
    USERS ||--|| USER_PROFILES : "extends"
    USER_PROFILES ||--|| USER_SETTINGS : "has"
    USER_PROFILES ||--o{ USER_SAVED_INGREDIENTS : "watches"
    USER_PROFILES ||--o{ SCANS : "creates"
    USER_PROFILES ||--o{ COMPARISONS : "creates"
    USER_PROFILES ||--o{ NOTIFICATIONS : "receives"
    USER_PROFILES ||--o{ PRODUCTS : "adds (created_by)"

    INGREDIENT_CATEGORIES ||--o{ INGREDIENT_CATEGORIES : "parent/child"
    INGREDIENT_CATEGORIES ||--o{ INGREDIENTS : "categorizes"

    INGREDIENTS ||--o{ INGREDIENT_HEALTH_EFFECTS : "has"
    INGREDIENTS ||--o{ INGREDIENT_ALTERNATIVES : "suggests"
    INGREDIENTS }o--o{ RESEARCH_SOURCES : "cites (via junction)"
    INGREDIENTS }o--o{ ALLERGENS : "contains (via junction)"
    INGREDIENTS }o--o{ COUNTRIES : "regulated in (via junction)"
    INGREDIENTS ||--o{ USER_SAVED_INGREDIENTS : "watched by"
    INGREDIENTS ||--o| INGREDIENT_EMBEDDINGS : "embedded as"

    INGREDIENT_RESEARCH_SOURCES }o--|| INGREDIENTS : ""
    INGREDIENT_RESEARCH_SOURCES }o--|| RESEARCH_SOURCES : ""

    INGREDIENT_ALLERGENS }o--|| INGREDIENTS : ""
    INGREDIENT_ALLERGENS }o--|| ALLERGENS : ""

    INGREDIENT_COUNTRY_REGULATIONS }o--|| INGREDIENTS : ""
    INGREDIENT_COUNTRY_REGULATIONS }o--|| COUNTRIES : ""

    BRANDS ||--o{ PRODUCTS : "manufactures"
    PRODUCTS ||--o{ PRODUCT_INGREDIENTS : "contains"
    PRODUCT_INGREDIENTS }o--|| INGREDIENTS : "references"
    PRODUCTS ||--o| PRODUCT_EMBEDDINGS : "embedded as"
    PRODUCTS ||--o{ SCANS : "analyzed via"

    SCANS ||--|| SAFETY_SCORES : "produces"
    SCANS ||--|| AI_SUMMARIES : "produces"
    SCANS }o--|| PRODUCTS : "analyzes"
    SCANS }o--|| USER_PROFILES : "belongs to"

    COMPARISONS }o--|| SCANS : "scan_a"
    COMPARISONS }o--|| SCANS : "scan_b"
    COMPARISONS }o--|| USER_PROFILES : "requested by"

    USER_PROFILES {
        uuid id PK
        text full_name
        app_role role
        char country_code
    }
    INGREDIENTS {
        uuid id PK
        uuid category_id FK
        text name
        text e_number
        risk_level risk_level
        tsvector search_vector
    }
    PRODUCTS {
        uuid id PK
        uuid brand_id FK
        text name
        text barcode
        text raw_ingredient_text
    }
    SCANS {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        job_status status
        text input_source
    }
    SAFETY_SCORES {
        uuid scan_id PK_FK
        smallint score
        risk_level verdict
    }
    AI_SUMMARIES {
        uuid scan_id PK_FK
        text summary_text
        text allergy_warning
    }
    COMPARISONS {
        uuid id PK
        uuid scan_a_id FK
        uuid scan_b_id FK
        comparison_winner winner
    }
```

## Future-module ERD

```mermaid
erDiagram
    SCANS ||--o| OCR_CAPTURES : "captured via"
    SCANS ||--o| BARCODE_LOOKUPS : "captured via"
    SCANS ||--o{ VOICE_QUERIES : "discussed via"
    USER_PROFILES ||--o{ VOICE_QUERIES : "asks"

    PRODUCTS ||--o| NUTRITION_FACTS : "has"
    USER_PROFILES ||--o{ USER_DIETARY_PREFERENCES : "sets"
    USER_PROFILES ||--o{ RECOMMENDATIONS : "receives"
    PRODUCTS ||--o{ RECOMMENDATIONS : "source/recommended"

    LANGUAGES ||--o{ INGREDIENT_TRANSLATIONS : "translates into"
    LANGUAGES ||--o{ UI_TRANSLATIONS : "translates into"
    INGREDIENTS ||--o{ INGREDIENT_TRANSLATIONS : "translated as"

    USER_PROFILES ||--o| ADMIN_ROLES : "may hold"
    USER_PROFILES ||--o{ ANALYTICS_EVENTS : "generates"

    OCR_CAPTURES {
        uuid scan_id PK_FK
        text image_storage_path
        text extracted_text
        numeric ocr_confidence
    }
    BARCODE_LOOKUPS {
        uuid scan_id PK_FK
        text barcode
        jsonb external_payload
    }
    VOICE_QUERIES {
        uuid id PK
        uuid user_id FK
        uuid scan_id FK
        text transcript
    }
    NUTRITION_FACTS {
        uuid product_id PK_FK
        numeric calories_kcal
        numeric sodium_mg
        jsonb extra_nutrients
    }
    RECOMMENDATIONS {
        uuid id PK
        uuid user_id FK
        uuid source_product_id FK
        uuid recommended_product_id FK
        text recommendation_type
    }
    ADMIN_ROLES {
        uuid user_id PK_FK
        app_role granted_role
        timestamptz revoked_at
    }
    ANALYTICS_EVENTS {
        uuid id PK
        uuid user_id FK
        text event_name
        jsonb properties
    }
```
