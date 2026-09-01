# C2 — Containers

Runnable pieces in this repo. Machine IDs: `prism-lab` (Lab SPA), `talk-api`, `compositor` (plus supporting IDB + MediaPipe worker).

## Containers

| ID | Technology | Responsibility | Evidence |
|----|------------|----------------|----------|
| `prism-lab` | Vite + React + TypeScript | `/` Lab UI; `/hero` hero-lite; packs, sliders, talk stub, canvas overlay, export | `src/app/App.tsx`, `Lab.tsx`, `Hero.tsx`, `CanvasOverlay.tsx` |
| `compositor` | WebGL2 + GLSL | Recipe → draw; grade chain; regional mask mix; blur ping-pong; export FBO readback | `src/compositor/renderer.ts`, `shaders/*.glsl` |
| `talk-api` | Vercel serverless + Vite plugin | `POST /api/talk`; shared `server/talkCore.ts` | `api/talk.ts`, `server/vitePlugin.ts` |
| `asset-store` | IndexedDB | `putAsset` / `getAsset` for main, overlay, mask | `src/assets/idb.ts` |
| `mask-worker` | MediaPipe tasks-vision | Person mask in Web Worker; assets from `public/mediapipe/` | `src/masks/*`, `scripts/copy-mediapipe-assets.mjs` |

## External systems

| Label | Role | Evidence |
|-------|------|----------|
| Gemini API | Structured talk patch (`gemini-2.5-flash`) | `server/gemini.ts`, `GEMINI_API_KEY` |
| Your site | Consumes recipe JSON for hero-lite | `src/app/Hero.tsx`, bundled `/hero/*` textures |

## Honest omissions / collapsed notes

- **No durable server database.** Assets and recipe draft live in the browser (IndexedDB + `localStorage`).
- **Talk is optional.** Without `GEMINI_API_KEY`, `/api/talk` returns 503; packs/sliders/export still work.
- **One person mask** on main only; no server-side segmentation.
- **Compositor runs in the browser** — not a separate deployable service; shown as its own container because it is the engine organ.

## Relationships

- Photographer → Lab SPA: upload, pack, sliders, talk, canvas edits, export.
- Lab SPA → compositor: validated recipe + resolved textures each frame.
- Lab SPA → talk-api: natural-language intent (text context only).
- talk-api → Gemini: JSON schema response.
- Lab SPA → IndexedDB: asset blobs; mask worker writes mask asset.
- Lab SPA → production site: recipe JSON, `#r=` hash, PNG file.

Diagram: [`2-containers.mmd`](2-containers.mmd). Components: [`3-components/lab-spa.md`](3-components/lab-spa.md), [`3-components/talk-api.md`](3-components/talk-api.md), [`3-components/compositor.md`](3-components/compositor.md).
