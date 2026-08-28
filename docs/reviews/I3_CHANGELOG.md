# I3 — Changelog (living receipt)

**Branch:** `rewrite/v1-styling`  
**Slice:** M03 talk router (Google Gemini)

| Date | Slice | Status | Paths | Notes |
|------|-------|--------|-------|-------|
| 2026-08-23 | S0 | DONE | `I3_M03_IMPLEMENT_PLAN.md`, this file | Plan + living receipt; Vite middleware architecture |
| 2026-08-23 | S1 | DONE | `src/talk/{types,schema,context}.ts` | TalkRequest/Response; Gemini schema enums; recipeContext (no Blobs) |
| 2026-08-23 | S2 | DONE | `src/talk/{normalize,applyTalk}.ts` + tests | Delta→absolute clamp; refuse; pack then patch; packId preserved; identity vs slider |
| 2026-08-23 | S3 | DONE | `server/{env,gemini,talk}.ts` | `POST /api/talk`; `@google/genai`; SCHEMA/timeout/missing-key fail closed |
| 2026-08-23 | S4 | DONE | `server/vitePlugin.ts`, `vite.config.ts` | `npm run dev` serves Lab + `/api/talk` |
| 2026-08-23 | S5 | DONE | `src/app/Lab.tsx`, `styles.css` | Talk stub; dual-path packs/sliders; export untouched |
| 2026-08-23 | S6 | DONE | this file | `npm test` + `npm run build` green; F1–F8 noted |
| 2026-08-29 | I3b | DONE | `api/talk.ts`, `server/talkCore.ts`, `vercel.json` | Production `/api/talk` on Vercel; shared core with dev middleware |

## Library / model pin

| Item | Choice | Why |
|------|--------|-----|
| SDK | `@google/genai` `^2.18.0` | M03 T18; GA successor to `@google/generative-ai` |
| Model | `gemini-2.5-flash` | Confirmed current Flash id (2026-08-23 Google docs / model cards) |
| Env | `GEMINI_API_KEY` server-only | No `VITE_`; F8 — absent from `dist/` |

## OPEN defaults

| Item | Default | Why |
|------|---------|-----|
| Default Δ | `0.1 × slider span` | M03 / task when model omits size |
| Timeout | 12 s client / 14 s server | Mid of 8–15 s band |
| Rate limit | 20 / 60 s / IP | Soft in-memory sketch |

## Falsifiers

| # | Result |
|---|--------|
| F1 | RQ3 direction — **manual** (needs live `GEMINI_API_KEY`) |
| F2 | No illegal paths — **unit** (`applyTalk` only `applyPack` / `applySemanticSlider`) |
| F3 | OOR same as sliders — **unit** (shared `clampSliderValue`) |
| F4 | No parallel look language — architecture (normalize → shipped helpers only) |
| F5 | Generative refuse — **unit** + **manual** (“put me on a beach”) |
| F6 | Fail doesn’t brick Lab — **manual** (no key / stop API; packs/sliders live) |
| F7 | packId not cleared on patch — **unit** |
| F8 | No secret in client bundle — **verified** (`rg` on `dist/` clean; no `VITE_GEMINI_*`) |

## Honest limits

- Talk is a Lab stub (one field + Send), not a chat product.
- Without `GEMINI_API_KEY`, `/api/talk` returns `MISSING_KEY` (503); Lab packs/sliders/export still work.
- RQ3 direction accuracy (F1) is not CI-gated — dual-path stays mandatory.
- Soft rate limit is in-memory only (resets on server restart; on Vercel, per function instance).
- No vision / image bytes; Tier A text-only.
- Vercel Hobby/Free function timeout may cap below the 14 s server abort — expect `TIMEOUT` sooner on cold/slow tiers.

## Operator

### Local dev

```bash
cp .env.example .env   # set GEMINI_API_KEY
npm install
npm test
npm run build
npm run dev            # Lab + /api/talk (Vite middleware)
```

### Vercel deploy

1. Link project to repo (`rewrite/v1-styling` or main).
2. **Environment variables** (Project → Settings → Environment Variables):
   - `GEMINI_API_KEY` — **Production** (required for live talk); **Preview** optional for PR smoke tests.
   - Never add `VITE_GEMINI_*` (F8).
3. Build settings (also in `vercel.json`):
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy. SPA routes `/` and `/hero` rewrite to `index.html`; `POST /api/talk` hits `api/talk.ts` serverless function.
5. **Smoke (live URL, with key set):**
   - Upload image → “warm film” → `warm-film` pack
   - “less grain” → grain down
   - “put me on a beach” → refuse; recipe unchanged
6. **Smoke (no key, F6):** unset `GEMINI_API_KEY` on Production → talk shows error banner; packs/sliders/export still work.

### Manual checks (with key)

1. “warm film” → `warm-film` pack  
2. “less grain” → grain down  
3. “put me on a beach” → refuse; recipe unchanged  
4. Stop / unset key → error banner; packs/sliders still work  
