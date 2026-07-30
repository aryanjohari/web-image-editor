# C3 — mood-api

Optional Vercel serverless function for AI mood. Keyword mood does **not** live here — it runs in the SPA (`src/lib/mood/mapMoodToPreset.ts`).

## Components

| Label | Evidence | Role |
|-------|----------|------|
| Vercel handler | `api/mood.ts` | `POST` only; requires `OPENAI_API_KEY` |
| System prompt builder | `src/lib/mood/buildAiMoodSystemPrompt.ts` | Catalog-aware director prompt |
| OpenAI Chat Completions | upstream HTTPS | Model from `OPENAI_MODEL` or `gpt-4o-mini` |
| Parse / validate | `src/lib/mood/parseAiMoodResponse.ts` | `{ basePresetId, patch? }` or 422 |

## Contract

- Request body: `{ prompt: string }`
- Success: `{ basePresetId }` or `{ basePresetId, patch }`
- Failures: 400 / 405 / 422 / 502 / 503 as implemented in `api/mood.ts`

## Notes

- Client enables the call only when `VITE_MOOD_AI_ENABLED=true` (build-time). Local Vite proxies `/api/mood` to `vercel dev`.
- Netlify static deploys have no this container — keyword mood only.
- Diagram: [`mood-api.mmd`](mood-api.mmd). Parent: [`../2-containers.md`](../2-containers.md).
