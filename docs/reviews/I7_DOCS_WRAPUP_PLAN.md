# I7 — Documentation & portfolio wrap-up plan

**Branch:** `rewrite/v1-styling`  
**Role:** Final visitor layer — GitHub, portfolio ingest, CV copy. No new features.

| Slice | Deliverable | Status |
|-------|-------------|--------|
| S1 | Root `README.md` | DONE |
| S2 | `portfolio.yaml` | DONE |
| S3 | `docs/c4/*` (C1–C3 + portfolio-map) | DONE |
| S4 | `docs/ARCHITECTURE.md` | DONE |
| S5 | `docs/STATUS.md` | DONE |
| S6 | `docs/CV_BLURB.md` | DONE |
| S7 | `docs/archive/STAGE_ON_MAIN.md` | DONE |
| S8 | `docs/demo/README.md` + placeholders | DONE |
| S9 | Cross-links (`VISION.md`, `docs/modules/README.md`) + I7 changelog | DONE |

## Process

1. Read `main` branch `portfolio.yaml`, `docs/c4/*`, README as **format only**.
2. Bottom-up C4 from `src/app`, `src/compositor`, `api/talk`, `src/talk`, `src/packs`, `src/masks`.
3. ARCHITECTURE cites research → module → I* pipeline.
4. `npm test` + `npm run build` — docs-only; must stay green.

## Out of scope

- New packs, talk, compositor features
- Workshop-root ADA `portfolio.yaml`
- Committing demo PNG binaries
- Rewriting M00–M07 module cards
