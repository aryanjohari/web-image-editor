# I2 — Changelog (living receipt)

**Branch:** `rewrite/v1-styling`  
**Slice:** M04 export (PNG + recipe + hash + hero-lite)

| Date | Slice | Status | Paths | Notes |
|------|-------|--------|-------|-------|
| 2026-08-23 | S0 | DONE | `I2_M04_IMPLEMENT_PLAN.md`, this file | Plan + living receipt |
| 2026-08-23 | S1 | DONE | `src/compositor/renderer.ts`, `src/export/png.ts` | Export FBO @ main native (clamped); `readPixels` → flipY → PNG; fail closed missing main |
| 2026-08-23 | S2 | DONE | `textured.frag.glsl`, `effectsRegistry.ts`, `renderer.ts` | Text re-raster via height ratio; `grain.params.seed` optional; UV hash + seed; no `u_time` |
| 2026-08-23 | S3 | DONE | `recipeDownload.ts`, Lab dual button | Validated JSON download; optional PNG+JSON (no ZIP) |
| 2026-08-23 | S4 | DONE | `shareHash.ts`, Lab boot | `#r=` fflate zlib + base64url; budget 12 KiB; missing-asset reconnect UX |
| 2026-08-23 | S5 | DONE | `Lab.tsx`, `styles.css` | Download PNG / Recipe / Copy link + honesty line |
| 2026-08-23 | S6 | DONE | `Hero.tsx`, `App.tsx`, `public/hero/*` | `/hero` with `{type:"url"}`; pointer-events none; reduced-motion still |
| 2026-08-23 | S7 | DONE | `export.test.ts`, this file | Hash / missing-assets / flipY units; F1–F6 manual |

## Library pick

| Item | Choice | Why |
|------|--------|-----|
| Hash compressor | **fflate** (`zlibSync` / `unzlibSync`) | Small; Shaddy-class deflate for `#r=` |

## OPEN defaults (picked for I2)

| Item | Default | Why |
|------|---------|-----|
| Grain | UV hash + optional `grain.params.seed` (default 0); no `u_time` | Closes I1 OPEN; PNG ≡ preview |
| Hash budget | 12 KiB encoded payload | Mid of M04 8–16 KiB band |
| Export RT | Main native W×H, clamp `MAX_TEXTURE_SIZE` | E14 / X1 |

## Falsifiers

| # | Result |
|---|--------|
| F1 | PNG ≈ lab grade — **manual** (`npm run dev`: upload → pack → Download PNG) |
| F2 | PNG dims = native (clamped), not CSS canvas — **manual** (inspect file) |
| F3 | Missing main → export throws — **unit** (`listMissingAssets`) + manual |
| F4 | Hash + missing asset → blocked canvas + re-upload — **manual** / listMissing **unit** |
| F5 | Text scales with export/preview height ratio — **manual** |
| F6 | Grain stable (no flicker) — **manual** (UV hash / seed) |

## Honest limits

- PNG matches lab **approximate** blends (not Photoshop).
- Hash carries recipe only; photos reconnect locally.
- Hero has no export/readback.
- No WebM, ZIP, Jobs API, M03 talk.

## Operator

```bash
npm test
npm run dev
# Lab: /
# Hero: /hero
```
