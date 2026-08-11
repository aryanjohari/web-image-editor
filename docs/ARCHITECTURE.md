# Architecture — Background Studio → Stage

> **Direction:** This document describes the **implemented** system. Product north star for **Stage** lives in [`DIRECTION.md`](DIRECTION.md). OpenAPI: [`api/stage-v1.openapi.yaml`](api/stage-v1.openapi.yaml). Types: [`../src/lib/stage/`](../src/lib/stage/).

## Premise

**Background Studio** (*The Algorithm Engine*) is a browser live-background designer. Stage extends it into a **visual automation module**: brand kit + constrained Gemini brief → validated look patch / StageRecipe; campaign pack ZIP on the client; Jobs API for other modules; embed helper for live recipes behind HTML.

## Goals and non-goals

**Goals**

- Design site-safe animated heroes that read well behind HTML content.
- Keep the GPU path minimal: one full-screen quad, one `ShaderMaterial`, one fragment program.
- Ship an embeddable **coefficient contract** (preset v2 + StageRecipe v3) so looks travel without a DCC tool.
- Expose a keyed `/api/v1` Jobs API so SEO/web modules can `brief + brandId → recipe`.

**Non-goals**

- Multi-pass bloom / depth / post stacks.
- Durable multi-tenant DB / SaaS billing (Phase 4 store is **in-memory**).
- Replacing HTML typography on production sites with shader text.
- Publishing a standalone npm WebGL player (in-repo helper + PORTING checklist).

## Unique approach

- **Per-layer effect banks in one draw.** Hero, overlay, and preview text each get their own warp/shade uniforms (`L0` / `L1` / `T0–T3`) while compositing in a single fragment pass.
- **Presets / recipes are inputs, not pixels.** JSON stores numbers, transforms, optional assets. GPU hydrate stays SynthPreset v2 via Stage adaptors.
- **Apply modes** — effects-only, style, full import, runtime patches for mood/AI.
- **Brief as constrained LLM** — Gemini returns `{ patch, summary?, baseLookId? }`; client/server allowlist + brand clamps; keyword mood fallback.
- **Jobs API** — in-memory brands/jobs; sync job returns `succeeded` + StageRecipe; pack ZIP remains client-side.

## Canonical diagrams (C4)

| Level | Link |
|-------|------|
| Index + zoom path | [`docs/c4/README.md`](c4/README.md) |
| C1 Context | [`docs/c4/1-context.md`](c4/1-context.md) · [`1-context.mmd`](c4/1-context.mmd) |
| C2 Containers | [`docs/c4/2-containers.md`](c4/2-containers.md) · [`2-containers.mmd`](c4/2-containers.mmd) |
| C3 `studio-spa` | [`docs/c4/3-components/studio-spa.md`](c4/3-components/studio-spa.md) |
| C3 `stage-api` | [`docs/c4/3-components/stage-api.md`](c4/3-components/stage-api.md) |
| C3 `mood-api` (legacy name) | [`docs/c4/3-components/mood-api.md`](c4/3-components/mood-api.md) |
| Portfolio zoom index | [`docs/c4/portfolio-map.json`](c4/portfolio-map.json) |

Declared in root [`portfolio.yaml`](../portfolio.yaml).

## System overview

Deployable pieces: **SPA** (browser), **stage-api** on Vercel (`/api/brief`, `/api/mood`, `/api/v1/*`). No durable database — API Maps wipe on cold start; lab brand kit uses `localStorage`.

**Routes:** `/` living demo, `/lab` studio, `/story` case study, `/embed-demo` StageRecipe behind HTML.

## Key modules (pointers)

| Piece | Role |
|-------|------|
| `src/shells/*` | Landing, lab, story, embed-demo |
| `src/store/useSynthStore.ts` | Textures, synth params, layer effects |
| `src/webgl/*` | R3F canvas + SynthMaterial + GLSL |
| `src/lib/preset/*` | Build, validate, hydrate, apply, PORTING |
| `src/lib/stage/*` | StageRecipe, brand, brief, pack, embed, server Jobs store |
| `api/brief.ts`, `api/mood.ts` | Keyless Gemini brief/mood for lab/landing |
| `api/v1/*` | Keyed brands + jobs (in-memory) |
| `src/lib/export/*` | PNG / WebM / STORED zip |

Embed: [`src/lib/stage/EMBED.md`](../src/lib/stage/EMBED.md) · [`src/lib/preset/PORTING.md`](../src/lib/preset/PORTING.md).

## Data / control flow

1. **Lab brief** — Brand (localStorage) + brief → `POST /api/brief` → patch → apply look + patch on canvas → optional campaign pack ZIP.
2. **Jobs API** — Module key → create brand in memory → `POST /api/v1/jobs` → Gemini → StageRecipe on Job `succeeded`.
3. **Render** — Zustand → uniforms → single-pass shader.
4. **Embed demo** — Bundled StageRecipe → `applyStageRecipeJson` → canvas under HTML (`pointer-events: none`).

## Notable implementation details

- **Contain math in GLSL** — letterbox hero like CSS `object-fit: contain`.
- **API auth** — `STAGE_API_KEY` / `STAGE_API_KEYS`; Bearer or `X-Stage-Key`; health public.
- **Lab vs API brands** — separate stores; copy JSON manually if needed.
- **`preserveDrawingBuffer: true`** — PNG / pack capture.

## Tradeoffs and limitations

- In-memory Jobs API is dogfood-only (cold-start wipe).
- Compositor still L0+L1+text; N-image recipes export but only primary hero/overlay bind GPU.
- Shared Zustand across routes (landing re-inits hero).
- Netlify static hosts SPA only (`/api/*` needs Vercel).

## How to verify locally

See [README.md](../README.md) for install, env, curl smoke, and scripts.

## Related

- [`DIRECTION.md`](DIRECTION.md) — Phase status 0–5
- [`api/AUTH.md`](api/AUTH.md) — API keys
- [`MATH.md`](../MATH.md) — GPU glossary
