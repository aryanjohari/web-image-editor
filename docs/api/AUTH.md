# Stage API — auth (Phase 4)

Source of truth with [`stage-v1.openapi.yaml`](stage-v1.openapi.yaml) and [`../DIRECTION.md`](../DIRECTION.md).

## Stance

| Who | Mechanism |
|-----|-----------|
| You / SEO / web modules | Long-lived **API key** on `/api/v1/*` |
| Lab UI (`/lab`) | **Keyless** `POST /api/brief` (needs `GEMINI_API_KEY` only) |
| Landing mood | **Keyless** `POST /api/mood` (same Gemini runner) |
| Public web try / session tokens | Deferred (no browser copy of the module key) |
| Teams / SSO | Deferred past v1 |

## Headers (`/api/v1/*`)

```http
Authorization: Bearer sk_stage_<secret>
```

Also accepted:

```http
X-Stage-Key: sk_stage_<secret>
```

Exceptions: `GET /api/v1/health` is public (no key).

Missing or wrong key → `401 { "error": "Unauthorized" }`.  
No keys configured in env → `503` with a config error (fail closed).

## Lab vs module key

| Surface | Auth |
|---------|------|
| `POST /api/brief`, `POST /api/mood` | No Stage API key — Gemini env only |
| `GET/POST/PATCH /api/v1/brands`, `/api/v1/jobs…` | Requires `STAGE_API_KEY` / `STAGE_API_KEYS` |

Do **not** put module keys in `VITE_*`. The lab never needs the Stage API key for Brand+Brief UI.

## Env (wired Phase 4)

| Variable | Where | Purpose |
|----------|--------|---------|
| `STAGE_API_KEY` | Server | Single module key |
| `STAGE_API_KEYS` | Server | Comma-separated allowlist (merged with `STAGE_API_KEY`) |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | Server | LLM for brief / jobs / mood |
| `GEMINI_MODEL` | Server | Optional; default `gemini-2.5-flash` |
| `VITE_STAGE_BRIEF_AI_ENABLED` | Client build | Enable brief/mood AI client path |
| `STAGE_PLATE_GEN_ENABLED` | Server | Planned Phase 6 — not wired |
| `STAGE_PLATE_GEN_API_KEY` | Server | Planned Phase 6 — not wired |
| `VITE_STAGE_PLATE_GEN_UI` | Client build | Planned Phase 6 |

## Persistence note

Brands and jobs live in an **in-memory Map** per serverless isolate. Cold starts and redeploys wipe state. Lab brand kits remain in **localStorage** and are **not** synced with API brands.
