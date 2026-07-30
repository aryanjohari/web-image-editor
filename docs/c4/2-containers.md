# C2 — Containers

Runnable pieces that exist in this repo. Machine IDs: `studio-spa`, `mood-api`.

## Containers

| ID | Technology | Responsibility | Evidence |
|----|------------|----------------|----------|
| `studio-spa` | Vite + React + R3F / Three / GLSL + Zustand in the browser | Routes, in-memory scene state, single-pass WebGL compositor, preset/mood/export client | `src/main.tsx`, `src/App.tsx`, `src/webgl/*`, `src/store/*`, `src/lib/*`, `vite.config.ts`, `vercel.json` SPA rewrite, `public/_redirects` |
| `mood-api` | Vercel serverless | Optional `POST /api/mood` → OpenAI → validated `{ basePresetId, patch? }` | `api/mood.ts`; Vite proxies `/api/mood` → `vercel dev` in `vite.config.ts` |

## External systems

| Label | Role | Evidence |
|-------|------|----------|
| OpenAI API | Chat Completions when AI mood is configured | `api/mood.ts` (`OPENAI_API_KEY`, `OPENAI_MODEL` default `gpt-4o-mini`) |
| Your production site | Consumes exported preset JSON | `src/lib/preset/PORTING.md`, export via `buildPreset` |

## Honest omissions / collapsed notes

- **No server database.** Zustand is in-memory in the SPA. The only client persistence found is `localStorage` for “preserve text on apply” (`src/lib/preset/presetApplyPreference.ts`).
- **No workers / Docker / CLIs / CI workflows** in this repo.
- **Keyword mood is inside `studio-spa`**, not a container (`src/lib/mood/mapMoodToPreset.ts`).
- **Netlify static** can host the SPA (`public/_redirects`) but has no `mood-api` — keyword mood only.
- SPA internals (shader banks, apply modes, export clock) are collapsed here; see C3 `studio-spa`.

## Relationships

- Designer → SPA: upload hero/overlay, catalog/mood, semantic tune, export.
- SPA → Mood API (optional): only when `VITE_MOOD_AI_ENABLED=true` at build and the API is deployed.
- Mood API → OpenAI (optional): requires `OPENAI_API_KEY`.
- SPA → production site: primary output is preset **coefficients** from Zustand (`buildPreset`), not pixels from the GPU. WebM/PNG are canvas captures.

Diagram: [`2-containers.mmd`](2-containers.mmd). Components: [`3-components/studio-spa.md`](3-components/studio-spa.md), [`3-components/mood-api.md`](3-components/mood-api.md).
