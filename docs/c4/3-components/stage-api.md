# C3 — stage-api

Vercel serverless Stage API: keyless lab Gemini routes + keyed `/api/v1` brands/jobs.

Evolves the older **mood-api** name — see also [`mood-api.md`](mood-api.md).

## Components

| Label | Evidence | Role |
|-------|----------|------|
| Brief handler | `api/brief.ts` | Keyless `POST /api/brief` → Gemini → `{ patch, summary?, baseLookId? }` |
| Mood adapter | `api/mood.ts` | Keyless landing mood; wraps same `runStageBrief` |
| Health | `api/v1/health.ts` | Public liveness + `contractVersion` |
| Brands | `api/v1/brands.ts`, `brands/[brandId].ts` | In-memory brand CRUD subset |
| Jobs | `api/v1/jobs.ts`, `jobs/[jobId].ts`, `.../patch.ts`, `.../artifacts.ts` | Sync job → StageRecipe; patch follow-up; artifacts metadata stub |
| Auth | `src/lib/stage/server/stageApiAuth.ts` | `STAGE_API_KEY` / `STAGE_API_KEYS` |
| Store | `src/lib/stage/server/stageStore.ts` | Module Maps (cold-start wipe) |
| Job runner | `src/lib/stage/server/runStageJob.ts` | Brief + merge patch → StageRecipe |
| Gemini runner | `src/lib/stage/runStageBrief.ts` | Shared with brief/mood |

## Notes

- Persistence is **in-memory only** for dogfood.
- Lab brand kits stay in browser `localStorage` — not synced with API brands.
- `POST /v1/assets` is not implemented.
- OpenAPI: [`../../api/stage-v1.openapi.yaml`](../../api/stage-v1.openapi.yaml). Auth: [`../../api/AUTH.md`](../../api/AUTH.md).
- Parent: [`../2-containers.md`](../2-containers.md).
