# I1 — M02 Implement Plan

**Date:** 2026-08-23  
**Branch:** `rewrite/v1-styling`  
**Status:** DONE  
**Binding:** `docs/modules/M02_PACKS_AND_SLIDERS.md` (P1–P12, §§4–7)

---

## Scope

**In:** Tier A pack catalog (3 JSON packs), `applyPack` + intensity lerp, semantic sliders → PathPatch, Lab pack/slider UI, main-fragment grade GLSL wired to effects registry, falsifiers F1–F5.

**Out:** M03 LLM/talk, M04 export/hero/hash, masks, packs beyond the trio, design-system UI, reopening M00/M01 architecture.

---

## Architecture

```text
src/packs/
  editorial-bw.json | warm-film.json | poster-punch.json
  types.ts | catalog.ts | applyPack.ts | sliders.ts | index.ts
  packs.test.ts

src/compositor/shaders/textured.frag.glsl  ← grade chain (main only)
src/compositor/renderer.ts                 ← uniforms from main.effects
src/app/Lab.tsx                            ← pack picker + intensity + 7(+1) sliders + peek
```

### Data flow

```text
Pack apply:  loadCatalog → merge mainEffects (+ optional overlay opacity/blend)
             → keep AssetRefs / text → set packId/packVersion → validateRecipe

Intensity:   lerp numeric pack params → identity defaults; recipe stores absolute values

Slider:      ensureEffect(id) on main → PathPatch
             /objects/main/effects/{i}/params/{key} → validateRecipe

GPU:         main sample → exposure→contrast→sat→temp→fade|duotone→vignette→grain
             → composite overlay → text (unchanged draw order)
```

### OPEN defaults (non-blocking)

| Item | Choice |
|------|--------|
| Fade math | Lift toward light gray: `mix(rgb, vec3(0.92), amount*0.35) + amount*0.04` |
| Grain seed | UV hash only (no per-frame time); stable preview |

---

## Slice checklist

| # | Slice | Done when | Status |
|---|-------|-----------|--------|
| S0 | Plan docs | `I1_M02_IMPLEMENT_PLAN.md` + `I1_CHANGELOG.md` | DONE |
| S1 | Pack JSON + loader | 3 packs; validated against `TIER_A_EFFECTS` | DONE |
| S2 | `applyPack` + intensity | Absolute params; AssetRefs preserved | DONE |
| S3 | `ensureEffect` + sliders | PathPatch → validate; main only | DONE |
| S4 | Lab UI | Pack picker, intensity, 7(+duotone) sliders, recipe peek | DONE |
| S5 | Grade GLSL | Fixed op order; missing = identity | DONE |
| S6 | F1–F5 + tests | Manual checklist + `npm test` green; changelog | DONE |

---

## Falsifiers

| # | Criterion | Result |
|---|-----------|--------|
| F1 | Apply pack → pixels change | Manual lab |
| F2 | Move slider → recipe field + pixels change | Unit + manual |
| F3 | Apply pack → asset ids preserved | Unit |
| F4 | Illegal PathPatch / OOR rejected | Unit |
| F5 | Packs differ in ≥1 `mainEffects` param | Unit |

---

## Operator

```bash
npm test
npm run dev
```
