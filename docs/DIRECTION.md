# Stage — product & architecture freeze (Phase 0)

> **Status:** Spec lock only. No Phase 1 implementation required to treat this as the source of truth.  
> **Date:** 2026-08-10  
> **Schema package:** [`src/lib/stage/`](../src/lib/stage/) · OpenAPI: [`docs/api/stage-v1.openapi.yaml`](api/stage-v1.openapi.yaml)

---

## 1. What we are building

**Name:** Stage  
**Category:** Brand-ruled visual automation module (web app + API)  
**Not:** A Canva editor clone, a Midjourney wrapper, or Omniverse/Physical AI.

**One-liner:** Set brand rules once; brief in → campaign pack + live background recipe out. Humans approve; other modules call the same API.

| Surface | Audience |
|---------|----------|
| Web app | You + people trying Stage (chat, sliders, preview, download) |
| API (`/v1/*`) | Your SEO / web / automation modules (+ later partners) |

Same engine behind both doors.

---

## 2. Problem we sell against

Digital marketing needs many on-brand visuals. Today that means either off-brand AI pixels or slow human production. Stage separates **brand judgment** (rules, approve) from **manufacturing** (JSON scene + client WebGL render + exports).

We do **not** compete with Canva on polishing UI. We compete on **speed of variant loops**, **usage-priced jobs**, and **live embeddable recipes** your sites can run.

---

## 3. v1 scope (frozen)

### In

1. **Brand kit** — colours, fonts, logo, allowed looks / effect limits  
2. **Upload-first assets** — hero / plates / decals as first-class assets  
3. **Optional plate generation** — behind a feature flag; never required for the core loop  
4. **Scene recipe (v3)** — layers (image / decal / text) + effects + brand binding; LLM patches **recipe JSON only**  
5. **Chat + sliders** — conversational patches and manual override  
6. **Campaign pack** — fixed aspect profiles (see pack sizes)  
7. **Live background recipe** — export JSON + embed story (evolve from preset PORTING)  
8. **Jobs API** — `brief + brandId (+ assetIds) → recipe + exports`

### Out of v1

- Meta / ads publish loops  
- Full multi-tenant SaaS billing UI  
- Server-side pixel render farm (client capture OK for pack in v1)  
- Beating Photoroom / Gemini at photoreal content edits  
- SEO / webdev products living inside this repo (they **call** Stage)

### Render honesty (v1)

- **Source of truth:** recipe JSON  
- **Pixels:** browser WebGL compositor + canvas capture for pack  
- Headless/server rasterization: deferred  

---

## 4. Containers (target)

| ID | Role |
|----|------|
| `studio-spa` | Live canvas, brand/studio/campaign UI, client render |
| `stage-api` | Brands, assets, jobs, LLM proxy, optional plate gen (evolves `mood-api`) |
| LLM | State operator — validated recipe / patch only |
| Plate gen (optional) | Bitmap → asset, then Stage as usual |
| Storage | Brands, assets, jobs, recipes (new; none today) |

External: OpenAI (or equivalent) for chat completions; optional Gemini (or equivalent) when plate gen enabled; consumer sites for embeds.

---

## 5. Frozen contracts

Canonical TypeScript: [`src/lib/stage/types.ts`](../src/lib/stage/types.ts), [`packProfiles.ts`](../src/lib/stage/packProfiles.ts).  
HTTP surface: [`docs/api/stage-v1.openapi.yaml`](api/stage-v1.openapi.yaml).

| Contract | Purpose |
|----------|---------|
| **BrandKit** | Rules the LLM and UI must respect |
| **StageRecipe** (schema v3) | Portable scene state (successor intent to SynthPreset v2) |
| **StageJob** | Async unit of work: brief → recipe → pack |
| **PackProfile** | Named export sizes for campaign kits |

**Relationship to current engine:** Preset v2 (`src/lib/preset/types.ts`) remains the **runtime** format. Phase 1 wires StageRecipe via adaptors (product contract ↔ v2 apply/hydrate); compositor migration stays later.

