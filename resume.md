# Background Studio

Ground-truth evidence for CV bullets and cover letters. Fill in every section with verified facts only.

## One-line summary

Browser-based WebGL studio for designing full-viewport animated hero backgrounds, with preset JSON export for site embeds plus optional WebM and PNG exports.

## Context

- **Role:** Solo developer [inferred from codebase — sole git author `aryanjohari`; PROJECT.md describes a personal / learning project]
- **Dates:** Apr 2026 -- Jun 2026 [inferred from git history: first commit 2026-04-01, latest 2026-06-16]
- **Institution / org:** N/A (personal project per PROJECT.md)
- **Links:** https://github.com/aryanjohari/web-image-editor — live demo URL not recorded in repo [VERIFY]

## Problem

Landing pages and portfolios often need ambient, performant animated hero backgrounds without baking video or using desktop compositing tools. This project lets a user optionally upload a hero texture and overlay, tune parametric visual effects in real time on the GPU, and export structured preset JSON that can be embedded on another site. Secondary outputs are a WebM loop for demos and a PNG poster frame. GPU-rendered preview text in the lab is layout-only; production sites are expected to render HTML above the canvas.

## Your contributions

- Built the project solo from initial scaffold (Apr 2026) through phased feature work (Jun 2026); 25 commits, single author in git history [inferred from codebase]
- Implemented a single-pass WebGL compositor: one full-screen quad, one `ShaderMaterial`, one 464-line GLSL fragment shader compositing hero texture → overlay → up to four preview text slots [inferred from codebase]
- Authored per-layer effect bundles (`LayerEffectParams`: melt, bleed, noise, posterize, time scale, radial mask/twirl, duotone, halftone, scanlines) with independent uniform banks keyed `L0` / `L1` / `T0–T3` in the shader [inferred from codebase]
- Built Zustand store (`useSynthStore`) for textures, decal transforms, layer effects, text layers, and UI panel state [inferred from codebase]
- Integrated React Three Fiber scene (`SynthCanvas`, `SynthMaterial`) with per-layer time uniforms driven by R3F clock or export timeline override (`window.__SYNTH_EXPORT_TIME__`) [inferred from codebase]
- Implemented hero texture and overlay upload (PNG/JPEG/WebP), object-fit-contain letterboxing in shader, and canvas drag placement for overlay and selected text layer [inferred from codebase]
- Built preset system v2 (`PRESET_SCHEMA_VERSION = 2`) with v1 backward compatibility: validate, build, hydrate, snapshot, gather export, and multiple apply modes (full style, effects-only, patch merge) [inferred from codebase]
- Authored 14 bundled background looks (7 featured ambient + 7 legacy) in `presetCatalog.ts`, plus keyword mood mapping (`mapMoodToPreset`) and optional AI mood director [inferred from codebase]
- Implemented optional AI mood flow: Vercel serverless handler (`api/mood.ts`) calling OpenAI Chat Completions API, server-side JSON validation (`parseAiMoodResponse`), client keyword fallback on failure [inferred from codebase]
- Built three client routes on one shared canvas: `/` living demo with mood input, `/lab` Background Studio panel (Source / Look / Tune / Export / Advanced), `/story` embed case study [inferred from codebase]
- Implemented exports: preset JSON (clipboard/download/import with validation), WebM loop via `MediaRecorder` + `captureStream`, PNG poster via 2D canvas draw from WebGL buffer [inferred from codebase]
- Added semantic slider controls mapping to partial preset patches (`semanticSlidersToPatch`) and in-app formula glossary (`formulaCatalog.ts`, `FormulaPanel`, `MATH.md`) [inferred from codebase]
- Wrote Vitest unit tests (8 test files, 82 tests) for preset validation, patch apply, mood mapping, AI response parsing, semantic sliders, and share URL helpers — all passing [inferred from codebase]
- Documented architecture and embed porting guide in README.md, PROJECT.md, MATH.md, and `src/lib/preset/PORTING.md` [inferred from codebase]
- Configured SPA deploy fallbacks for Vercel (`vercel.json`) and Netlify (`public/_redirects`); Vite dev proxy for `/api/mood` to local `vercel dev` [inferred from codebase]

## Tech stack

React 19, TypeScript, Vite 8, Three.js, React Three Fiber, @react-three/drei, Zustand, GSAP, Tailwind CSS, GLSL (vite-plugin-glsl), react-router-dom, Vitest, ESLint, PostCSS, Autoprefixer, Vercel serverless functions, OpenAI Chat Completions API (via `fetch`, no OpenAI SDK in dependencies)

