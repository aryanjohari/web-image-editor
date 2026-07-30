# C3 — mood-api

Optional Vercel serverless function for AI mood. Keyword mood does **not** live here — it runs in the SPA (`src/lib/mood/mapMoodToPreset.ts` via `applyMood.ts`).

## Components

| Label | Evidence | Role |
|-------|----------|------|
| Vercel handler | `api/mood.ts` | `POST` only; 405 otherwise; requires `OPENAI_API_KEY` (503 if missing) |
| System prompt builder | `src/lib/mood/buildAiMoodSystemPrompt.ts` | Catalog-aware director prompt (bundled into the function) |
| Parse / validate | `src/lib/mood/parseAiMoodResponse.ts` | `{ basePresetId, patch? }` or 422 |
| OpenAI Chat Completions | upstream | Model from `OPENAI_MODEL` or default `gpt-4o-mini`; `response_format: json_object` |

## Contract (from `api/mood.ts`)

- Request body: `{ prompt: string }`
- Success `200`: `{ basePresetId }` or `{ basePresetId, patch }`
- Failures: `400` / `405` / `422` / `502` / `503` as implemented

## Notes

- Client enables the call only when `VITE_MOOD_AI_ENABLED=true` (build-time). Local: Vite proxies `/api/mood` → `vercel dev` (`vite.config.ts`).
- Netlify-only static deploys have **no** this container — keyword mood only.
- Diagram: [`mood-api.mmd`](mood-api.mmd). Parent: [`../2-containers.md`](../2-containers.md).