---

## 6. Auth stance (frozen)

| Actor | v1 approach |
|-------|-------------|
| You / automation modules | **API key** (`Authorization: Bearer sk_…` or `X-Stage-Key`) |
| Public “try Stage” web | Shared **demo brand** + rate limits; optional later per-user keys |
| Multi-user orgs / SSO | Deferred |

Keys are server-only. Never put long-lived secrets in `VITE_*` vars. Plate-gen and LLM keys stay on `stage-api`.

---

## 7. Pack sizes (v1)

Canonical list: `STAGE_PACK_PROFILES` in [`src/lib/stage/packProfiles.ts`](../src/lib/stage/packProfiles.ts).

| id | Label | Size | Use |
|----|-------|------|-----|
| `square` | Feed / 1:1 | 1080×1080 | IG/Facebook feed |
| `story` | Story / 9:16 | 1080×1920 | Stories, Reels cover, TickTok-style |
| `web_hero` | Web hero / 16:9 | 1920×1080 | Site hero still / poster |
| `web_hero_live` | Live recipe | viewport formula | Embed JSON (not a PNG size) |

Campaign pack default export set: `square` + `story` + `web_hero` (+ recipe JSON always).

---

## 8. Build phases (after Phase 0)

| Phase | Focus |
|-------|--------|
| **0** | This freeze (done when schemas + this doc + OpenAPI land) |
| **1** | Recipe spine — v3 types wired, multi-asset layers, migrate/apply from v2 |
| **2** | Brand kit + constrained LLM (`brief → patch`) |
| **3** | Campaign pack exports from profiles |
| **4** | Jobs API stable for external modules |
| **5** | Embed package polish |
| **6** | Optional plate gen toggle |

### Phase 1 status (2026-08-10)

**Done in app:** Bidirectional adaptor `synthPresetV2ToStageRecipe` / `stageRecipeToSynthPresetV2` (`src/lib/stage/adaptPreset.ts`); `/lab` Download / Import StageRecipe JSON; Source panel multi-asset list; catalog `?preset=` v2 apply unchanged.

**Honest limits:** Compositor is still L0 hero + L1 decal + text slots (no N-image shader pass). Extra Stage image assets are listed and exported on the recipe but only primary hero + one overlay bind to the GPU. Runtime apply path remains SynthPreset v2 via hydrate. Compositor-only fields (`linkDecalToMath`, `linkTextToMath`, `decalBackgroundLumaMask`, `selectedTextLayerId`, `imageResolution`) round-trip in `_v2Compat` on the recipe. No brand kit, LLM, or Jobs yet (Phase 2+).

Do not start Phase 2 UI without treating this document as unchanged unless explicitly revised.

---

## 9. Success criteria (demo + personal use)

- Brand kit created once  
- Upload image(s); gen off still works  
- Brief → on-brand layered scene (text + effects)  
- Download pack (3 stills) + recipe JSON / embed pointer  
- External module can `POST /v1/jobs` with an API key  

---

## 10. Doc map

| Doc | Role after freeze |
|-----|-------------------|
| **This file** | Product + architecture north star |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Current implemented system + pointer here |
| [`api/stage-v1.openapi.yaml`](api/stage-v1.openapi.yaml) | HTTP contract |
| [`../PROJECT.md`](../PROJECT.md) | Visitor/project summary |
| [`../README.md`](../README.md) | Operator quick start |
| [`../src/lib/preset/PORTING.md`](../src/lib/preset/PORTING.md) | Embed path (evolves with recipe) |

---

## Revision

Bump a short note here when the freeze changes:

| Version | Note |
|---------|------|
| `stage-phase0-2026-08-10` | Initial freeze — web+API, upload-first, optional gen flag |
| `stage-phase1-2026-08-10` | Phase 1 recipe spine in lab — adaptor + import/export; GPU still v2 slots |
