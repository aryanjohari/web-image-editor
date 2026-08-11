# Background Studio → Stage

Browser-based live hero-background designer (*The Algorithm Engine*). Upload a hero texture, tune parametric looks on a single WebGL canvas, and export **preset / StageRecipe JSON** for embedding—plus optional WebM, PNG, and campaign pack ZIP.

**Product direction:** Stage — brand-ruled visual automation (campaign packs + live recipes, web + Jobs API). See [`docs/DIRECTION.md`](docs/DIRECTION.md). Phases 0–5 + lab UI remake (IndexedDB workspace) shipped with honest limits (in-memory API; lab-local IDB only).

Visitor overview: see [`portfolio.yaml`](portfolio.yaml).

## Features

- **Living demo** (`/`) — auto-loads demo hero + preset; mood (keywords; optional Gemini AI)
- **Background Studio** (`/lab`) — Library (brands/assets) → hero → floating brief → campaign pack ZIP; Studio tune/advanced
- **Case study** (`/story`) — embed narrative
- **Embed demo** (`/embed-demo`) — StageRecipe live behind HTML (`pointer-events: none`, reduced-motion aware)
- **Jobs API** (`/api/v1/*`) — keyed brands + sync brief→recipe jobs (in-memory)
- **Exports** — preset JSON, StageRecipe JSON, campaign pack ZIP, WebM, PNG

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
| `/lab` | Full-bleed canvas + Library / Studio / floating brief |
| `/story` | Embed case study |
| `/embed-demo` | StageRecipe behind HTML |

Unknown paths redirect to `/`.

## Config / env

Copy [`.env.example`](.env.example) to `.env.local`.

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_STAGE_BRIEF_AI_ENABLED` | Client | Lab `/api/brief` + landing `/api/mood` before keyword fallback |
| `GEMINI_API_KEY` or `GOOGLE_API_KEY` | Server | Required for brief / mood / jobs Gemini |
| `GEMINI_MODEL` | Server optional | Default `gemini-2.5-flash` |
| `STAGE_API_KEY` or `STAGE_API_KEYS` | Server | Required for `/api/v1/*` (except health) |

**Never** put API keys in `VITE_` vars. Lab brief stays keyless (Gemini only). Jobs API needs a Stage key.

| Deploy | Notes |
|--------|-------|
| **Vercel** | Set Gemini + Stage API key(s); enable `VITE_STAGE_BRIEF_AI_ENABLED` at build |
| **Netlify static** | Keyword fallback only (`/api/*` unavailable) |
| **Local** | Terminal 1: `npm run dev:api` (`vercel dev --listen 3000`) · Terminal 2: `npm run dev` |

## Jobs API smoke (curl)

With `STAGE_API_KEY` and `GEMINI_API_KEY` set for `vercel dev`:

```bash
export STAGE_API_KEY=sk_stage_dev_change_me   # match .env.local
curl -s http://127.0.0.1:3000/api/v1/health

BRAND=$(curl -s -H "Authorization: Bearer $STAGE_API_KEY" -H "Content-Type: application/json" \
  -d '{"name":"Demo","colors":[],"fonts":[]}' http://127.0.0.1:3000/api/v1/brands)
echo "$BRAND"
BRAND_ID=$(node -e "console.log(JSON.parse(process.argv[1]).id)" "$BRAND")

JOB=$(curl -s -H "Authorization: Bearer $STAGE_API_KEY" -H "Content-Type: application/json" \
  -d "{\"brandId\":\"$BRAND_ID\",\"brief\":\"soft dusk hero\"}" http://127.0.0.1:3000/api/v1/jobs)
echo "$JOB" | head -c 400

# Expect 401 without Authorization on /api/v1/brands
```

In-memory brands/jobs wipe on cold start / redeploy. See [`docs/api/AUTH.md`](docs/api/AUTH.md).

## Embed

In-repo helper + demo: [`src/lib/stage/EMBED.md`](src/lib/stage/EMBED.md) · `/embed-demo`.  
Standalone shader port: [`src/lib/preset/PORTING.md`](src/lib/preset/PORTING.md).

## Tests / CI

```bash
npm test
npm run lint
npm run build
```

Manual smoke: `/` mood; `/lab` Library → hero → brief → campaign pack; curl Jobs API; `/embed-demo` HTML over canvas.

**Lab smoke (happy path):** Open `/lab` → Library → create/set active brand → Assets upload → **Use as hero** → floating Brief Apply → Export → **Download campaign pack**. Reload: brands/assets should still be in IndexedDB.

## Architecture

[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · C4 [`docs/c4/README.md`](docs/c4/README.md) · [`MATH.md`](MATH.md) · [`PROJECT.md`](PROJECT.md)

### Entry map

| Area | Files |
|------|--------|
| Routes | `src/App.tsx`, `src/shells/*` |
| Store | `src/store/useSynthStore.ts` |
| GPU | `src/webgl/*` |
| Presets / Stage | `src/lib/preset/*`, `src/lib/stage/*` |
| API | `api/brief.ts`, `api/mood.ts`, `api/v1/*` |
| Export | `src/lib/export/*`, `src/lib/stage/exportCampaignPack.ts` |

## License

No root license file in this repository. Dependencies use their own licenses (see `package-lock.json`).
