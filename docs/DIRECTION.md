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
| Storage | In-memory Maps for API brands/jobs (Phase 4 dogfood); lab brands/assets = IndexedDB (`stage-workspace`) |

External: Gemini for constrained brief → patch (Phase 2); optional plate gen (later) may use a separate provider; consumer sites for embeds.

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

**Honest limits:** Compositor is still L0 hero + L1 decal + text slots (no N-image shader pass). Extra Stage image assets are listed and exported on the recipe but only primary hero + one overlay bind to the GPU. Runtime apply path remains SynthPreset v2 via hydrate. Compositor-only fields (`linkDecalToMath`, `linkTextToMath`, `decalBackgroundLumaMask`, `selectedTextLayerId`, `imageResolution`) round-trip in `_v2Compat` on the recipe.

### Phase 2 status (2026-08-10)

**Done in app:** Brand kit editor in `/lab` (localStorage + in-memory — **no** DB / `/v1/brands`). Brief control → `POST /api/brief` (Gemini) returns validated `{ patch, summary?, baseLookId? }`; client allowlists keys and clamps brand caps, then applies via existing look + `applyPresetPatch`. Empty brand allowed (weaker system prompt). Keyword mood remains fallback when AI off or fails. Landing `/api/mood` uses the same Gemini runner (OpenAI mood path removed).

**Honest limits:** No plate gen; no Jobs API; upload “Add images” still defer — prefer **Upload hero**. Campaign pack zip shipped in Phase 3 (see below).

### Phase 3 status (2026-08-10)

**Done in app:** `/lab` **Download campaign pack** builds a client-side **ZIP** (`campaign-pack.zip`) via a minimal STORED zip util (no zip dependency): three PNG stills at frozen profile sizes from `STAGE_DEFAULT_PACK_PROFILE_IDS` (`pack-square-1080x1080.png`, `pack-story-1080x1920.png`, `pack-web_hero-1920x1080.png`) plus `stage-recipe.json` and a short `web_hero_live.txt` note (live recipe = JSON embed, not a PNG). Capture temporarily sets R3F drawing buffer to each profile size (DPR=1) via `PackExportViewportBridge` + `captureCanvasPngAtSize`, then restores the lab viewport. Hero texture required (same alert as PNG poster).

**Honest limits:** Hero fit remains shader **contain** (letterbox bars when aspect differs). Text/layout regenerates for the capture size but is not a dedicated per-aspect art-direction pass. No WebM inside the pack. No server-side rasterization. No Jobs API / Phase 4.

Do not start Phase 4 UI without treating this document as unchanged unless explicitly revised.

### Phase 4 & 5 plan (locked 2026-08-11)

Dogfood Jobs API + light embed polish. **No UI remake** in this phase. Broad lab bugfixes deferred.

#### Endpoints (server `/api` + OpenAPI paths `/v1/*`)

| Method | Path | Auth | Behaviour |
|--------|------|------|-----------|
| GET | `/v1/health` | none | `{ ok, contractVersion }` |
| POST | `/v1/brands` | API key | Create brand kit → 201 |
| GET | `/v1/brands` | API key | List in-memory brands |
| GET/PATCH | `/v1/brands/{id}` | API key | Get / update |
| POST | `/v1/jobs` | API key | Sync Gemini brief → recipe; **200** + Job `succeeded` |
| GET | `/v1/jobs/{id}` | API key | Job + recipe |
| POST | `/v1/jobs/{id}/patch` | API key | Follow-up `{ message }` → update recipe |
| POST | `/v1/jobs/{id}/artifacts` | API key | Stub: append artifact metadata (no blob store) |
| POST | `/v1/assets` | — | **Deferred** (not implemented) |

Lab surfaces stay on keyless `POST /api/brief` + `POST /api/mood` (Gemini only).

#### In-memory data model

- `brands: Map<id, StageBrandKit>`
- `jobs: Map<id, StageJob>`
- Module-scope Maps in one serverless isolate. **Cold start / redeploy wipes all state.** Not multi-tenant durable storage.

#### Auth

- Env: `STAGE_API_KEY` (single) and/or `STAGE_API_KEYS` (comma-separated).
- Headers: `Authorization: Bearer <key>` or `X-Stage-Key: <key>`.
- Missing/invalid → 401 on all `/api/v1/*` except health.

#### Lab workspace vs API brands

**Separate.** Lab brands + asset blobs = IndexedDB (`stage-workspace`); active brand id in `localStorage` (`stage.workspace.activeBrandId.v1`). Legacy single kit (`stage.activeBrandKit.v1`) migrates once into IDB. API brands live only in the server Map. No auth sync / multi-device.

#### Job completion model

Prefer **`succeeded` with recipe JSON**. Pack ZIP remains a **client** (`/lab`) capability. `artifacts` starts empty; optional stub upload records URLs/metadata only. Happy path does **not** use `awaiting_client_render`.

#### Embed (Phase 5)

- In-repo helper under `src/lib/stage/embed/` + [`EMBED.md`](../src/lib/stage/EMBED.md).
- Demo route `/embed-demo`: HTML over live WebGL from a StageRecipe.
- Standalone sites still port shaders per PORTING; helper is not a published npm package.

