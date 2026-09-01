# I5 — Changelog (living receipt)

**Branch:** `rewrite/v1-styling`  
**Slice:** M06 look library & poster craft

| Date | Slice | Status | Paths | Notes |
|------|-------|--------|-------|-------|
| 2026-09-01 | S0 | DONE | `I5_M06_IMPLEMENT_PLAN.md`, this file | Plan + living receipt |
| 2026-09-01 | S1 | DONE | `effectsRegistry`, `blur.frag`/`mixMask.frag`, `textured.frag`, `renderer.ts` | blur ping-pong; grain.size; global+regional merge |
| 2026-09-01 | S2 | DONE | `sliders.ts`, `regionalSliders.ts` | blur, grain_size, bg_blur |
| 2026-09-01 | S3 | DONE | 8× `src/packs/*.json`, catalog, types | family + axes + regionalDefaults |
| 2026-09-01 | S4 | DONE | `applyPack`, `textPresets`, Lab type layout | textHints; 3 pos / 2 presets |
| 2026-09-01 | S5 | DONE | `Lab.tsx`, `styles.css` | family groups; axes-first knobs |
| 2026-09-01 | S6 | DONE | `src/talk/*` | 8 packs; new sliders; setTextHint |
| 2026-09-01 | S7 | DONE | `composeToFbos` + export temp FBO C | same blur path as preview |
| 2026-09-01 | S8 | DONE | tests + this file | `npm test` + `npm run build` green |

## OPEN defaults

| Item | Default | Why |
|------|---------|-----|
| Blur policy | Blur full graded main, then `mix(blurred, sharp, mask)` for regional bg | M06 §4.3; subject stays sharp |
| Global+regional merge | When mask active, merge `main.effects` into each regional branch (regional overrides same op id) | Pack craft needs global grade + regional mute |
| grain.size identity | 0.5 when ensureEffect / intensity 0 | Mid character; optional in registry |
| Blur radius | `amount * 16` px at view/export resolution | Visible soft bg without mush |
| textHints placeholder | "Prism" if creating text for poster pack | User-authored content preferred |
| ENGINE_VERSION | unchanged `0.2.0` | blur is registry effect; textHints are pack-only |

## Falsifiers

| # | Result |
|---|--------|
| F1 | §14 five looks — **manual** (checklist below; operator smoke) |
| F2 | Pack distinctness — **unit** (`packs.test.ts`) |
| F3 | blur in dusk-grain + muted-split — **unit** |
| F4 | No free effects UI — architecture (pack axes only) |
| F5 | 3 positions / 2 presets — code (`TEXT_POSITIONS`, `TYPE_PRESETS`) |
| F6 | talk≡sliders — **unit** (normalize + applyTalk) |
| F7 | export≡preview — **manual** (shared `composeToFbos`) |
| F8 | dusk-grain ≠ generative Lofi Dusk — honest limits |

## Honest limits

- No bloom / rim / invented bokeh; dusk-grain is parametric grade + grain + bg blur
- Halftone / chromatic / LUT PARK
- One person mask; no free effect shopping
- Minimal type only (3 positions, 2 presets) — not Canva
- CI does not run WebGL; blur/grain visual checks are manual
- Ready for **thin UI polish only** — no more craft research

## Screenshot checklist (M06 §14)

Operator: upload portrait → apply each pack → glance 5s → tick.

| # | Look | Pass? | Notes |
|---|------|-------|-------|
| 1 | warm-film | PENDING | Scanner warmth + grain; optional mask mute |
| 2 | flash-raw | PENDING | Harsh contrast / disposable punch |
| 3 | muted-split | PENDING | **Needs portrait + mask**; soft muted bg |
| 4 | editorial-bw | PENDING | Print B&W + paper grain |
| 5 | poster-punch + text | PENDING | Duotone + textHints bottom-left / sans-bold |

Bonus: dusk-grain, cool-chrome, clean-editorial — PENDING.

## Operator

```bash
npm install && npm test && npm run build && npm run dev
# muted-split needs portrait + mask
# poster-punch: pack applies textHints (or edit text) → export PNG
# Confirm export PNG soft-bg matches Lab for muted-split / dusk-grain
```
