# C3 — talk-api

Server-side talk router: natural language → validated JSON patch on the closed recipe schema. Shared between Vercel production and local Vite dev.

## Components

| ID / label | Evidence | Role |
|------------|----------|------|
| Vercel handler | `api/talk.ts` | Production `POST /api/talk`; CORS; 64 KiB body cap |
| Vite middleware | `server/vitePlugin.ts`, `vite.config.ts` | Dev parity — Lab hits same route without separate terminal |
| Talk core | `server/talkCore.ts` | `processTalk`: validate, soft IP rate limit, timeout, error codes |
| Gemini client | `server/gemini.ts` | `@google/genai`; model `gemini-2.5-flash`; structured output |
| Normalize | `src/talk/normalize.ts` | Refuse off-lane requests; clamp deltas; map to pack/slider/nudge tools |
| Talk schema | `src/talk/schema.ts`, `types.ts` | Closed enums for packs, semantic/regional sliders, text tools |

## Notes

- **No vision** — `buildRecipeContext` sends text metadata only (pack id, slider values, text content); never image bytes.
- **Fail closed** — `MISSING_KEY`, `TIMEOUT`, invalid JSON, or refused intent returns error; Lab keeps last good recipe.
- **Client apply is shared** — browser `applyTalk` uses the same normalize helpers as the server response path.
- **Secret stays server-side** — `GEMINI_API_KEY` never in `VITE_*` or client bundle.

Diagram: [`talk-api.mmd`](talk-api.mmd). Parent: [`../2-containers.md`](../2-containers.md).
