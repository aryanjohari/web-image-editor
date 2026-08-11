# C3 — mood-api (legacy name)

Optional Vercel path for landing AI mood. **Implementation now uses Gemini** via the shared Stage brief runner — not OpenAI.

Prefer the broader container name **stage-api**: [`stage-api.md`](stage-api.md).

## Components

| Label | Evidence | Role |
|-------|----------|------|
| Vercel handler | `api/mood.ts` | `POST` only; adapts brief result → `{ basePresetId, patch? }` |
| Shared runner | `src/lib/stage/runStageBrief.ts` | Gemini JSON brief |
| Lab brief sibling | `api/brief.ts` | Stage lab Brand+Brief UI |

## Contract (from `api/mood.ts`)

- Request body: `{ prompt: string }` (and compatible fields)
- Success `200`: `{ basePresetId }` or `{ basePresetId, patch }`
- Requires `GEMINI_API_KEY` / `GOOGLE_API_KEY` (503 if missing)

## Notes

- Client: `VITE_STAGE_BRIEF_AI_ENABLED` (or legacy `VITE_MOOD_AI_ENABLED`).
- Local: Vite proxies `/api/mood` → `vercel dev`.
- Phase 4 Jobs API lives under `/api/v1/*` with API keys — see stage-api.
- Parent: [`../2-containers.md`](../2-containers.md).
