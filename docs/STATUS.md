# Prism — v1 status

**Branch:** `rewrite/v1-styling`  
**Declaration:** **v1 closed — paused.** No M08 unless a real use appears.

## Shipped modules

| Module | One-line outcome | Receipt |
|--------|------------------|---------|
| M00 Compositor | WebGL2 renderer; main + overlay + text stack | [I0](reviews/I0_CHANGELOG.md) |
| M01 Recipe schema | Typed recipe, PathPatch, validate, fail closed | [I0](reviews/I0_CHANGELOG.md) |
| M02 Packs & sliders | 3 Tier A packs → semantic sliders + grade GLSL | [I1](reviews/I1_CHANGELOG.md) |
| M03 Talk router | Gemini structured JSON → pack/slider helpers | [I3](reviews/I3_CHANGELOG.md) |
| M04 Export | PNG FBO; recipe JSON; `#r=` hash; `/hero` | [I2](reviews/I2_CHANGELOG.md) |
| M05 Masks & regional | MediaPipe mask; subject/background grade | [I4](reviews/I4_CHANGELOG.md) |
| M06 Look library | 8 packs; blur; minimal poster text | [I5](reviews/I5_CHANGELOG.md) |
| M07 Lab UX | Canvas drag/resize; inspector; talk nudges | [I6](reviews/I6_CHANGELOG.md) |
| I7 Docs | README, portfolio.yaml, C4, ARCHITECTURE, CV | [I7](reviews/I7_CHANGELOG.md) |

## Pause

Prism v1 proves the loop: **pack → sliders (+ regional) → optional talk → PNG + recipe → hero-lite**. Further work waits for genuine use — not feature tourism.

## Known limits

- Talk is a **router**, not vision or co-pilot; refinement can be imperfect
- **Hotfix (2026-09-01):** Vercel `/api/talk` required talk core under `api/_lib/` (not `server/`) for serverless bundling — redeploy after merge; smoke `POST /api/talk` or Lab “more grain” with `GEMINI_API_KEY` set
- One **person mask** on main; no multi-mask or overlay masks
- **Eight packs** only; no free effect UI or LUT catalog
- **Minimal text** — one text object; 3 positions, 2 type presets; not Canva
- Non-`normal` blends approximate Photoshop
- CI runs unit tests only — WebGL and MediaPipe are operator-smoke
- `links.demo` in `portfolio.yaml` may still serve Stage until post-merge deploy

## Merge checklist

- [x] Visitor docs (README, C4, ARCHITECTURE, portfolio.yaml, STATUS, CV)
- [ ] Operator drops 5 demo PNGs → [`demo/README.md`](demo/README.md) (M06 §14)
- [ ] Merge `rewrite/v1-styling` → `main`
- [ ] Deploy; point portfolio `demo` URL to Prism build
- [ ] Ingest `portfolio.yaml` on arkhives.nz (`slug: prism`)
- [ ] Workshop-root ADA `portfolio.yaml` — future

## Screenshot checklist

See [M06 §14](modules/M06_LOOK_LIBRARY_AND_POSTER_CRAFT.md) and [I5 changelog](reviews/I5_CHANGELOG.md). Required five looks:

1. `warm-film`
2. `flash-raw`
3. `muted-split` (portrait + mask)
4. `editorial-bw`
5. `poster-punch` with text

Paths: `docs/demo/*.png` — instructions in [`demo/README.md`](demo/README.md).
