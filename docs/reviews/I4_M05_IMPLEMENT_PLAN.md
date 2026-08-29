# I4 — M05 Implement Plan

**Date:** 2026-08-29  
**Branch:** `rewrite/v1-styling`  
**Status:** DONE  
**Binding:** `docs/modules/M05_MASKS_AND_REGIONAL_GRADE.md` (M1–M17, F1–F8)

---

## Scope

**In:** `maskRef` + `regional.{subject,background}` schema (`engineVersion 0.2.0`); MediaPipe SelfieSegmenter worker → grayscale PNG (R=subject weight) in IDB; auto mask on main upload + Regenerate; single-pass dual-grade in `textured.frag.glsl`; 4 regional sliders; PathPatch allowlist; `listMissingAssets` mask role; Lab mask chip + regional slider group; unit tests (no WebGL/MediaPipe in CI).

**Out:** SAM2/server BiRefNet; multi-mask; mask on overlay/text; inpaint; talk regional tools (`set_regional_slider`, `apply_regional_preset`, `regenerate_mask`); pack `regionalDefaults`; vision tags; poster/layout (M06).

---

## Architecture

```text
docs/reviews/
  I4_M05_IMPLEMENT_PLAN.md
  I4_CHANGELOG.md

src/masks/
  types.ts
  encodeMaskPng.ts
  segment.worker.ts
  segment.ts
  index.ts

src/packs/
  regionalSliders.ts
  regionalSliders.test.ts

src/recipe/
  types.ts              ← RegionalGrade; ENGINE_VERSION 0.2.0
  validate.ts           ← maskRef+regional @ ≥0.2.0
  pathPatch.ts          ← /maskRef, /regional/.../effects/...

src/compositor/
  textured.frag.glsl    ← u_mask, dual applyGrade, mix()
  renderer.ts           ← mask bind; regional uniform sets

src/export/
  missingAssets.ts      ← mask role
  png.ts                ← fail closed on missing mask

src/app/Lab.tsx         ← segment hook; mask UI; regional sliders
```

---

## Slice checklist

| # | Slice | Done when |
|---|-------|-----------|
| S0 | Plan + changelog | Receipt files |
| S1 | Types + validate + engineVersion 0.2.0 | Unit tests; Tier A recipes still pass |
| S2 | PathPatch allowlist + regional slider helpers | Unit tests |
| S3 | Mask worker + IDB + upload hook | Manual: upload portrait → mask asset + maskRef |
| S4 | Shader + renderer dual-grade | Manual: subject/bg split visible |
| S5 | Lab UI (status, regenerate, 4 sliders) | Dual-path: no mask = global sliders work |
| S6 | Export missing-mask + PNG parity | Unit preflight + manual F4 |
| S7 | Tests + receipt | `npm test` + `npm run build` green |

---

## Locks (M05)

| Lock | Choice |
|------|--------|
| Mask storage | IDB PNG, R=subject weight, native main resolution |
| Recipe | `main.maskRef` + `main.regional.{subject,background}` |
| No mask | Tier A flat `main.effects[]` |
| Compositor | Regional grade on main before overlay/text |
| Segmenter | MediaPipe SelfieSegmenter landscape WASM worker |
| Fail closed | Missing mask with `maskRef` → no draw/export |

---

## Falsifiers

| # | Gate |
|---|------|
| F2 | Hair/glass — manual |
| F3 | Missing mask no export — unit + compositor |
| F4 | PNG = preview — manual |
| F5 | Talk regional — N/A (PARK I4b) |
| F6 | Tier A backward compat — unit |
| F7 | Not a layer — architecture |
| F8 | No inpaint — refuse unchanged |

---

## Operator

```bash
npm install
npm test
npm run build
npm run dev   # upload portrait → auto mask → regional sliders
```
