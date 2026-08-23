# I2 — M04 Implement Plan

**Date:** 2026-08-23  
**Branch:** `rewrite/v1-styling`  
**Status:** DONE  
**Binding:** `docs/modules/M04_EXPORT.md` (X1–X12, §§3–7)

---

## Scope

**In:** PNG export via export-FBO readback (main native RT, clamped), text re-raster at export/preview scale, deterministic grain (+ optional `seed`), recipe JSON download (+ optional dual), `#r=` fflate+base64url share + boot hydrate + missing-asset reconnect UX, Lab export buttons, hero-lite `/hero` with `{type:"url"}` assets.

**Out:** M03 LLM/talk, WebM, ZIP product, Jobs API, masks, Tier B, campaign packs, server raster, second shader tree.

---

## Architecture

```text
src/export/
  png.ts              ← resolve size → compositor.exportPng → Blob download
  recipeDownload.ts   ← validated JSON download (+ dual)
  shareHash.ts        ← fflate zlib + base64url #r=
  download.ts         ← <a download> helper
  missingAssets.ts    ← unresolved id/url refs for UX
  index.ts
  export.test.ts      ← hash / preflight / recipe download (no WebGL PNG)

src/compositor/renderer.ts  ← exportPng(FBO@native); textScale; grain seed uniform
src/compositor/shaders/textured.frag.glsl  ← u_grainSeed folded into UV hash
src/recipe/effectsRegistry.ts  ← grain.params.seed optional
src/app/Lab.tsx       ← PNG / Recipe / Copy link / dual + honesty + hash boot
src/app/Hero.tsx      ← /hero mount; url assets; pointer-events none; reduced-motion
src/app/main.tsx      ← pathname → Lab | Hero
public/hero/*         ← bundled same-origin textures
```

### Data flow

```text
PNG:     resolve main → native W×H clamp MAX → textScale = exportH/previewH
         → export FBO pair (not CSS canvas) → same draw → readPixels → flipY → toBlob

Recipe:  validateRecipe → JSON.stringify → download (no bytes)

Hash:    recipe JSON → fflate zlibSync → base64url → #r=…
         boot: decode → validate → replace; missing ids → block + re-upload

Hero:    static recipe + {type:url} → same Compositor; no readback
```

### Library pick

| Item | Choice |
|------|--------|
| Hash compressor | **fflate** (`zlibSync` / `unzlibSync`) |

---

## Slice checklist

| # | Slice | Done when | Status |
|---|-------|-----------|--------|
| S0 | Plan docs | This file + `I2_CHANGELOG.md` | DONE |
| S1 | `exportPng` | FBO@native → readPixels → PNG; fail closed missing main | DONE |
| S2 | Text + grain | Re-raster at scale ratio; UV hash + optional seed; no `u_time` | DONE |
| S3 | Recipe download | Validated JSON; optional dual PNG+JSON (no ZIP) | DONE |
| S4 | Hash + hydrate | `#r=` encode/decode; budget; missing-asset UX | DONE |
| S5 | Lab buttons | Download PNG / Recipe / Copy link + honesty line | DONE |
| S6 | Hero-lite | `/hero` + url assets; pointer-events none; reduced-motion | DONE |
| S7 | Tests + receipt | FEASIBLE units; F1–F6 manual; changelog | DONE |

---

## Falsifiers

| # | Criterion | How |
|---|-----------|-----|
| F1 | PNG looks like lab grade | Manual |
| F2 | PNG is native RT, not CSS/DPR soft upsample | Manual (pixel dims) |
| F3 | Missing main → no PNG | Unit preflight + manual |
| F4 | Hash hydrates but missing assets block canvas | Manual + unit listMissing |
| F5 | Text size scales with export RT | Manual |
| F6 | Grain stable preview↔PNG | Manual (UV hash / seed) |

---

## Operator

```bash
npm install
npm test
npm run dev   # Lab / ; Hero /hero
```
