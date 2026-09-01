# I5 — M06 Implement Plan

**Date:** 2026-09-01  
**Branch:** `rewrite/v1-styling`  
**Status:** DONE  
**Binding:** `docs/modules/M06_LOOK_LIBRARY_AND_POSTER_CRAFT.md` (L1–L14, F1–F8)

---

## Scope

**In:** `blur` op + ping-pong path (regional bg preferred); `grain.size`; 8-pack catalog with `family` / `axes` / `regionalDefaults` / `textHints`; global `blur` + `grain_size` + regional `bg_blur`; minimal type (3 positions, 2 presets); talk enums; export parity; screenshot checklist receipt.

**Out:** Full Lab visual redesign; halftone / chromatic / bloom / LUT / multi-mask / inpaint; free effect shopping; 9th pack; layout builder / font marketplace.

---

## Architecture

```text
docs/reviews/
  I5_M06_IMPLEMENT_PLAN.md
  I5_CHANGELOG.md

src/recipe/effectsRegistry.ts     ← blur; grain.size
src/compositor/
  shaders/blur.frag.glsl           ← separable neighborhood
  shaders/mixMask.frag.glsl        ← mix(blurred, sharp, mask)
  shaders/textured.frag.glsl       ← grain.size
  renderer.ts                      ← ping-pong blur before overlay/text
src/packs/
  *.json × 8
  types.ts / catalog.ts
  sliders.ts / regionalSliders.ts
  applyPack.ts                     ← textHints
src/app/Lab.tsx                    ← family groups; axes-first; text position/preset
src/talk/*                         ← pack + slider enums
src/compositor/textRaster.ts       ← type presets
```

### Blur policy (M06 §4.3)

1. Pointwise grade (global merged into regional branches when mask active).
2. If `blur.amount` > 0: separable ping-pong on graded main.
3. **Regional bg:** blur full graded result, then `mix(blurred, sharp, mask.r)` so subject stays sharp.
4. Overlay / text composite after blur.
5. Export uses `composeToFbos` — same path (F7).

---

## Slice checklist

| # | Slice | Done when |
|---|-------|-----------|
| S0 | Plan + changelog stubs | Receipt files |
| S1 | Registry + grain.size + blur shader/ping-pong | Units; manual blur visible |
| S2 | Sliders blur / grain_size / bg_blur | Unit PathPatch identity |
| S3 | 8 pack JSON + catalog + applyPack | Units; pack distinctness |
| S4 | textHints + positions + 2 type presets | poster-punch with text |
| S5 | Lab pack-first (family + axes filter) | Minimal; no redesign |
| S6 | Talk enums + normalize/apply | New packs/sliders; refuse unchanged |
| S7 | Export parity + missing-mask honesty | F7 manual |
| S8 | Screenshot checklist + receipt | §14 five looks documented |

All slices **DONE** (F1/F7 visual = operator PENDING in changelog).

---

## Pack list (locked)

| id | Family |
|----|--------|
| warm-film | film |
| dusk-grain | film |
| flash-raw | portrait-split |
| cool-chrome | film |
| editorial-bw | editorial |
| clean-editorial | editorial |
| muted-split | portrait-split |
| poster-punch | poster |

---

## Falsifiers

| # | Gate |
|---|------|
| F1 | Named looks read at a glance — manual §14 |
| F2 | Pack distinctness — unit + manual |
| F3 | blur used by dusk-grain + muted-split defaults |
| F4 | No free effect UI — architecture |
| F5 | 3 positions / 2 presets only |
| F6 | talk≡sliders — unit |
| F7 | export≡preview blur/grain — manual |
| F8 | dusk-grain parametric naming — honest limits |

---

## Operator

```bash
npm install && npm test && npm run build && npm run dev
# muted-split needs portrait + mask
# poster-punch: add/edit text → export PNG
```
