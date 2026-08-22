# M02 — Packs & Semantic Sliders

**Status:** research card  
**Date:** 2026-08-23  
**Depends on:** `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`, `02_CONSTITUTION.md`, `M00_COMPOSITOR.md`, `M01_RECIPE_SCHEMA.md`, `I0_CHANGELOG.md`  
**Purpose:** Decide how Prism turns a still into a **named look** (packs as composed registry values) and how the lab **tunes** that look via semantic sliders — both writing PathPatch → `validateRecipe` → the same recipe. Explicitly require a **GPU grade path** so pack/slider params become visible (closes the I0 identity-draw gap). No LLM talk (M03), no export/hero (M04).

---

## 0. Question

How should Prism encode **craft** (named packs) and **control** (few human knobs) over a closed Tier A effect registry so that:

1. applying a pack produces a falsifiable pixel change on canvas,
2. slider moves are recipe-truthful PathPatches (same paths M03 will reuse),
3. pack apply preserves user assets and can be intensity-scaled,
4. LUT-only or “secret second shader” looks are refused?

Constitutional locks bind this card: packs = composed values (`02` §2.7); recipe is truth; talk≡sliders later; PathPatch + merge-apply from M01 R9/R11; closed registry; no Canva templates / campaign packs.

---

## 1. Why packs+sliders matter (lab loop after I0)

I0 shipped upload → composite → recipe/assets with **schema-admitted** grade effects, but the compositor still draws **identity** for those params ([`I0_CHANGELOG`](../reviews/I0_CHANGELOG.md)). Without packs+sliders **and** grade GLSL, RQ2 (`00` §5) is untestable: there is no “editorial / film / poster” loop to rate.

Tier A’s lovable loop (`00` §8, `02` §5.1) is: upload → **pick a pack** → live grade → **semantic sliders** → (later) talk / export. Packs give named craft; sliders give VSCO Pro–style decompose without dumping one slider per registry uniform (`01` §9; `00` D6). Both must mutate the **same** recipe fields so M03 cannot invent a parallel look language.

---

## 2. Research map

### A. Preset / pack craft

