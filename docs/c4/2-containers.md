# C2 — Containers

Runnable pieces in this repo. Machine IDs: `studio-spa`, `stage-api` (includes legacy `mood-api` routes).

## Containers

| ID | Technology | Responsibility | Evidence |
|----|------------|----------------|----------|
| `studio-spa` | Vite + React + R3F / Three / GLSL + Zustand | Routes, scene state, WebGL compositor, brand/brief/pack UI, embed demo | `src/main.tsx`, `src/App.tsx`, `src/webgl/*`, `src/lib/stage/*`, `vite.config.ts` |
| `stage-api` | Vercel serverless | Keyless `POST /api/brief` + `/api/mood` (Gemini); keyed `/api/v1/*` brands + jobs (in-memory) | `api/brief.ts`, `api/mood.ts`, `api/v1/*`, `src/lib/stage/server/*` |

## External systems

| Label | Role | Evidence |
|-------|------|----------|
| Gemini API | Constrained brief → patch (jobs + lab) | `src/lib/stage/runStageBrief.ts` (`GEMINI_API_KEY`) |
| Consumer modules | Call Jobs API with API key | `docs/api/stage-v1.openapi.yaml`, `docs/api/AUTH.md` |
| Your production site | Consumes preset / StageRecipe JSON | `src/lib/preset/PORTING.md`, `src/lib/stage/EMBED.md` |

## Honest omissions / collapsed notes

- **No durable database.** API brands/jobs are module-scope Maps (wipe on cold start). Lab brand kit = `localStorage`.
- **Pack ZIP** is produced in the SPA, not by `stage-api`.
- **`POST /v1/assets`** not implemented (Phase 4 deferred).
- **Keyword mood** stays inside `studio-spa`.
- **Netlify static** can host the SPA but has no `stage-api`.

## Relationships

- Designer → SPA: upload, brief, pack, embed demo.
- SPA → stage-api: `/api/brief`, `/api/mood` (no Stage API key).
- Modules → stage-api: `/api/v1/*` with Bearer / `X-Stage-Key`.
- stage-api → Gemini: brief JSON.
- SPA → production site: preset / StageRecipe coefficients.

Diagram: [`2-containers.mmd`](2-containers.mmd). Components: [`3-components/studio-spa.md`](3-components/studio-spa.md), [`3-components/stage-api.md`](3-components/stage-api.md).
