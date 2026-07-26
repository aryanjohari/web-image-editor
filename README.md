# Background Studio

Browser-based live hero-background designer (*The Algorithm Engine*). Upload a hero texture, tune parametric looks on a single WebGL canvas, and export **preset JSON** for embedding on real sites—plus optional WebM loops and PNG posters.

Visitor overview: see [`portfolio.yaml`](portfolio.yaml).

## Features

- **Living demo** (`/`) — auto-loads demo hero + preset; mood input (keywords; optional AI director)
- **Background Studio** (`/lab`) — Source / Look / Tune / Export / Advanced; 14 catalog looks
- **Case study** (`/story`) — embed narrative (HTML above canvas, preset contract)
- **Single-pass GLSL compositor** — hero → overlay → preview text with per-layer effect banks
- **Exports** — preset JSON (primary; no upload required for coefficients), WebM loop, PNG poster (media needs hero texture)
- **Share URLs** — `?preset=<catalog-id>` (kebab-case id from `src/data/presetCatalog.ts`)

## Quick start

```bash
npm install
npm run dev      # Vite → http://localhost:5173
npm run build
npm run preview
```

| Path | Purpose |
|------|---------|
| `/` | Living demo + mood |
| `/lab` | Full studio panel |
| `/story` | Embed case study |

Unknown paths redirect to `/`.

Replace `public/demo/hero.jpg` to customize the landing demo. SPA fallbacks: `public/_redirects` (Netlify), `vercel.json` (Vercel).

## Config / env

Copy [`.env.example`](.env.example) to `.env.local` for local flags.

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_MOOD_AI_ENABLED` | Client (build-time) | When `true`, mood POSTs to `/api/mood` before keyword fallback |
| `OPENAI_API_KEY` | Server only | Required for `/api/mood` on Vercel / `vercel dev` |
| `OPENAI_MODEL` | Server optional | Defaults to `gpt-4o-mini` |

**Never** put `OPENAI_API_KEY` in a `VITE_` variable.

| Deploy | AI mood |
|--------|---------|
| **Vercel** | Set `OPENAI_API_KEY`; enable `VITE_MOOD_AI_ENABLED=true` at build |
| **Netlify static** | Keyword mood only (`/api/mood` unavailable) |
| **Local** | Terminal 1: `vercel dev --listen 3000` · Terminal 2: `npm run dev` (Vite proxies `/api`) |

## Tests / CI

```bash
npm test         # Vitest — preset, mood, semantic mapping
npm run lint
npm run build    # tsc -b + Vite production bundle
```

Manual smoke: `/` mood + hero; `/lab?preset=archive` exports; `/story` nav; JSON without upload; PNG/WebM with hero uploaded.

## Architecture

Design case study and tradeoffs: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

Portfolio / “How it works” diagram: [`docs/architecture.mmd`](docs/architecture.mmd)

GPU formula glossary: [`MATH.md`](MATH.md)

Embed / porting checklist: [`src/lib/preset/PORTING.md`](src/lib/preset/PORTING.md)

Narrative overview: [`PROJECT.md`](PROJECT.md)

### Entry map

| Area | Files |
|------|--------|
| Routes | `src/App.tsx`, `src/shells/*` |
| Store | `src/store/useSynthStore.ts`, `layerEffects.ts`, `textLayers.ts` |
| GPU | `src/webgl/SynthCanvas.tsx`, `materials/SynthMaterial.tsx`, `shaders/*.glsl` |
| Presets | `src/lib/preset/*` |
| Mood | `src/lib/mood/*`, `api/mood.ts` |
| Export | `src/lib/export/*` |

## License

No root license file in this repository. Dependencies use their own licenses (see `package-lock.json`).
