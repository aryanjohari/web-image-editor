# C1 — System context

**Background Studio → Stage** designs animated full-viewport heroes and brand-ruled campaign recipes (web app + Jobs API).

## Elements

| ID | Type | Role | Evidence |
|----|------|------|----------|
| `designer` | Person | Authors looks on `/`, `/lab`, `/story`, `/embed-demo` | `src/App.tsx`, shells |
| `moduleConsumer` | Person | External modules calling keyed `/api/v1` | `docs/api/AUTH.md` |
| `studio` | Software system | This repository (SPA + Stage API) | whole repo |
| `gemini` | External system | Constrained brief → patch | `src/lib/stage/runStageBrief.ts` |
| `embedSite` | External system | Site that reuses exported coefficients | `src/lib/preset/PORTING.md`, `src/lib/stage/EMBED.md` |

## Notes

- Keyword mood runs in the browser; AI brief/mood/jobs need Gemini + Vercel (or `vercel dev`).
- Jobs API brands/jobs are **in-memory** (cold-start wipe). No multi-tenant durable backend.
- Diagram: [`1-context.mmd`](1-context.mmd). Zoom → [`2-containers.md`](2-containers.md).
