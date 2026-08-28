# I3 — M03 Implement Plan

**Date:** 2026-08-23  
**Branch:** `rewrite/v1-styling`  
**Status:** DONE  
**Binding:** `docs/modules/M03_TALK_ROUTER.md` (T1–T18, F1–F8)

---

## Scope

**In:** `POST /api/talk` via Google Gemini (`@google/genai`, server `GEMINI_API_KEY`), Talk schema + normalizer (delta→absolute clamp), `applyTalk` via shipped `applyPack` / `applySemanticSlider`, Lab talk stub (dual-path), unit tests (no live key in CI), receipts.

**Out:** Vision / image bytes, multi-provider adapters, OpenAI/Vertex default, new packs/effects/slider axes, chat transcript product, Lab redesign, reopening M00–M02/M04, client-side Gemini key.

---

## Architecture pick

**Vite `configureServer` middleware** (same-origin `/api/talk` under `npm run dev`). No separate concurrent API process.

```text
docs/reviews/
  I3_M03_IMPLEMENT_PLAN.md
  I3_CHANGELOG.md

server/
  env.ts              ← GEMINI_API_KEY; fail closed if missing on request
  gemini.ts           ← @google/genai generateContent + schema
  talk.ts             ← Connect handler: POST /api/talk
  vitePlugin.ts       ← configureServer + loadEnv

src/talk/
  types.ts            ← TalkRequest / TalkResponse / error codes
  schema.ts           ← JSON Schema enums for Gemini
  context.ts          ← recipe → recipeContext (no Blobs)
  normalize.ts        ← delta clamp, unknown*, refuse; pure
  applyTalk.ts        ← applyPack? then applySemanticSlider*; all-or-nothing
  client.ts           ← fetch('/api/talk', { signal, timeout })
  index.ts
  normalize.test.ts
  applyTalk.test.ts

src/app/Lab.tsx       ← Talk stub only (dual-path)
vite.config.ts        ← prism-talk-api plugin
.env.example          ← GEMINI_API_KEY=
```

### Data flow (locked)

```text
Lab text + buildRecipeContext(recipe)
  → POST /api/talk  (timeout 12s)
  → Gemini structured JSON (server key; gemini-2.5-flash)
  → normalize (server) → TalkResponse
  → client re-normalize allowlist + applyTalk on copy
  → if refuse / error: no recipe write; banner
  → else: applyPack? → patches via applySemanticSlider → commit or discard
```

### Provider pin (implement time)

| Item | Pin |
|------|-----|
| SDK | `@google/genai` |
| Model | `gemini-2.5-flash` (confirmed GA on ai.google.dev / Cloud model card, 2026-08-23) |
| Env | Server-only `GEMINI_API_KEY` (no `VITE_`) |
| Schema | `responseMimeType: "application/json"` + `responseSchema` with pack/slider enums |

### OPEN defaults

| Item | Choice |
|------|--------|
| Default Δ (model omits size) | `0.1 × (slider.max − slider.min)` |
| Client timeout | 12 s → `TIMEOUT` |
| Soft rate limit | 20 req / 60 s / IP (in-memory) |

---

## Slice checklist

| # | Slice | Done when | Status |
|---|-------|-----------|--------|
| S0 | Plan + changelog stubs | This file + `I3_CHANGELOG.md` | DONE |
| S1 | Types + schema + context | Matches M03; no Blobs | DONE |
| S2 | normalize + applyTalk | Units: delta clamp, unknown*, refuse, pack+patch order, packId preserved, identity vs slider | DONE |
| S3 | Gemini route | `POST /api/talk` + env; SCHEMA/timeout fail closed | DONE |
| S4 | Vite wire-up | `npm run dev` serves Lab + `/api/talk` | DONE |
| S5 | Lab stub | Input + Send + error/refuse; dual-path; export/packs untouched | DONE |
| S6 | Receipt | Tests green; F1–F8 noted; honest limits | DONE |

---

## Falsifiers

| # | Criterion | How addressed |
|---|-----------|---------------|
| F1 | RQ3 direction | Manual with key; dual-path stays |
| F2 | No illegal paths | Only `applyPack` / `applySemanticSlider` |
| F3 | OOR same as sliders | Same clamp + validate helpers |
| F4 | No parallel look language | No mood JSON → pixels |
| F5 | Generative refuse | Prompt + `refuse` → no write |
| F6 | Fail doesn’t brick Lab | Error banner; packs/sliders live |
| F7 | packId not cleared on patch | applyTalk never PathPatches packId |
| F8 | No secret in client bundle | Server-only key; no `VITE_GEMINI_*` |

---

## Operator

```bash
cp .env.example .env   # set GEMINI_API_KEY
npm install
npm test
npm run dev            # Lab + /api/talk
```