## Architecture (optional but helpful)

Single-page app with client-side routing (`App.tsx` → `LandingShell`, `LabShell`, `StoryShell`). Shared `SynthCanvasView` renders one R3F `<Canvas>` with `preserveDrawingBuffer` for PNG export.

**Data flow:** file upload → `TextureLoader` / `decalTexture` / `textUtils` → Zustand store → `SynthMaterial` seeds and updates uniforms each frame via `useFrame` → `fragment.glsl` warps UVs, samples textures, shades per layer, alpha-composites.

**Key directories:**
- `src/webgl/` — R3F scene, `SynthMaterial`, GLSL shaders
- `src/store/` — Zustand store, layer effect defaults, text layer types
- `src/lib/preset/` — preset schema, validate, apply, hydrate, export
- `src/lib/mood/` — keyword mood map, AI fetch/apply, system prompt builder
- `src/lib/export/` — PNG and WebM capture
- `src/components/controls/` — studio panel UI (StackPanel, sliders, export)
- `src/data/` — preset catalog, bundled looks, formula glossary
- `api/` — Vercel serverless mood endpoint

**Deploy model:** static SPA after `npm run build`; optional `/api/mood` serverless on Vercel when `OPENAI_API_KEY` is set. Netlify static deploy supports keyword mood only (no API route).

## Outcomes & metrics (verified only)

| Metric | Value | How measured | Notes |
|--------|-------|--------------|-------|
| Vitest tests | 82 passed | `npm test` (2026-07-02) | 8 test files |
| Git commits | 25 | `git rev-list --count HEAD` | Solo author |
| Bundled background looks | 14 | `presetCatalog.ts` | 7 featured + 7 legacy |
| Max preview text layers | 4 | `MAX_TEXT_LAYERS` in `textLayers.ts` | Lab preview only |
| Preset schema version | 2 (v1 supported) | `PRESET_SCHEMA_VERSION` in `types.ts` | |
| Fragment shader size | 464 lines | `wc -l fragment.glsl` | Single-pass compositor |
| TypeScript source files | 66 | `find src -name '*.ts' -o -name '*.tsx'` | |
| Approx. TS/TSX lines | ~6,889 | `wc -l` on src `*.ts` / `*.tsx` | Includes tests |
| Production JS bundle (gzip) | 335.97 kB | `npm run build` output | Single chunk warning >500 kB |
| Layer effect parameters per layer | 16 | `LayerEffectParams` type | melt through scanlines |
| Formula glossary entries | 11 | `formulaCatalog.ts` | |
| Client routes | 3 | `/`, `/lab`, `/story` | Unknown paths redirect to `/` |
| CI pipeline | not recorded | No `.github/workflows` or other CI config in repo | |
| Production users / traffic | not recorded | | |
| Live deployment URL | not recorded | README uses placeholder `your-deploy.com` | [VERIFY] |

## Keywords for tailoring

WebGL, GLSL, fragment shader, Three.js, React Three Fiber, real-time graphics, GPU compositing, image processing, preset system, JSON schema, Zustand, TypeScript, Vite, SPA, canvas export, MediaRecorder, OpenAI API, serverless, mood mapping, parametric design, hero background, landing page

## Do not claim

- Production traffic, user counts, or commercial adoption (not recorded)
- Team size or collaboration beyond solo authorship
- Enterprise clients or paid product
- CI/CD automation (no workflow files in repo)
- OpenAI SDK usage (API called via raw `fetch` in `api/mood.ts`)
- Multi-pass framebuffer pipeline (explicitly single-pass by design)
- Audio-reactive backgrounds (listed as future direction only)
- Hosted API product (one optional mood endpoint for deploy convenience)
- GPU text as production typography (docs state HTML above canvas for real sites)
- Internationalization (English-first UI per PROJECT.md known limits)
- Portfolio site integration shipped from this repo (PROJECT.md defers separate portfolio site)

## Suggested CV tags

`webgl, shaders, typescript, react`

## Open questions for Aryan

- Is there a live Vercel or Netlify deployment URL to record?
- Should dates be listed as Apr 2026 -- present if work continued after 2026-06-16 (including uncommitted local changes)?
- Was this built for a portfolio showcase, coursework, or another context beyond "personal / learning project"?
- Do you want to claim "deployed to production" or "demo / portfolio project only"?
- Any verified metrics to add (e.g. Lighthouse scores, interview demo usage, embed on a live personal site)?
- Should the CV project name be **Background Studio**, **web-image-editor**, or **The Algorithm Engine**?
