# Prism

**Parametric still-photo styling in the browser** — closed look packs, semantic sliders, optional Gemini talk router, WebGL2 compositor. **Recipe is truth; GPU does the math; talk and sliders write the same document.**

Upload a photo → live grade → tune or describe intent → export **PNG + recipe JSON** (and optional `#r=` share hash). The same recipe powers a quiet hero at `/hero`.

Visitor overview: [`portfolio.yaml`](portfolio.yaml) · C4 diagrams: [`docs/c4/README.md`](docs/c4/README.md)

## What Prism is not

Prism is **not** Stage (animated hero martech, Jobs API, campaign packs), **not** Canva or a layout builder, and **not** generative inpaint or background replacement. Talk is a **structured router** onto packs and sliders — it does not see or invent pixels. Honest limits: one person mask, eight named packs, minimal poster text — not Photoshop.

## Features

- **8 look packs** — `warm-film`, `flash-raw`, `muted-split`, `editorial-bw`, `poster-punch`, `dusk-grain`, `cool-chrome`, `clean-editorial` (film / editorial / poster / portrait-split families)
- **Semantic sliders** — pack-axis knobs (`intensity`, `grain`, `fade`, `blur`, …) over a closed effect registry
- **Regional sliders** — subject vs background grade when a person mask is active (`bg_blur`, regional exposure, etc.)
- **Person mask** — MediaPipe selfie segmenter in a Web Worker; auto on portrait upload
- **Talk** — `POST /api/talk` (Gemini structured JSON); same code path as manual sliders
- **Canvas text & overlay** — drag/resize text; inspector; talk nudges (“move title up”)
- **Export** — PNG at main native resolution; recipe JSON download; `#r=` LZ hash (recipe only — photos stay local)
- **Hero-lite** — `/hero` embed demo with bundled textures; `pointer-events: none`; reduced-motion still

## Quick start

```bash
npm install
npm test
npm run dev      # Lab → http://localhost:5173
```

Copy [`.env.example`](.env.example) to `.env` and set `GEMINI_API_KEY` for talk (optional — packs/sliders/export work without it).

```bash
npm run build
npm run preview
```

| Path | Purpose |
|------|---------|
| `/` | **Lab** — upload, packs, sliders, talk, canvas, export |
| `/hero` | **Hero-lite** — same renderer, quiet background embed |

## Deploy (Vercel)

| Item | Notes |
|------|-------|
| **Build** | `npm run build` → `dist/` (see [`vercel.json`](vercel.json)) |
| **Talk API** | [`api/talk.ts`](api/talk.ts) — serverless `POST /api/talk` |
| **MediaPipe** | `public/mediapipe/` populated by `postinstall` / `prebuild` (`scripts/copy-mediapipe-assets.mjs`) |
| **SPA fallback** | Non-`/api/*` routes → `index.html` |

### Environment

| Variable | Where | Purpose |
|----------|--------|---------|
| `GEMINI_API_KEY` | Server only | Required for `/api/talk` (never `VITE_*`) |

**Never** put API keys in client env vars. Without a key, talk returns `MISSING_KEY` (503); the Lab remains fully usable.

## Architecture

- **Case study:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **C4 diagrams:** [`docs/c4/README.md`](docs/c4/README.md)
- **Module index:** [`docs/modules/README.md`](docs/modules/README.md) (M00–M07)
- **Research process:** [`docs/00_FIELD_RESEARCH.md`](docs/00_FIELD_RESEARCH.md)

### Entry map

| Area | Files |
|------|--------|
| Routes | `src/app/App.tsx`, `Lab.tsx`, `Hero.tsx`, `CanvasOverlay.tsx` |
| Recipe | `src/recipe/*` |
| Compositor | `src/compositor/*` |
| Packs / sliders | `src/packs/*` |
| Talk | `src/talk/*`, `server/talkCore.ts`, `api/talk.ts` |
| Masks | `src/masks/*` |
| Export | `src/export/*` |
| Assets | `src/assets/idb.ts` |

## Demo screenshots

Five v1 looks (operator capture from live Lab): see [`docs/demo/README.md`](docs/demo/README.md).

| Look | File |
|------|------|
| warm-film | `docs/demo/warm-film.png` |
| flash-raw | `docs/demo/flash-raw.png` |
| muted-split | `docs/demo/muted-split.png` |
| editorial-bw | `docs/demo/editorial-bw.png` |
| poster-punch + text | `docs/demo/poster-punch.png` |

## Status

**v1 closed** on `rewrite/v1-styling` (M00–M07 / I0–I6). See [`docs/STATUS.md`](docs/STATUS.md).

## Sibling projects

- **ADA** — embodied agent / daily automation system (not duplicated here)
- **sound-visualiser** — time-domain / VJ lane (spatial still-image is Prism’s job)
- **Prism** — parametric still look organ for photos you already have

## Stage legacy

Pre-Prism **Background Studio / Stage** code remains on `main` until merge. See [`docs/archive/STAGE_ON_MAIN.md`](docs/archive/STAGE_ON_MAIN.md).

## License

No root license file in this repository. Dependencies use their own licenses (see `package-lock.json`).
