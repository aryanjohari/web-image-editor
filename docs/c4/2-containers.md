# C2 — Containers

Default architecture map for GitHub visitors and the portfolio graph.

## Containers

| ID | Technology | Responsibility |
|----|------------|----------------|
| `studio-spa` | Vite + React + R3F / GLSL in the browser | Routes, Zustand scene state, single-pass WebGL compositor, preset/mood/export client logic |
| `mood-api` | Vercel serverless (`api/mood.ts`) | Optional `POST /api/mood` → OpenAI → validated `{ basePresetId, patch? }` |

## External systems

| Label | Role |
|-------|------|
| OpenAI API | Chat Completions when AI mood is configured |
| Your production site | Consumes exported preset JSON (see `src/lib/preset/PORTING.md`) |

## Honest omissions

- **No server database.** Zustand lives in the SPA process (in-memory). The only client persistence is a small localStorage preference for “preserve text on apply.”
- **No workers / Docker / CLIs.** Static SPA + one optional API route.
- Keyword mood is **inside** `studio-spa`, not a separate container.

## Relationships

- Designer → SPA: upload hero/overlay, catalog/mood, semantic tune, export.
- SPA → Mood API (dashed): only when `VITE_MOOD_AI_ENABLED=true` and the API is deployed.
- Mood API → OpenAI (dashed): requires `OPENAI_API_KEY`.
- SPA → production site: primary output is preset JSON coefficients.

Diagram: [`2-containers.mmd`](2-containers.mmd). Component zooms: [`3-components/studio-spa.md`](3-components/studio-spa.md), [`3-components/mood-api.md`](3-components/mood-api.md).
