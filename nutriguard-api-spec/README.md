# NutriGuard AI — API Specification Package

This package contains the complete, production-ready API design for NutriGuard AI. **No backend implementation code is included**, per the brief — this is specification and documentation only.

## Contents

```
.
├── NutriGuard-AI-API-Specification.md   # The full 28-section API Specification Document (start here)
├── openapi/
│   └── openapi.yaml                       # OpenAPI 3.1 spec — 63 endpoints, 12 schemas, security schemes
├── postman/
│   └── NutriGuard-AI.postman_collection.json   # Generated from openapi.yaml — 63 requests, 10 folders
└── docs/
    └── sequence-diagrams.md                 # Mermaid sequence diagrams: Login, Analysis, Comparison, History
```

## Quick start

**Read the spec:** open `NutriGuard-AI-API-Specification.md` — it covers overview, every endpoint module, request/response formats, error handling, status codes, auth/RBAC, validation rules, security (OWASP), pagination, versioning, testing strategy, and a recommended (empty) backend folder structure.

**Explore interactively:**
```bash
# Swagger UI (any static Swagger UI instance, or via npx)
npx swagger-ui-watcher openapi/openapi.yaml

# Or lint it
npx @stoplight/spectral-cli lint openapi/openapi.yaml
```

**Import into your API client:**
- **Postman / Bruno / Insomnia:** `Import` → select either `openapi/openapi.yaml` or the pre-built `postman/NutriGuard-AI.postman_collection.json`.
- Set the collection variable `base_url` to your environment (`http://localhost:3000/api/v1` for local dev) and `access_token` after calling `/auth/login`.

**Generate a typed frontend client (optional, not included):**
```bash
npx openapi-typescript openapi/openapi.yaml -o src/types/api.d.ts
# or, for a full client:
npx orval --input openapi/openapi.yaml --output src/api
```

**Mock the API for frontend development before the backend exists:**
```bash
npx @stoplight/prism-cli mock openapi/openapi.yaml
```

## Validation performed on this package

- `openapi/openapi.yaml` parses as well-formed YAML and valid OpenAPI 3.1 structure (52 path items / 63 operations, 12 reusable schemas).
- Every `$ref` in the spec was programmatically checked and resolves to an existing component — zero dangling references.
- `postman/NutriGuard-AI.postman_collection.json` was generated directly from `openapi.yaml` (not hand-duplicated), so the two can never drift apart, and was validated as well-formed JSON with every request's URL/method/body cross-checked against its source operation.
- Every Mermaid sequence diagram's arrows were checked to reference only declared participant aliases.

This package was built without network/browser access in the authoring sandbox, so **Swagger UI/Prism rendering was not visually verified** — the structural/schema validation above stands in for that. Recommend a quick `npx @stoplight/spectral-cli lint` pass locally before treating this as final.
