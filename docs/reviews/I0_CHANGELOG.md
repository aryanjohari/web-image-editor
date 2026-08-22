# I0 — Changelog (living receipt)

**Branch:** `rewrite/v1-styling`  
**Slice:** M00 compositor + M01 recipe/assets

| Date | Slice | Status | Paths | Notes |
|------|-------|--------|-------|-------|
| 2026-08-23 | S0 | DONE | `package.json`, vite/tsconfig/eslint, `src/app/*`, `docs/reviews/*` | Vite+TS+React+Vitest; empty suite green |
| 2026-08-23 | S1 | DONE | `src/recipe/types.ts`, `identityRecipe.ts`, `effectsRegistry.ts` | Recipe / Object / AssetRef / TextSource / Effect / PathPatch |
| 2026-08-23 | S2 | DONE | `src/recipe/validate.ts`, `validate.test.ts` | Caps, blends, registry, OOR reject, round-trip |
| 2026-08-23 | S3 | DONE | `src/recipe/pathPatch.ts`, `pathPatch.test.ts` | Allowlist + post-merge validate; fail closed |
| 2026-08-23 | S4 | DONE | `src/assets/*`, `idb.test.ts` | put/get/list/delete; MISSING loud; fake-indexeddb |
| 2026-08-23 | S5 | DONE | `src/compositor/gl.ts`, shaders, `renderer.ts` | WebGL2 + FBO + fullscreen quad |
| 2026-08-23 | S6 | DONE | `textureUpload.ts`, Lab upload→IDB→main | Main textured quad (contain) |
| 2026-08-23 | S7 | DONE | `textRaster.ts`, overlay path in renderer | Overlay premul over + text→texture |
| 2026-08-23 | S8 | DONE | `src/app/Lab.tsx`, `ErrorBanner.tsx` | Upload main/overlay, edit text, error banner |
| 2026-08-23 | S9 | DONE | this file + implement plan status | Honest limits below |

## Honest limits (I0)

- Pointwise grade GLSL (`exposure`…`vignette`) is schema-admitted; compositor draws identity for those params (no grade math yet).
- Non-`normal` blend modes are approximate (no full dst-aware ping-pong blend shader).
- No PNG export, URL hash share, packs UI, or LLM talk (M02–M04).
- `url` AssetRef fetch is implemented in compositor but unused by lab UI (id refs only).

## Operator

```bash
npm install
npm test          # recipe + assets units
npm run dev       # lab at Vite URL
```

**Works:** upload main → canvas; optional overlay + text; recipe in `localStorage`; assets in IndexedDB; reload resolves or shows missing-asset error; illegal PathPatch/validate rejected in tests.

**Next:** M02 packs catalog (named craft over same recipe).
