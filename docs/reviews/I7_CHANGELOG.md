# I7 — Changelog (living receipt)

**Branch:** `rewrite/v1-styling`  
**Slice:** Documentation & portfolio wrap-up

| Date | Slice | Status | Paths | Notes |
|------|-------|--------|-------|-------|
| 2026-09-01 | S0 | DONE | `I7_DOCS_WRAPUP_PLAN.md`, this file | Plan + living receipt |
| 2026-09-01 | S1 | DONE | `README.md` | GitHub front door |
| 2026-09-01 | S2 | DONE | `portfolio.yaml` | Portfolio card (`slug: prism`) |
| 2026-09-01 | S3 | DONE | `docs/c4/*` | C1–C3 from shipped code |
| 2026-09-01 | S4 | DONE | `docs/ARCHITECTURE.md` | Case study prose |
| 2026-09-01 | S5 | DONE | `docs/STATUS.md` | v1 closed receipt |
| 2026-09-01 | S6 | DONE | `docs/CV_BLURB.md` | CV / LinkedIn copy |
| 2026-09-01 | S7 | DONE | `docs/archive/STAGE_ON_MAIN.md` | Stage legacy pointer |
| 2026-09-01 | S8 | DONE | `docs/demo/README.md`, `docs/demo/.gitkeep` | Screenshot checklist |
| 2026-09-01 | S9 | DONE | `docs/VISION.md`, `docs/modules/README.md` | Cross-links |
| 2026-09-01 | hotfix | DONE | `src/packs/regionalSliders.ts` | `readRegionalSliderValue` no longer throws on empty recipe |

## Portfolio ingest checklist

- [ ] `portfolio.yaml` slug `prism` matches site config
- [ ] `diagram` path `docs/c4/2-containers.mmd` exists
- [ ] `portfolio-map.json` zoom ids (`prism-lab`, `talk-api`, `compositor`) match mmd node labels
- [ ] `links.demo` live after deploy (target: `https://image.arkhives.nz` — update when Prism replaces Stage on that host)
- [ ] 5 demo PNGs optional but paths documented in `docs/demo/README.md`
- [ ] GitHub README renders screenshots when operator drops PNGs into `docs/demo/`

## Operator

```bash
npm test && npm run build
# After merge to main: deploy → set portfolio demo URL → drop 5 PNGs into docs/demo/
```
