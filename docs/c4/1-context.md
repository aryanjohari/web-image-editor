# C1 — System context

**Prism** is a browser lab for parametric still-photo styling: closed look packs, semantic sliders, optional talk router, deterministic WebGL2 export.

## Elements

| ID | Type | Role | Evidence |
|----|------|------|----------|
| `photographer` | Person | Uses Lab at `/`, exports PNG/recipe, optional `/hero` embed | `src/app/Lab.tsx`, `src/app/Hero.tsx` |
| `prism` | Software system | This repository (SPA + talk API + compositor) | whole repo on `rewrite/v1-styling` |
| `gemini` | External system | Intent → validated talk patch | `server/talkCore.ts`, `api/talk.ts` |
| `idb` | External system | Browser asset store | `src/assets/idb.ts` |
| `embedSite` | External system | Site that reuses recipe JSON behind HTML | `src/app/Hero.tsx`, `M04_EXPORT.md` |

## Notes

- Talk is a **router**, not a vision model — no image bytes in the prompt.
- Recipe is truth; pixels are outputs. Sliders, talk, and canvas edits converge on the same document.
- `#r=` URL hash carries compressed recipe only; photos reconnect from IndexedDB.
- Diagram: [`1-context.mmd`](1-context.mmd). Zoom → [`2-containers.md`](2-containers.md).