| Source | Pattern | Lesson |
|--------|---------|--------|
| **VSCO Pro Presets** | Baked look + **Contrast / Color / Tone** (+ strength) decompose ([VSCO Pro](https://www.vsco.co/features/photo-filters/pro-presets); [Full Spectrum](https://vsco.co/vsco/journal/full-spectrum)) | Few semantic axes over a preset, not 40 raw params |
| **VSCO Film X** | Character / warmth / contrast; grain separate from tonality ([Film how-to](https://www.vsco.co/learn/how-to-make-photos-look-like-film); [Imaging Lab](https://eng.vsco.co/vsco-film-x-&-the-imaging-lab/)) | Film look = grade + texture; grain alone ≠ film |
| **Lightroom / XMP** | Presets = **parametric** develop settings, not pixels ([PixelPeeper XMP](https://pixelpeeper.com/lightroom-preset-viewer)) | Pack JSON mirrors params; assets stay out |
| **PassXMP / LUT limits** | 3D LUT encodes global color only; grain/vignette/clarity **sanitized out** ([PassXMP](https://github.com/maxthomason/PassXMP); [Ellis Export LUT](https://johnrellis.com/lightroom/exportlut.htm)) | Pack ≠ LUT blob; spatial ops stay separate effects (`01` §2.2) |
| **Lumen / FILTR** | Modular stack presets; media refs not blobs ([Lumen](https://legenki.com/lumen/); [FILTR](https://antlii.work/WIP-Tool)) | Pack = craft values onto current media |

**Encoding “editorial / film / poster” without AI:** desat+contrast+fade+grain (B&W editorial); warm temperature+fade+grain+vignette (film); punch contrast+sat+vignette±duotone (poster). Matches `00` §11.A parametric column.

### B. Semantic UI over closed registries

| Source | Pattern | Lesson |
|--------|---------|--------|
| **VideoFlow** | Ordered `effects[]` in JSON; params addressable by path ([effects guide](https://videoflow.dev/docs/guide/effects); [stacking blog](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)) | Order is the look; UI knobs → effect params |
| **kampos** | Tiny ordered effect DSL ([kampos](https://github.com/wix-incubator/kampos)) | Closed ids + params, not free GLSL from UI |
| **Legacy `mapSemanticSliders`** | intensity/motion/grit → many uniforms (`01` §9) | **ADAPT** many-from-few; **DROP** old names |

### C. GPU grade (specify now; implement I1)

Pointwise grade in one fragment path is **FEASIBLE** for Tier A (no blur): exposure (`c * 2^ev`), contrast (mix toward pivot), saturation (lerp to Rec.709 luma), temperature (cheap R/B shift), fade (lift/compress), duotone (luma→mix), vignette (radial multiply), grain (hash noise) — common single-pass stacks ([Severien WebGL color](https://tsev.dev/posts/2020-06-19-colour-correction-with-webgl/); [Chrome Snapshot filter shader](https://github.com/GoogleChromeLabs/snapshot/blob/master/src/filters/filter-fragment-shader.glsl); [filmlook DEV](https://dev.to/hblai_filmlook/twelve-retro-photo-effects-in-one-webgl-fragment-shader-and-why-the-photo-never-leaves-the-browser-589b)).

**Ordering (recommend):** on **main** RGB after sample, before composite: `exposure → contrast → saturation → temperature → fade|duotone → vignette → grain`. Preserve alpha; keep working buffers **premultiplied** (M00 C4): grade straight-ish RGB then remultiply, or grade premul carefully and leave α unchanged. Overlay draws **after** graded main (M00 §8) so overlay textures are not forced through the main look unless the pack sets light overlay object fields.

### D. Pack versioning & drift

M01 R13: `packId` + `packVersion` refuse silent look drift. When `effectsRegistry` ranges change, bump **`engineVersion`**; when pack default numbers change, bump **`packVersion`**. Loading a recipe whose `packVersion` is unknown → warn or refuse auto-reapply of “same pack” from catalog (keep stored absolute `effects[]` — those are truth). Do not silently re-merge catalog defaults over a saved recipe.

---

## 3. What a pack is (data contract)

A **pack** is **not** a Canva template, not a new op, not a LUT file, not a second renderer.

```text
Pack {
  id: string                 // stable kebab id, e.g. "editorial-bw"
  version: string            // semver-ish content rev, e.g. "1.0.0"
  label: string              // human name
  summary?: string           // one line
  axes: string[]             // semantic slider ids this pack cares about (lab hint)
  mainEffects: Effect[]      // ordered; closed registry ids only (same shape as recipe)
  overlay?: {                // optional light defaults; no masks
    opacity?: number         // 0..1 — applied only if overlay object exists
    blend?: BlendId
    // no required overlay asset; never invents pixels
  }
  // intentionally omitted: text content, asset bytes, new Effect.ids
}
```

**In-repo home (I1):** `src/packs/*.json` (+ thin loader that validates effects against `TIER_A_EFFECTS`). Catalog is code-owned craft, versioned in git.

**Apply semantics (M01 R11):** merge onto **current** recipe — rewrite main `effects[]` from `mainEffects`, optionally patch overlay opacity/blend, set `packId`/`packVersion`, **preserve** main/overlay `source` AssetRefs and text object. File/hash load remains **replace document**.

---

## 4. Tier A pack catalog proposal (exactly 3)

Operator may KEEP/CUT defaults; ids and axes are the proposal.

### `editorial-bw` — “Editorial B&W”

| Field | Value |
|-------|--------|
| version | `1.0.0` |
| axes | `contrast`, `chroma`, `fade`, `grain` |
| mainEffects | `saturation{amount:-0.95}`, `contrast{0.4}`, `fade{0.18}`, `grain{0.28}` |
| overlay | optional: `opacity: 0.9`, `blend: "multiply"` if overlay present |

Desaturated print look; fade lifts blacks slightly; grain for paper texture. No temperature (would recolor).

### `warm-film` — “Warm Film”

| Field | Value |
|-------|--------|
| version | `1.0.0` |
| axes | `warmth`, `fade`, `grain`, `vignette` |
| mainEffects | `temperature{0.35}`, `contrast{0.15}`, `saturation{-0.1}`, `fade{0.22}`, `grain{0.35}`, `vignette{0.4}` |
| overlay | none required |

Scanner-warmth + soft blacks + edge falloff; grain after grade (Film X lesson: texture ≠ tonality alone).

### `poster-punch` — “Poster Punch”

| Field | Value |
|-------|--------|
| version | `1.0.0` |
| axes | `contrast`, `chroma`, `vignette`, `duotone` |
| mainEffects | `contrast{0.55}`, `saturation{0.35}`, `vignette{0.45}`, `duotone{amount:0.55, shadow:"#1a1030", highlight:"#f2e6c8"}` |
| overlay | optional: `blend: "screen"`, `opacity: 0.35` if overlay present |

High-key poster energy; duotone is the CI accent (registry already admits overlay/main duotone).

**Falsifier gate:** any two packs must differ in **at least one** `mainEffects` param (not merely `id` string).

---

## 5. Semantic slider map

**Policy:** 5–8 lab knobs max. Each slider emits PathPatch ops against **allowlisted** paths (M01). Prefer addressing main by id `"main"`.

### Tier A slider set (7)

| Slider id | Label | PathPatch path(s) | Registry param | Range (UI clamp pre-emit) |
|-----------|-------|-------------------|----------------|---------------------------|
| `exposure` | Exposure | `/objects/main/effects/{i}/params/amount` where effect id=`exposure` | `exposure.amount` | −2…2 |
| `contrast` | Contrast | … `contrast` | `contrast.amount` | −1…1 |
| `warmth` | Warmth | … `temperature` | `temperature.amount` | −1…1 |
| `chroma` | Chroma | … `saturation` | `saturation.amount` | −1…1 |
| `fade` | Fade | … `fade` | `fade.amount` | 0…1 |
| `grain` | Grain | … `grain` | `grain.amount` | 0…1 |
| `vignette` | Vignette | … `vignette` | `vignette.amount` | 0…1 |

Optional 8th when `poster-punch` (or any pack with duotone) is active:

| `duotone` | Duotone | … `duotone` → `amount` | `duotone.amount` | 0…1 |

Shadow/highlight hex stay pack defaults unless a later UI admits color pickers (not Tier A lab chrome).

### Mapping rule (binding)

1. Ensure the target effect exists on main at a stable index (pack apply installs full `mainEffects` order; identity starts `effects: []` — **ensureEffect(id)** inserts registry-default params before patch if missing).
2. Emit `{ path: "/objects/main/effects/{index}/params/{key}", value }` only.
3. Run `applyPathPatch` → `validateRecipe` (reject OOR; no silent clamp in validator).
4. Never invent Effect.ids; never patch overlay/text effects for Tier A grade knobs (text stays `effects: []`).

**Object target:** grade sliders → **main** only. Overlay opacity/blend are pack-apply side effects or separate object controls (already PathPatch-allowlisted), not semantic “look” axes.

---

## 6. Pack apply / reset / intensity rules

### Apply

```text
applyPack(current, packId):
  pack = loadCatalog(packId)           // fail loud if missing
  candidate = clone(current)
  main = require main image object
  main.effects = clone(pack.mainEffects)
  if pack.overlay && overlay object exists:
    merge opacity/blend if specified
  // NEVER touch source AssetRefs or text.content via pack
  candidate.packId = pack.id
  candidate.packVersion = pack.version
  validateRecipe(candidate) → commit
```

### Intensity (lab control, **not** a recipe field)

`intensity ∈ [0,1]` lerps each numeric param in `pack.mainEffects` toward **identity defaults** (0 for most amounts; saturation/contrast/temperature 0; exposure 0). Re-run apply with scaled effects; recipe stores **absolute** params (replayable without remembering intensity). UI may show intensity; sharing a recipe does not require the intensity widget.

### Reset

- **Reset pack:** re-apply current `packId` at intensity 1.  
- **Reset look / identity grade:** clear main `effects` to `[]`, `packId/packVersion → null`, keep assets (full replace only for file/hash).

### User overrides

After pack apply, any slider PathPatch overrides absolute params; `packId` remains as **provenance** until another pack apply or identity reset. Changing a slider does **not** clear `packId` (Lightroom-like: “based on preset, then tuned”).

---

## 7. Compositor dependency (grade GLSL required for falsifiers)

**I0 gap:** packs/sliders without grade shaders cannot be falsified on canvas.

**I1 requirement (design here; code later):**

1. Extend the main-image fragment path (or a dedicated `grade.frag` variant) to read uniforms mirrored from `main.effects` via `effectsRegistry` ranges.
2. Implement Tier A ship set: `exposure`, `contrast`, `saturation`, `temperature`, `fade`, `duotone`, `grain`, `vignette`.
3. Fixed op order §2.C; missing effect id → identity for that stage.
4. Draw order unchanged: **grade main → composite overlay → text** (M00).
5. Dirty-flag: param change → uniform update; effect graph identity/order change → optional recompile (uniform-only is enough if all Tier A ops live in one shader).
6. No ping-pong for these ops (pointwise + UV-local vignette/grain).

Without this slice, Falsifier F1 below is guaranteed.

---

## 8. Lab UX stub (not a design system)

Minimal proving UI for I1:

- Pack picker: three buttons/tiles (`editorial-bw`, `warm-film`, `poster-punch`) + “None / identity”.
- Intensity slider (0–1) under pack picker.
- Semantic sliders (7, + duotone when present).
- Existing upload main/overlay + text fields stay.
- Recipe JSON peek (dev): show `packId`, `packVersion`, main `effects[]` after each change.
- Error banner already exists for validate/PathPatch failures.

No marketing chrome, no pack marketplace, no hero polish.

---

## 9. Open questions / falsifiers

| # | Falsifier | Meaning |
|---|-----------|---------|
| F1 | Apply pack → **pixels unchanged** | Grade GLSL missing (I0 gap) |
| F2 | Move slider → recipe field **unchanged** | Sliders not writing PathPatch / recipe not truth |
| F3 | Apply pack → main/overlay `assetId` wiped | Violates M01 R11 |
| F4 | Semantic slider emits illegal path or OOR | Allowlist/registry breach |
| F5 | Two packs differ only in `packId` string | Catalog craft failure |
| F6 | Saved recipe reopened → look silently remapped by new catalog defaults | Version drift (`packVersion` / absolute effects ignored) |
| F7 | Overlay required / mask required for a Tier A pack | Scope breach |

Open (non-blocking): exact fade math (lift blacks vs mix-to-gray); grain seed stability across preview/export (export = M04); whether duotone hex should be PathPatch-allowlisted in Tier A.

---

## 10. Won’t chase

- LLM router / prompts / mood sentences (**M03**)
- PNG export, URL hash share, hero embed polish (**M04**)
- Masks, multi-image beyond M00 caps, adjustment layers
- Canva templates, campaign packs, Jobs API, brand kits
- Spectral Film X models, 3D LUT packs as v1 craft unit
- One slider per registry param; legacy intensity/motion/grit names
- Reopening M00 hybrid architecture or M01 storage/PathPatch model
- Implementing app code in this docs task

---

## 11. Decision log

| # | Topic | Decision | Why |
|---|-------|----------|-----|
| P1 | Pack = data | Named JSON: `id`, `version`, `mainEffects[]`, optional light `overlay` defaults | Constitution: composed values; XMP/FILTR parametric |
| P2 | Catalog size | **Exactly 3** Tier A packs | `00` Tier A; RQ2 coverage without sprawl |
| P3 | Pack trio | `editorial-bw`, `warm-film`, `poster-punch` | Editorial / film / poster axes from field research |
| P4 | Storage | In-repo `src/packs/*.json` | Solo-dev FEASIBLE; git-versioned craft |
| P5 | Sliders | ≤8 semantic ids; table in §5; main-only grade | VSCO Pro decompose; ADAPT many-from-few |
| P6 | Write path | Sliders → PathPatch allowlist → `validateRecipe` | M01 R9; talk≡sliders later |
| P7 | Pack apply | Merge helper (not PathPatch-only); keep AssetRefs; set pack versions | M01 R11 |
| P8 | Intensity | Lab lerp; absolute params in recipe | Share/replay without hidden UI state |
| P9 | GPU | I1 must ship grade GLSL wired to registry | Close I0 identity gap; falsifiers F1 |
| P10 | Grade order | Main before overlay; exposure…grain chain | Premul composite honesty; PassXMP spatial split |
| P11 | Versioning | Bump `packVersion` on default edits; `engineVersion` on math/range edits | M01 R13; refuse silent drift |
| P12 | Out of scope | M03 talk, M04 export/hero | Tier A sequencing |

---

## 12. References

- VSCO Pro Presets — [product](https://www.vsco.co/features/photo-filters/pro-presets), [Full Spectrum](https://vsco.co/vsco/journal/full-spectrum)  
- VSCO Film craft — [Film how-to](https://www.vsco.co/learn/how-to-make-photos-look-like-film), [Imaging Lab](https://eng.vsco.co/vsco-film-x-&-the-imaging-lab/)  
- PassXMP / LUT limits — [GitHub](https://github.com/maxthomason/PassXMP), [Ellis Export LUT](https://johnrellis.com/lightroom/exportlut.htm)  
- Lightroom XMP as parametric recipe — [PixelPeeper](https://pixelpeeper.com/lightroom-preset-viewer)  
- VideoFlow ordered effects JSON — [docs](https://videoflow.dev/docs/guide/effects), [blog](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)  
- kampos — [GitHub](https://github.com/wix-incubator/kampos)  
- Lumen / FILTR presets — [Lumen](https://legenki.com/lumen/), [FILTR](https://antlii.work/WIP-Tool)  
- WebGL grade math — [Severien](https://tsev.dev/posts/2020-06-19-colour-correction-with-webgl/), [Snapshot shader](https://github.com/GoogleChromeLabs/snapshot/blob/master/src/filters/filter-fragment-shader.glsl), [filmlook DEV](https://dev.to/hblai_filmlook/twelve-retro-photo-effects-in-one-webgl-fragment-shader-and-why-the-photo-never-leaves-the-browser-589b)  
- In-repo: `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`, `02_CONSTITUTION.md`, `M00_COMPOSITOR.md`, `M01_RECIPE_SCHEMA.md`, `I0_CHANGELOG.md`, `src/recipe/effectsRegistry.ts`

---

## Operator summary

- **Pack data shape:** `{ id, version, label, axes[], mainEffects: Effect[], overlay? }` — preset values over the closed registry; lives in `src/packs/*.json`; apply merges onto current recipe and **keeps** asset ids.  
- **3 Tier A packs:** `editorial-bw` (desat/contrast/fade/grain), `warm-film` (temp/fade/grain/vignette), `poster-punch` (contrast/sat/vignette/duotone).  
- **Semantic sliders:** `exposure`, `contrast`, `warmth`, `chroma`, `fade`, `grain`, `vignette` (+ `duotone` when present).  
- **PathPatch rule:** slider → `/objects/main/effects/{index}/params/{key}` only → same `validateRecipe` as M01; pack apply is the merge helper for whole `effects[]`.  
- **I1 must code next:** packs UI + catalog loader, slider→PathPatch wiring, and **grade GLSL** reading `effectsRegistry` (close I0 identity gap).

## Next implement slice pointer

**I1 plan:** `src/packs/*.json` + `applyPack` / intensity lerp → Lab pack picker + semantic sliders → main fragment uniforms for Tier A effects (order §2.C) → falsifiers F1–F5 in manual lab check. M03 talk and M04 export stay blocked until packs are visible on canvas.
