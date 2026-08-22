# I1 — Changelog (living receipt)

**Branch:** `rewrite/v1-styling`  
**Slice:** M02 packs + semantic sliders + grade GLSL

| Date | Slice | Status | Paths | Notes |
|------|-------|--------|-------|-------|
| 2026-08-23 | S0 | DONE | `docs/reviews/I1_M02_IMPLEMENT_PLAN.md`, this file | Plan + living receipt |
| 2026-08-23 | S1 | DONE | `src/packs/*.json`, `catalog.ts` | `editorial-bw`, `warm-film`, `poster-punch`; validated vs `TIER_A_EFFECTS` |
| 2026-08-23 | S2 | DONE | `applyPack.ts` | Intensity lerp → absolute params; AssetRefs preserved |
| 2026-08-23 | S3 | DONE | `sliders.ts` | `ensureEffect` + PathPatch → `validateRecipe`; main only |
| 2026-08-23 | S4 | DONE | `Lab.tsx`, `styles.css` | Pack picker, intensity, 7(+duotone) sliders, recipe peek |
| 2026-08-23 | S5 | DONE | `textured.frag.glsl`, `renderer.ts` | exposure→contrast→sat→temp→fade\|duotone→vignette→grain |
| 2026-08-23 | S6 | DONE | `packs.test.ts`, this file | 29 tests green; F1–F5 covered (F1 manual in lab) |

## OPEN defaults (picked for I1)

| Item | Default | Why |
|------|---------|-----|
| Fade math | Lift toward light gray: `mix(rgb, vec3(0.92), amount*0.35) + amount*0.04` | Soft blacks; simple film lift |
| Grain seed | UV-space hash only (no `u_time`) | Stable preview; export parity deferred to M04 |

## Falsifiers

| # | Result |
|---|--------|
| F1 | Apply pack → pixels change — **manual** (`npm run dev`: upload → pick pack) |
| F2 | Slider → recipe field changes — **unit** (`applySemanticSlider`) + manual pixels |
| F3 | Apply pack → asset ids preserved — **unit** |
| F4 | Illegal PathPatch / OOR rejected — **unit** |
| F5 | Packs differ in ≥1 `mainEffects` param — **unit** |

## Honest limits

- Overlay/text do not receive main grade chain (M02 P10).
- Duotone shadow/highlight hex are pack defaults; no color pickers in lab.
- Non-`normal` blend modes still approximate (I0 limit).
- No M03 talk, no M04 export/hash.

## Operator

```bash
npm test
npm run dev
```
