# I0 — M00+M01 Implement Plan

**Date:** 2026-08-23  
**Branch:** `rewrite/v1-styling`  
**Status:** DONE

Blank-slate branch: app tooling and `src/` created from scratch. Ideas adapted lightly from `main` validate style (custom fail-closed errors) — Stage/R3F shell was not restored.

---

## Scope

**In:** M00 Tier A compositor shell (1 main + 1 overlay + 1 text); M01 recipe types, `validateRecipe`, PathPatch, IndexedDB assets; minimal lab smoke UI; Vitest units for S2–S4; review receipts.

**Out:** M02 packs catalog, M03 talk/LLM, M04 export/hero/hash polish, masks, multi-layer beyond Tier A caps, neural shading, Stage/Canva features.

---

## Architecture decision

### Stack (chosen)

**Vite + TypeScript (strict) + React 19 (lab shell only) + raw WebGL2 compositor — no Three.js / R3F.**

| Choice | Why |
|--------|-----|
| Raw WebGL2 | Constitutional floor (`02_CONSTITUTION.md` §7.1); M00 hybrid is textured quads |
| React light shell | File inputs, text, error banner; recipe in React state + pure modules |
| Reject R3F/EffectComposer | M00 Option C rejected |
| Custom TS validate | Fail-closed error codes / PathPatch identity |
| Vitest + `fake-indexeddb` | Unit tests for recipe + IDB without browser GL |

### Module map

```text
src/
  recipe/       types, validate, pathPatch, identityRecipe, effectsRegistry
  assets/       idb store (put/get/list/delete)
  compositor/   renderer, gl, shaders, textRaster, textureUpload
  app/          Lab UI + ErrorBanner
```

### Citations (Phase A)

| Topic | Cite |
|-------|------|
| Modular compositor | kampos / Wix eng; Lumen; FILTR as promotion path |
| Parity / effects[] | VideoFlow stacking + renderers |
| Premul alpha | WebGL Fundamentals alpha; Porter–Duff |
| IDB Blobs | Boyko IDB; fake-indexeddb |
| PathPatch | M01 R9; FIBO validated JSON |

Binding: `docs/modules/M00_COMPOSITOR.md` C1–C10; `docs/modules/M01_RECIPE_SCHEMA.md` R1–R15.

---

## Slice checklist

| # | Slice | Done when | Status |
|---|-------|-----------|--------|
| S0 | Tooling | Vite+TS+React, Vitest, ESLint, `npm test` green | DONE |
| S1 | Recipe types | Recipe, Object, AssetRef, TextSource, Effect, PathPatch | DONE |
| S2 | validateRecipe | Caps, blends, effects registry; unit tests | DONE |
| S3 | PathPatch apply | Allowlist + merge + validate; unit tests | DONE |
| S4 | IndexedDB assets | put/get/list/delete; missing id errors; tests | DONE |
| S5 | Compositor shell | WebGL2 canvas; clear; fullscreen quad | DONE |
| S6 | Main image draw | Upload → IDB → recipe main → textured quad | DONE |
| S7 | Overlay + text | Overlay + text raster→texture→composite | DONE |
| S8 | Lab smoke UI | Upload main/overlay, edit text; error banner | DONE |
| S9 | Receipt | CHANGELOG + slices DONE; honest limits | DONE |

---

## Falsifiers / acceptance

| Criterion | Result |
|-----------|--------|
| Upload main → canvas | YES (manual smoke via `npm run dev`) |
| Overlay + text composite | YES (premul over path) |
| validate + illegal PathPatch | YES (unit tests) |
| Reload IDB + recipe | YES (localStorage recipe + IDB blobs; loud MISSING) |
| Missing assetId → visible error | YES (ErrorBanner + fail clear) |
| `npm test` | PASS (21 tests) |
| Reviews updated | YES — see `I0_CHANGELOG.md` |

---

## OPEN / PARK

| Item | Status |
|------|--------|
| Full pointwise grade GLSL | PARK |
| True dst-aware multiply/screen/overlay | PARK (approx in I0) |
| URL hash / PNG export | PARK — M04 |
| Packs / LLM | PARK — M02 / M03 |

---

## Operator

```bash
npm install && npm test && npm run dev
```

Next: **M02** packs catalog over the same recipe schema.
