# Architecture — Prism

> **Status:** v1 shipped on `rewrite/v1-styling`. This document describes the **implemented** still-image styling system. North star: [`VISION.md`](VISION.md). Constitution: [`02_CONSTITUTION.md`](02_CONSTITUTION.md).

## Premise

Prism is a **personal lab + sometimes-used tool** for parametric still-photo looks. Upload a photo, apply a named pack, tune semantic (and optional regional) sliders, optionally route intent through talk, then export a truthful **PNG** and a **serializable recipe**. The same recipe can sit behind HTML as a quiet hero (`/hero`) — heroes are a *use*, not a site-builder product.

**North star law:** LLM is a small router (intent → validated JSON patch). GPU does deterministic math. No pixels in the prompt. Talk, sliders, and canvas edits all write the **same recipe**.

## Goals and non-goals

**Goals** (from [`02_CONSTITUTION.md`](02_CONSTITUTION.md))

- Live, deterministic visual looks on existing still photos.
- One engine for lab preview, PNG export, and hero-lite embed.
- Closed packs and effect registry — named craft, not hidden magic.
- Fail closed on invalid patches, unknown ops, and schema drift.
- Research-gated modules (ADA-style) before code.

**Non-goals** (from constitution + [`00_FIELD_RESEARCH.md`](00_FIELD_RESEARCH.md) won’t-chase)

- Canva clone, Photoroom, Photoshop replacement, martech campaign packs.
- Generative inpaint, background invention, beauty retouch, neural shading.
- Site builder, Jobs API, animated hero martech (that was **Stage** on `main`).
- Sound-visualiser (time/VJ) or ADA (embodied agent) — siblings, not merges.

## Unique approach

| Principle | What it means in code |
|-----------|----------------------|
| **Recipe is truth** | `Recipe` JSON + `validateRecipe`; pixels are outputs | `src/recipe/*` |
| **Talk ≡ sliders ≡ canvas** | All paths call `applyPack`, `applySemanticSlider`, `applyRegionalSlider`, or allowlisted `PathPatch` | `src/talk/applyTalk.ts`, `Lab.tsx` |
| **Closed packs** | 8 JSON packs over `effectsRegistry`; axis-first Lab UI; no free effect shopping | `src/packs/*` |
| **One mask** | MediaPipe person segmenter → `maskRef` on main; regional grade split | `src/masks/*`, M05 |
| **No pixels in prompt** | `buildRecipeContext` sends text metadata only | `src/talk/context.ts` |

## Research → build pipeline

Modules gated implementation — not improvisation. Field research (`00`) posed RQs (e.g. RQ1 masks, RQ3 talk direction); module cards locked decisions before I* slices shipped code.

| Phase | Doc | Code receipt |
|-------|-----|--------------|
| Vision | [`VISION.md`](VISION.md) | — |
| Field research | [`00_FIELD_RESEARCH.md`](00_FIELD_RESEARCH.md) | RQs, won’t-chase list |
| Engine | [`01_ENGINE.md`](01_ENGINE.md) | Organs, Tier A caps |
| Constitution | [`02_CONSTITUTION.md`](02_CONSTITUTION.md) | Governing law |
| M00 Compositor | [`modules/M00_COMPOSITOR.md`](modules/M00_COMPOSITOR.md) | [I0](reviews/I0_CHANGELOG.md) |
| M01 Recipe schema | [`modules/M01_RECIPE_SCHEMA.md`](modules/M01_RECIPE_SCHEMA.md) | [I0](reviews/I0_CHANGELOG.md) |
| M02 Packs & sliders | [`modules/M02_PACKS_AND_SLIDERS.md`](modules/M02_PACKS_AND_SLIDERS.md) | [I1](reviews/I1_CHANGELOG.md) |
| M03 Talk router | [`modules/M03_TALK_ROUTER.md`](modules/M03_TALK_ROUTER.md) | [I3](reviews/I3_CHANGELOG.md) |
| M04 Export | [`modules/M04_EXPORT.md`](modules/M04_EXPORT.md) | [I2](reviews/I2_CHANGELOG.md) |
| M05 Masks & regional | [`modules/M05_MASKS_AND_REGIONAL_GRADE.md`](modules/M05_MASKS_AND_REGIONAL_GRADE.md) | [I4](reviews/I4_CHANGELOG.md) |
| M06 Look library | [`modules/M06_LOOK_LIBRARY_AND_POSTER_CRAFT.md`](modules/M06_LOOK_LIBRARY_AND_POSTER_CRAFT.md) | [I5](reviews/I5_CHANGELOG.md) |
| M07 Lab UX | [`modules/M07_LAB_UX_AND_CANVAS_CONTROL.md`](modules/M07_LAB_UX_AND_CANVAS_CONTROL.md) | [I6](reviews/I6_CHANGELOG.md) |
| Docs wrap-up | [I7 plan](reviews/I7_DOCS_WRAPUP_PLAN.md) | [I7](reviews/I7_CHANGELOG.md) |

