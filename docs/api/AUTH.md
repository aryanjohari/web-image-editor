# Stage API — auth (Phase 0)

Source of truth with [`stage-v1.openapi.yaml`](stage-v1.openapi.yaml) and [`../DIRECTION.md`](../DIRECTION.md).

## Stance

| Who | Mechanism |
|-----|-----------|
| You / SEO / web modules | Long-lived **API key** |
| Public web try | Demo brand + **rate-limited** demo key (or anonymous quota) |
| Teams / SSO | Deferred past v1 |

## Headers

```http
Authorization: Bearer sk_stage_<secret>
```

Implementations may also accept `X-Stage-Key: sk_stage_<secret>`.

## Rules

- API keys and LLM / plate-gen provider keys live **only** on the server (`stage-api` env).
- Never expose keys via `VITE_*` build-time variables.
- Web app calls same-origin `/api/v1/*`; browser holds a **session or short-lived client token** issued after login/demo gate — not the master module key (Phase 4 detail).
- Phase 0–3 personal dogfood may use a single server env key for all `/v1` routes.

## Env (planned names — not wired in Phase 0)

| Variable | Where | Purpose |
|----------|--------|---------|
| `STAGE_API_KEYS` | Server | Comma-separated or hashed allowlist of module keys |
| `OPENAI_API_KEY` | Server | LLM state operator (existing mood path evolves) |
| `STAGE_PLATE_GEN_ENABLED` | Server | `"true"` to allow plate gen jobs |
| `STAGE_PLATE_GEN_API_KEY` | Server | Provider key when plate gen on |
| `VITE_STAGE_PLATE_GEN_UI` | Client build | Show gen toggle in UI only; cannot enable server alone |
