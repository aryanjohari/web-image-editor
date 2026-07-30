# C1 — System context

**Background Studio** is one product: a browser tool for designing animated full-viewport hero backgrounds and exporting **preset JSON** (plus optional WebM/PNG).

## Elements

| ID | Type | Role | Evidence |
|----|------|------|----------|
| `designer` | Person | Authors looks on `/`, `/lab`, `/story` | `src/App.tsx`, shells |
| `studio` | Software system | This repository’s product (SPA ± optional Mood API) | whole repo |
| `openai` | External system | Optional upstream for AI mood | `api/mood.ts` → `api.openai.com/v1/chat/completions` |
| `embedSite` | External system | A site that reuses exported preset coefficients (not part of this deploy) | `src/lib/preset/PORTING.md` |

## Notes

- Keyword mood runs entirely in the browser; AI mood is optional and needs the Mood API + `OPENAI_API_KEY` (see C2).
- No hosted database, no multi-tenant backend, no Docker/workers.
- Browser WebGL / `MediaRecorder` / `localStorage` are **platform capabilities of the SPA**, not separate software systems on this diagram.
- Diagram: [`1-context.mmd`](1-context.mmd). Zoom → [`2-containers.md`](2-containers.md).