Full module index: [`modules/README.md`](modules/README.md).

## Canonical diagrams (C4)

| Level | Link |
|-------|------|
| Index + zoom path | [`docs/c4/README.md`](c4/README.md) |
| C1 Context | [`c4/1-context.md`](c4/1-context.md) · [`1-context.mmd`](c4/1-context.mmd) |
| C2 Containers | [`c4/2-containers.md`](c4/2-containers.md) · [`2-containers.mmd`](c4/2-containers.mmd) |
| C3 Lab SPA | [`c4/3-components/lab-spa.md`](c4/3-components/lab-spa.md) |
| C3 Talk API | [`c4/3-components/talk-api.md`](c4/3-components/talk-api.md) |
| C3 Compositor | [`c4/3-components/compositor.md`](c4/3-components/compositor.md) |
| Portfolio zoom index | [`c4/portfolio-map.json`](c4/portfolio-map.json) |

Declared in root [`portfolio.yaml`](../portfolio.yaml).

## System overview

Deployable pieces:

1. **Lab SPA** — static Vite build; routes `/` and `/hero`.
2. **Talk API** — Vercel serverless `api/talk.ts` (+ Vite middleware in dev).
3. **Compositor** — browser WebGL2 (`src/compositor/renderer.ts`).
4. **IndexedDB** — local asset blobs (main, overlay, mask).
5. **MediaPipe worker** — person mask; assets from `public/mediapipe/`.

No durable server database. Recipe draft in `localStorage`; share hash `#r=` carries recipe only.

**Data flow:** upload → IDB → recipe objects → compositor draw → optional talk patch → export FBO readback → PNG + JSON.

## Key tradeoffs

| Choice | Why | Cost |
|--------|-----|------|
| **WebGL2 first** | Full control over grade chain, blur ping-pong, export FBO | No R3F/Three convenience; CI doesn’t run WebGL |
| **MediaPipe default** | On-device person mask; no server segmentation | One mask; person-only; cold WASM load |
| **Dev + prod talk API** | Shared `talkCore`; Vite plugin + Vercel handler | Must keep contracts in sync |
| **1+1+1 objects** | Tier A cap: main + overlay + text | Schema parses more; renderer honest about limits |
| **Closed 8-pack library** | Named craft, falsifiable demos (M06 §14) | No infinite catalog or LUT shopping |

## Verify / smoke

From I* changelogs — operator commands:

```bash
npm install
npm test
npm run build
npm run dev
```

**Lab loop:** upload portrait → pick pack → move sliders → optional talk with `GEMINI_API_KEY` → drag text → Download PNG / Recipe / Copy link.

**Mask:** portrait upload → auto mask → regional sliders (`muted-split` needs mask).

**Hero:** open `/hero` — bundled recipe, no export chrome.

**Talk (optional):** `cp .env.example .env` → set `GEMINI_API_KEY` → “more grain” / “apply dusk-grain” → recipe changes via same helpers as sliders.

**Export parity:** confirm PNG matches Lab for `muted-split` / `dusk-grain` (shared `composeToFbos`).

## What v1 does not do

- Generative edit, inpaint, background replace, beauty retouch
- Vision in talk (text context only)
- Multiple text layers, rotate gizmo, layer panel (M07 limits)
- Bloom, halftone, chromatic aberration, LUT stack (M06 PARK)
- SAM2 / server BiRefNet / remove.bg (M05 PARK)
- WebM, campaign ZIP, Jobs API, brand kit martech
- Durable multi-user backend or cloud asset sync

## Relation to Stage

**Stage** (Background Studio on `main`) pursued animated heroes, campaign packs, and a keyed Jobs API — martech automation, not still-photo parametric styling. Prism on `rewrite/v1-styling` is a **successor direction** for the **still-image** lane, not Stage 2.0. Pre-merge legacy is documented in [`archive/STAGE_ON_MAIN.md`](archive/STAGE_ON_MAIN.md).

## Related

- [`STATUS.md`](STATUS.md) — v1 closed receipt
- [`CV_BLURB.md`](CV_BLURB.md) — portfolio copy
- [`demo/README.md`](demo/README.md) — screenshot checklist
