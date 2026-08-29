# I4 — Changelog (living receipt)

**Branch:** `rewrite/v1-styling`  
**Slice:** M05 masks & regional grade

| Date | Slice | Status | Paths | Notes |
|------|-------|--------|-------|-------|
| 2026-08-29 | S0 | DONE | `I4_M05_IMPLEMENT_PLAN.md`, this file | Plan + living receipt |
| 2026-08-29 | S1 | DONE | `src/recipe/{types,validate}.ts` | `ENGINE_VERSION 0.2.0`; `RegionalGrade`; maskRef+regional gate; one mask max |
| 2026-08-29 | S2 | DONE | `src/recipe/pathPatch.ts`, `src/packs/regionalSliders.ts` + tests | Allowlist `/maskRef`, `/regional/.../effects/...`; 4 regional sliders |
| 2026-08-29 | S3 | DONE | `src/masks/*` | MediaPipe worker; PNG encode; `segmentPersonMask`; `attachPersonMask` |
| 2026-08-29 | S4 | DONE | `textured.frag.glsl`, `renderer.ts` | `u_mask`; dual `applyGradeParams`; `mix(bg, sub, w)` |
| 2026-08-29 | S5 | DONE | `src/app/Lab.tsx`, `styles.css` | Auto mask on upload; status chip; Regenerate; regional slider group |
| 2026-08-29 | S6 | DONE | `missingAssets.ts`, `png.ts` | Mask role in missing list; export fails closed on missing mask |
| 2026-08-29 | S7 | DONE | tests + this file | `npm test` + `npm run build` green |
| 2026-08-29 | I4b-S1 | DONE | `packs/types`, `catalog`, `applyPack`, `warm-film.json` | Pack `regionalDefaults`; seed regional when mask active |
| 2026-08-29 | I4b-S2–S5 | DONE | `src/talk/*`, `Lab.tsx` | Regional talk tools, context, regenerate_mask |
| 2026-08-29 | I4b-S6 | DONE | `I4b_M05_POLISH_IMPLEMENT_PLAN.md`, tests | F5 unit; PARK cleared |

## Library pin

| Item | Choice | Why |
|------|--------|-----|
| Segmenter | `@mediapipe/tasks-vision@1.0.1` | `vision_bundle.js` for worker `importScripts` |
| Asset hosting | `public/mediapipe/` (postinstall copy) | Same-origin; no CDN for bundle/WASM |
| Model | `selfie_segmenter_landscape` float16 | Person/bg split; ~250KB |

## OPEN defaults

| Item | Default | Why |
|------|---------|-----|
| Segmenter delegate | CPU in worker | Broader compatibility vs GPU delegate |
| Regional stacks | `{ subject: { effects: [] }, background: { effects: [] } }` | PathPatch paths include `/effects/` segment |
| Segmenter fail | Banner + global-only recipe | M05 soft-fail; no zero mask |
| Pack + regional | Pack writes global `effects[]`; when mask active, also seeds `regional` from `regionalDefaults` (intensity lerp) |

## Falsifiers

| # | Result |
|---|--------|
| F1 | RQ1 — **manual** |
| F2 | Hair/glass IG-good — **manual** |
| F3 | Missing mask no export — **unit** (`listMissingAssets`, `exportPng` preflight) |
| F4 | PNG = preview — **manual** (same shader + mask bind in export FBO) |
| F5 | Talk ≡ regional sliders — **unit** (`talk/regional.test.ts`, `applyRegionalSlider`) |
| F6 | Tier A backward compat — **unit** (`engineVersion 0.1.0`, no maskRef) |
| F7 | Mask not a layer — architecture (`sampler2D u_mask`, not object kind) |
| F8 | No inpaint — unchanged refuse path (M03) |

## Honest limits

- SAM2 / server BiRefNet / remove.bg — PARK
- Vision tags in `meta` — PARK
- Person-only; one mask on main; no mask on overlay/text
- MediaPipe cold start loads bundle + WASM from `/mediapipe/` (same origin); model still from `storage.googleapis.com`
- CI does not run WebGL or MediaPipe (worker bundled; tests mock schema/sliders/missing assets)

## Operator

```bash
npm install
npm test
npm run build
npm run dev   # upload portrait → auto mask → regional sliders
```

1. Upload a portrait on **Main image** — mask chip should move `generating` → `ready`.
2. Adjust **Regional sliders** (bg mute / fade, subject pop / color).
3. **Regenerate mask** after edits if segmentation looks off.
4. Export PNG — includes regional grade when mask resolves; blocked when mask asset missing.