#### Explicit non-goals / known deferred bugs

- ~~Full UI remake / design system~~ — lab remake landed (see UI remake status below); no design system
- Plate gen (Phase 6)
- Real DB, multi-tenant SaaS, Meta publish
- npm registry publish
- Broad bugfix (leftover lab quirks after remake)
- Server-side pack rasterization / asset binary store

#### Test plan

- Unit: store CRUD, auth helper, pure preset-patch merge, `runStageJob` with mocked Gemini
- `npm test` && `npm run build`
- Manual: curl create brand → create job → get recipe → patch; 401 without key; lab brief still works; `/embed-demo` plays background

#### Acceptance checklist

- [x] Keyed curl: brand → job → recipe
- [x] Unauthorized without key on `/api/v1/*` (except health)
- [x] Job patch updates recipe
- [x] Lab `/api/brief` still works
- [x] Cold-start wipe documented
- [x] Embed docs + `/embed-demo` with reduced-motion / pointer-events guidance
- [x] DIRECTION marks Phase 4 & 5 done with honest limits
- [x] Next note: UI remake, then bugfix — UI remake done; bugfix next

### Phase 4 status (2026-08-11)

**Done:** Authenticated in-memory Jobs API under `/api/v1/*` (`STAGE_API_KEY` / `STAGE_API_KEYS`). Brands CRUD subset + sync `POST /jobs` → Gemini via `runStageBrief` → StageRecipe with status `succeeded`. Follow-up `POST .../patch`. Artifacts metadata stub. Lab `/api/brief` remains keyless. Store: `src/lib/stage/server/*`. Cold start wipes memory.

**Honest limits:** No durable DB; assets upload not implemented on API; pack ZIP still client-only; no plate gen; API brands ≠ lab IndexedDB workspace.

### Phase 5 status (2026-08-11)

**Done:** In-repo embed helpers + `StageEmbedBackground`, [`EMBED.md`](../src/lib/stage/EMBED.md), demo route `/embed-demo` (recipe behind HTML; reduced-motion freeze; pointer-events none).

**Honest limits:** Not a published npm WebGL player — external sites still port shaders per PORTING. Helper targets this React+R3F app.

### UI remake / local workspace (2026-08-11)

**Done in `/lab`:** Full-bleed canvas + minimal chrome. **Library** drawer (Brands | Assets) backed by IndexedDB `stage-workspace` (multi-brand CRUD, asset blobs, Use as hero / Use as overlay). Floating draggable **Brief** (`applyBriefFromText` + active workspace brand → `/api/brief`, keyword fallback). Slim **Studio** drawer (featured looks secondary, Tune, collapsed Advanced). **Export** menu (campaign pack + StageRecipe + preset/PNG/WebM). One-shot migrate from legacy `stage.activeBrandKit.v1` localStorage.

**Honest limits:** No auth / sync / multi-device. Lab-first only (`/` marketing + `/story` not remade). GPU still one hero + one overlay. Lab workspace ≠ API `/v1/brands`. No Phase 6 plate gen / Jobs UI.

**Smoke:** Library → create brand → set active → upload assets → Use as hero → floating brief Apply → Export → Download campaign pack. Reload: brands/assets persist in IDB.

### Known issues / deferred (bugfix)

- Legacy `BrandKitPanel` / old Source “Add images” paths no longer primary (Library replaces them); leftover draft/`labStageDraft` quirks may still exist for recipe extras
- Library assets are IndexedDB `Blob`s; upload alone does not paint the canvas — use **Use as hero** / overlay
- Compositor still L0 hero + L1 decal + text slots
- Cold-start wipe of API brands/jobs
- No multi-tenant SaaS / real storage / Meta publish

**Next:** Bugfix pass. Do **not** start plate gen (Phase 6) without an explicit revise.

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
| [`../src/lib/preset/PORTING.md`](../src/lib/preset/PORTING.md) | Standalone shader port checklist |
| [`../src/lib/stage/EMBED.md`](../src/lib/stage/EMBED.md) | In-repo StageRecipe embed helper + a11y |

---

## Revision

Bump a short note here when the freeze changes:

| Version | Note |
|---------|------|
| `stage-phase0-2026-08-10` | Initial freeze — web+API, upload-first, optional gen flag |
| `stage-phase1-2026-08-10` | Phase 1 recipe spine in lab — adaptor + import/export; GPU still v2 slots |
| `stage-phase2-2026-08-10` | Phase 2 brand kit (localStorage) + Gemini brief → validated patch |
| `stage-phase3-2026-08-10` | Phase 3 campaign pack ZIP (3 stills + StageRecipe) from `/lab` |
| `stage-phase4-2026-08-11` | Phase 4 in-memory Jobs API + API key gate; Phase 5 embed helper + `/embed-demo` |
| `stage-lab-ui-2026-08-11` | Lab UI remake — IndexedDB workspace (brands/assets), Library + floating brief + Studio/Export chrome |
