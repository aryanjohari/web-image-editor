# M05 — Masks & Regional Grade

**Status:** research card  
**Date:** 2026-08-29  
**Depends on:** `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`, `02_CONSTITUTION.md`, `M00_COMPOSITOR.md`, `M01_RECIPE_SCHEMA.md`, `M02_PACKS_AND_SLIDERS.md`, `M03_TALK_ROUTER.md`, `M04_EXPORT.md`, `I0_CHANGELOG.md`–`I3_CHANGELOG.md`  
**Purpose:** Decide how Prism adds **subject/background (regional) grading** via mask **weight textures** + split recipe params — stored as `maskRef` assets, applied in the same WebGL compositor/export path — so prompts like “me in color, muted background” work without inpaint or a second renderer.

---

## 0. Question

How should Tier B add **regional looks** without breaking recipe truth, talk≡sliders, or reopening the compositor architecture?

1. **Mask representation:** weight texture vs fake layer — what is stored, where, and how it binds in GLSL?
2. **Regional recipe encoding:** how do subject vs background params live in JSON so PathPatch, packs, and talk share one schema?
3. **Compositor integration:** single-pass dual-grade + `mix()` vs ping-pong — where in the main chain does the mask apply?
4. **Mask acquisition:** MediaPipe default vs SAM2 vs server matting — when it runs, cost, and failure modes (`00` RQ4)?
5. **UX/control extension:** minimal regional sliders and talk tools without exploding knob count or inventing inpaint?
6. **Export/share:** mask ref in recipe, PNG includes regional grade, hash budget, missing-mask honesty (extend M04)?
7. **Constitutional tension:** Tier B may add regional control only if Tier A recipe truth stays intact (`02` §5.2); masks are textures, not layers (M00 C6; `01` §5.1); no generative fill (`00` D7).

---

## 1. Why masks now

Tier A shipped the full loop: upload → packs → semantic sliders → grade GLSL → PNG/recipe/hash → optional Gemini talk ([`I0`](../reviews/I0_CHANGELOG.md)–[`I3`](../reviews/I3_CHANGELOG.md)). Grade today is **global on main only** (M02 P10); `maskRef` is parsed but **rejected** when visible (`src/recipe/validate.ts` → `MASK_ACTIVE`).

That caps user stories at global-only looks. **`00` §6** tags “me in color, muted background” as **Tier B** (person mask + dual grade). **RQ1** asks whether pack routing + regional masks beats global filters for subject/background prompts; **RQ4** asks for the minimum mask pipeline that unlocks RQ1 without beauty-app cost.

Prism’s lane is **parametric appearance on fixed pixels** — regional grade is `mix(gradeSubject, gradeBackground, mask)`, not background invention (`00` §11.A). Generative cutout/inpaint stays competitor territory (Photoroom FDM; `00` §7).

---

## 2. Research map

### A. Mask as GPU weight

| Source | Pattern | Lens | Lesson |
|--------|---------|------|--------|
| **FILTR** | Mask = per-pixel influence map (0–1); modulates assigned module output via blend between input and module result; channel-selectable (Luma/A/R/G/B); ping-pong FBO stack ([FILTR WIP](https://antlii.work/WIP-Tool)) | **EVIDENCE** | Masks are **weight textures**, not photo layers — matches M00 C6 / `01` §5.1 |
| **Lumen** | Any module can alpha-mask a group; modular stack + presets ([Lumen](https://legenki.com/lumen/)) | **EVIDENCE** | Regional control = texture-modulated pass groups, not new object kind |
| **Single-pass dual-grade** | `rgb = mix(gradeA(src), gradeB(src), m)` samples source once; both grades are pointwise (Tier A ops) | **FEASIBLE** | No ping-pong needed for regional **color** split; same fragment path as `textured.frag.glsl` |
| **Ping-pong escalation** | Required when pass reads **previous** result (blur, neighborhood) ([FILTR](https://antlii.work/WIP-Tool); `01` §5.3) | **EVIDENCE** | Tier B I4 slice stays pointwise → **single pass**; defer ping-pong to blur/L-tier |
| **Premul / Porter-Duff** | Working buffers premultiplied; mask weights coverage of **grade mix**, not a second alpha composite ([Porter & Duff 1984](https://doi.org/10.1145/800031.808606); M00 C4) | **EVIDENCE** | Opaque photo: mask modulates RGB mix; leave α unchanged until overlay composite |

**Reject:** mask-as-layer (fake `kind=mask` drawable); per-frame mask regen inside render loop; second shader tree for export.

### B. Segmentation options (`00` RQ4, D5)

| Pipeline | Pros | Cons | Lens |
|----------|------|------|------|
| **MediaPipe SelfieSegmenter (landscape)** | ~250KB model; person/bg classes; browser WASM + optional GPU delegate; official Image Segmenter API ([Google AI Edge](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter); [ImageSegmenter API](https://developers.google.com/edge/api/mediapipe/js/tasks-vision.imagesegmenter)) | Person-only; soft hair edges; worker/module quirks ([issues #5257](https://github.com/google-ai-edge/mediapipe/issues/5257), [#5479](https://github.com/google-ai-edge/mediapipe/issues/5479)) | **FEASIBLE — Tier B default** |
| **SAM 2 WebGPU (WebSAM / sam-web)** | High quality; encode-once ~345–700ms (MobileSAM/sam2_tiny); interactive refinement ([WebSAM](https://github.com/Xevion/WebSAM); [sam-web](https://www.npmjs.com/package/sam-web); [ONNX WebGPU blog](https://opensource.microsoft.com/blog/2024/02/29/onnx-runtime-web-unleashes-generative-ai-in-the-browser-using-webgpu/)) | 145–878MB weights; iOS WebGPU fragile; overkill for auto person split | **FEASIBLE — escape hatch, not MVP default** |
| **rembg / BiRefNet (server)** | Better hair/glass than U2Net default ([BiRefNet vs rembg](https://pixelapi.hashnode.dev/birefnet-vs-rembg-vs-u2net-which-background-removal-model-actually-works-in-production-1-1-1-1-1); [aireiter comparison](https://aireiter.com/blog/best-background-removal-api)) | CPU 10–15s+; 973MB ONNX; ops/privacy/cost | **EVIDENCE — Tier B+ compare arm only** |
| **Commercial APIs** (remove.bg, Photoroom) | Consistent edges at scale | Cost, vendor lock, not recipe truth | **HYPE / compare only** |

**IG-good vs beauty-app:** carousels tolerate 1–2px halos and soft hair; beauty apps need frequency separation and video stability (`00` §11.D). Tier B targets **IG-good person split**, not glass-lace wigs.

### C. Regional recipe encoding

| Source | Pattern | Lens | Lesson |
|--------|---------|------|--------|
| **Lightroom / XMP** | Global develop params in XMP (`crs:Exposure2012`, …); AI mask maps in `.acr` sidecar; each mask carries its own adjustment stack ([Lightroom masking](https://www.adobe.com/products/photoshop-lightroom/masking.html); [how edits stored](https://glensmith.co.uk/articles/how-lightroom-and-photoshop-store-edits-explained)) | **EVIDENCE** | **Split param sets** bound to one segmentation ref — not duplicate full photos |
| **VideoFlow** | Per-layer ordered `effects[]`; resolution-agnostic JSON ([blog](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)) | **EVIDENCE** | Keep closed `Effect{id,params}` — regional = **two effect lists**, not new op types |
| **M01 PathPatch** | Allowlisted JSON Pointers; talk≡sliders ([M01](M01_RECIPE_SCHEMA.md) R9) | **shipped** | Regional paths must extend allowlist, not free LLM pointers |
| **Reject:** duplicate `objects[]` for subject/bg; document-level `regions[]` with floating geometry; LLM-authored mask paths |

### D. Pack/slider extension

| Source | Pattern | Lens | Lesson |
|--------|---------|------|--------|
| **VSCO Pro** | Preset + few semantic axes (Color/Contrast/Tone) ([VSCO Pro](https://www.vsco.co/features/photo-filters/pro-presets)) | **EVIDENCE** | Add **regional semantic axes**, not 2× full slider banks |
| **M02 Tier A sliders** | 7 global knobs on main `effects[]` ([M02](M02_PACKS_AND_SLIDERS.md) §5) | **shipped** | Global path unchanged when no mask; regional axes activate when `maskRef` resolves |
| **Proposed Tier B axes (4)** | `bg_mute`, `subject_pop`, `bg_fade`, `subject_chroma` | **POLICY** | Map to background/subject `effects[]` params — covers “muted bg / me in color” without 14 sliders |

### E. Talk extension

| Source | Pattern | Lens | Lesson |
|--------|---------|------|--------|
| **M03 closed tools** | `apply_pack`, `set_slider`, `delta_slider`, `refuse` → normalize → shipped helpers ([M03](M03_TALK_ROUTER.md)) | **shipped** | Add closed regional tools; still no free PathPatch strings |
| **`00` D4 / Pattern 2** | Vision **tag once** → recipe `meta`; no pixel send every turn ([OpenAI vision+calling cookbook](https://developers.openai.com/cookbook/examples/multimodal/using_gpt4_vision_with_function_calling/)) | **EVIDENCE** | Optional one-shot tags (`meta.subjectCount`, `meta.scene`) — **PARK** for I4; never mask bytes to Gemini each turn |
| **Reject:** “segment this photo” open tool; mask polygon from LLM; vision-required regional routing in Tier B MVP |

### F. Export/share

| Source | Pattern | Lens | Lesson |
|--------|---------|------|--------|
| **M04 X1–X6** | Same GLSL → export FBO @ native RT; hash = recipe only; `listMissingAssets` fail closed ([M04](M04_EXPORT.md)) | **shipped** | Mask asset must join missing-asset checks; PNG must include regional grade |
| **FILTR / Lumen** | Presets store refs; media reconnects on reload ([FILTR](https://antlii.work/WIP-Tool)) | **EVIDENCE** | Shared hash without mask blob → honest re-upload UX |
| **M01 R4** | `AssetRef` `{type:id}` lab; `{type:url}` hero | **shipped** | Mask uses same sidecar store as photos |

### G. Quality bar (`00` RQ1, RQ4)

| Bar | Definition | Falsifier |
|-----|------------|-----------|
| **IG-good edge** | Person split usable in carousel crop; no obvious square cutout | Hair/glass subset: regional grade **worse** than careful global grade |
| **Intent match (RQ1)** | Blind preference for regional vs global on subject/bg prompts | No significant preference at equal latency |
| **Latency** | Mask gen + first regional preview < **3 s** @ 1080p portrait (target, not measured) | Auto mask blocks upload loop |
| **Determinism** | Same recipe + assets → same PNG (grain seed unchanged) | Mask regen without recipe bump changes export silently |

---

## 3. Data contract

### Mask asset

| Field | Lock |
|-------|------|
| **Storage** | IndexedDB via `{ type: "id", assetId }` — same `AssetRecord` store as photos (M01 R3) |
| **Format** | **Single-channel weight** stored as PNG: R = subject weight \(w \in [0,1]\); G/B unused; A = 1. Optional metadata `kind: "person-split"` |
| **Resolution** | **Match main image native** W×H (clamped `MAX_TEXTURE_SIZE`); bilinear sample in shader |
| **Recipe pointer** | `objects[main].maskRef?: AssetRef` — **one mask max**, main object only (I4 scope cap) |
| **Not in hash bytes** | Mask pixels stay in IDB / bundled URL — recipe carries ref only (M01 R12) |

### Regional params on main object

When `maskRef` is present and resolved, compositor uses **`regional`** instead of flat `effects[]`. When absent, **`effects[]`** remains Tier A global path (backward compatible).

```text
Object (kind=image, role=main) {
  source: AssetRef
  maskRef?: AssetRef                    // Tier B: person-split weight map
  effects: Effect[]                     // global fallback when no mask
  regional?: {
    subject: Effect[]                   // same closed OpIds as M02 Tier A set
    background: Effect[]
  }
  // overlay/text objects unchanged; no maskRef in I4
}
```

**Example (muted background, color subject):**

```json
{
  "id": "main",
  "kind": "image",
  "role": "main",
  "source": { "type": "id", "assetId": "photo-abc" },
  "maskRef": { "type": "id", "assetId": "mask-abc" },
  "effects": [],
  "regional": {
    "subject": [
      { "id": "saturation", "params": { "amount": 0.1 } },
      { "id": "contrast", "params": { "amount": 0.2 } }
    ],
    "background": [
      { "id": "saturation", "params": { "amount": -0.85 } },
      { "id": "fade", "params": { "amount": 0.35 } },
      { "id": "grain", "params": { "amount": 0.15, "seed": 0 } }
    ]
  }
}
```

**Validation (Tier B enabled):**

- Visible main + `maskRef` → **`regional` required** with both `subject` and `background` arrays (may be empty = identity).
- `maskRef` on overlay/text → **reject** (I4 scope).
- Second mask on any object → **reject**.
- Unknown effect ids / OOR params → same fail-closed as Tier A.
- Tier A mode (`engineVersion` without regional feature): visible `maskRef` still **reject** (current behavior preserved).

**Feature gate:** bump `engineVersion` to **`0.2.0`** (or `schemaVersion` **`1.1`**) when regional + mask admission ships; older recipes without `maskRef` load unchanged.

---

## 4. GPU / compositor plan

**Architecture lock:** extend existing **`textured.frag.glsl`** main path — **no second shader tree** (M04 X2; `02` one-engine).

### Main draw (mask active)

```glsl
// After sample + contain/crop:
vec3 src = texture(u_tex, uv).rgb;
float w = texture(u_mask, uv).r;   // subject weight; clamp edge softness ok
vec3 gSub = applyGrade(src, uv, u_subject_*);
vec3 gBg  = applyGrade(src, uv, u_background_*);
vec3 rgb = mix(gBg, gSub, w);
// alpha unchanged → premul overlay composite as today (M02 P10)
```

| Decision | Lock | Why |
|----------|------|-----|
| **Pass count** | **Single pass** dual-grade on main | Tier A ops are pointwise; FILTR ping-pong deferred until blur/L-tier |
| **Mask bind** | `sampler2D u_mask` on main draw only | Weight texture, not layer |
| **Grade order** | Same chain per region: exposure→…→grain (M02 §2.C) | Parity with global grade |
| **Grain/vignette** | **Inside each regional** `applyGrade` | “Mute bg” can add bg grain without touching subject |
| **Overlay/text** | **After** regional main composite | M02 P10 preserved |
| **Export** | Same uniforms + mask texture @ export RT (M04 X1) | PNG includes regional grade |
| **Missing mask** | **Do not draw**; `MISSING_MASK` error class (mirror `MISSING_ASSET`) | Fail closed like main photo |

**Premul note (M00 C4):** grade operates on straight RGB sampled from opaque photo; output α stays 1.0 for main; overlay path unchanged.

---

## 5. Mask acquisition pipeline

### Default: MediaPipe SelfieSegmenter (landscape)

```text
main photo uploaded → decode bitmap
  → Web Worker: ImageSegmenter (IMAGE mode)
       model: selfie_segmenter_landscape float16 (~144×256 internal)
       output: person confidence → upscale to main W×H
  → encode grayscale PNG (R=person confidence)
  → IDB put mask asset → set main.maskRef + seed regional from current pack/global
  → validateRecipe → compositor bind
```

| Trigger | Lock |
|---------|------|
| **Primary** | **Auto on main upload** (after main `assetId` committed) | RQ1 story works without extra click |
| **Secondary** | **Regenerate mask** button in lab | Replace mask asset; bump `meta.maskGeneratedAt` optional |
| **Talk (optional I4)** | Closed `regenerate_mask` tool — **once per session max** recommended | No mask API every turn |
| **Not in I4** | SAM2 interactive click segmentation as default | Too heavy for solo MVP ([WebSAM](https://github.com/Xevion/WebSAM)) |

### Worker / perf

- Run segmenter in **Web Worker** (MediaPipe samples pattern; [mediapipe-samples-web worker](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/image-segmenter.worker.ts)).
- Use **`vision_bundle.js` + importScripts** or pinned `@mediapipe/tasks-vision` non-module worker build ([issue #5479 fix](https://github.com/google-ai-edge/mediapipe/issues/5479)).
- Cold start: WASM + model fetch once; cache in browser cache/IDB metadata.
- **Target:** first mask < **3 s** @ 1080p portrait (**not measured**).

### Failure modes

| Failure | UX |
|---------|-----|
| Worker/model load fail | Banner: “Mask unavailable — global grade only”; recipe stays without `maskRef` |
| Segmenter returns empty | Treat as failure; do not commit zero mask |
| Non-person image | Soft fail: offer global-only; optional `refuse` copy for talk |
| Missing mask on reload | Block canvas + “Re-upload mask or regenerate” (extend M04 missing-asset) |

### Escape hatch (post-I4 / RQ4 falsifier)

If hair/glass subset fails IG-good bar: optional **server BiRefNet** route (compare arm only) — returns same grayscale PNG contract; **not** Tier B default (`00` §11.D).

---

## 6. Packs / sliders / talk extension

### Global path (unchanged)

No `maskRef` → M02 behavior: pack apply writes `main.effects[]`; semantic sliders patch global paths.

### Regional path (mask resolved)

| Control | Behavior |
|---------|----------|
| **Pack apply** | I4: pack still sets **`effects[]` global**; optionally copy to **both** regional stacks as starting point (future pack `regionalDefaults` — PARK). MVP: pack apply clears `maskRef`-independent global; user enables regional sliders after mask gen |
| **Regional semantic sliders (4)** | See §2.D — patch `regional.background` / `regional.subject` paths |
| **Dual-path** | Sliders visible always; regional group **disabled** until mask ready |

### Tier B semantic slider map (additive)

| Slider id | Label | PathPatch path (main id) | Maps to |
|-----------|-------|--------------------------|---------|
| `bg_mute` | Background mute | `/objects/main/regional/background/effects/{i}/params/amount` on `saturation` | bg desat |
| `bg_fade` | Background fade | … `fade` | lift bg blacks |
| `subject_pop` | Subject pop | … `regional/subject/…/contrast` | subject contrast |
| `subject_chroma` | Subject color | … `regional/subject/…/saturation` | keep subject color |

Implementation: same `ensureEffect` + PathPatch helper as M02. **Allowlist additions (M12):**

```text
/^\/objects\/([^/]+)\/maskRef$/
/^\/objects\/([^/]+)\/regional\/(subject|background)\/effects\/(\d+)\/params\/([A-Za-z0-9_]+)$/
```

Forbidden: free `/regional/...` paths from LLM; `/objects/.../regional` wholesale replace without validate.

### Talk (extends M03)

| Closed tool | Maps to |
|-------------|---------|
| `set_regional_slider` | `{ region: "subject"\|"background", sliderId, value \| delta }` → normalize → regional PathPatch |
| `apply_regional_preset` | `{ backgroundMuted: boolean, subjectPop?: number }` — fixed template, not freeform |
| `regenerate_mask` | triggers worker regen → updates `maskRef` asset id in recipe |
| `refuse` | unchanged for inpaint / “replace background with beach” |

**Still normalize → `applySemanticSlider` / regional helper → `validateRecipe`.** Talk must not emit `/objects/main/regional/...` strings outside enum mapping.

**Vision:** remain **PARK** — optional future `meta.tags` from one-shot Gemini vision; never required for regional routing (M03 T9).

---

## 7. Export / hash

| Artifact | Mask behavior |
|----------|---------------|
| **Recipe JSON / `#r=` hash** | Includes `maskRef` + `regional` blocks; **no mask pixels** |
| **PNG export** | Regional grade in export FBO; mask texture required — missing → **fail closed** (extend `listMissingAssets` to mask role) |
| **Hero `{url}` deploy** | Bundled mask PNG alongside main texture; same-origin |
| **Share UX** | Hash hydrate + missing mask → blocked canvas + “Regenerate or re-upload mask” (M04 F4 extension) |
| **Hash budget** | Regional JSON adds ~200–800 B; stay within M04 12 KiB budget for typical recipes |

**Recipe truth:** changing only mask asset without recipe change is invalid — mask regen updates `maskRef.assetId` and optional `meta.maskAssetRevision`.

---

## 8. Lab UX stub (I4 proves)

Minimal — not Photoshop:

- **Mask status:** idle / generating / ready / failed chip on main upload row.
- **Regenerate mask** button (disabled while generating).
- **Regional slider group** (4 knobs) — enabled when mask ready.
- **Subject/background preview toggle** (optional): false-color overlay (tint w) — debug only, not stored in recipe.
- **Recipe peek:** show `maskRef.assetId`, `regional` snippet.
- Existing pack picker + global sliders remain for no-mask path.

---

## 9. Security / perf

| Concern | Lock |
|---------|------|
| **WASM payload** | ~250KB model + tasks-vision WASM; lazy-load on first portrait upload | 
| **No mask bytes in URL** | POLICY — hash/recipe ref only |
| **Worker isolation** | Segmentation off main thread | 
| **Privacy** | Default pipeline never uploads photo for mask (client MediaPipe) | 
| **Server escape hatch** | Opt-in route; explicit user action; not auto |
| **Talk** | Still no image bytes; `regenerate_mask` is local worker only |

---

## 10. Falsifiers

| # | Falsifier | Meaning |
|---|-----------|---------|
| F1 | **RQ1:** blind ratings show no preference for regional vs global on subject/bg prompts | Masks not worth Tier B complexity |
| F2 | **RQ4:** MediaPipe hair/glass subset fails IG-good; regional looks worse than global | Need server matting or drop regional MVP |
| F3 | Missing `maskRef` asset but canvas/export succeeds | Fail-closed breach (M01 R14 / M04 X6) |
| F4 | PNG without regional grade while lab preview shows split | Export parity broken |
| F5 | Talk “mute background” writes different fields than `bg_mute` slider | talk≡sliders broken |
| F6 | Tier A recipe (no mask) loads/regresses after Tier B ship | Backward compatibility failure |
| F7 | Mask treated as drawable layer in compositor | M00 C6 / FILTR policy violated |
| F8 | “Put me on a beach” succeeds via mask fill | Inpaint breach (`00` D7) |

---

## 11. Won’t chase

- Inpaint, generative background replace, object removal, beauty retouch
- Video masks / temporal matting
- Multi-person / instance masks (person class only in I4)
- Interactive SAM2 as **MVP default** (145MB+; [WebSAM](https://github.com/Xevion/WebSAM))
- Mask objects/groups as public layer type — **PARK** reusable mask entities until falsifier M00 §9.5 fires
- Sending full photo to mask API **every frame** or every talk turn
- Document-level `regions[]` geometry from LLM
- Reopening M00 hybrid architecture or Tier A caps as unlimited layers
- Second renderer / CPU export grade path

---

## 12. Decision log

| # | Topic | Decision | Why |
|---|-------|----------|-----|
| M1 | Mask representation | **Weight texture** (`sampler2D u_mask`); not a layer kind | FILTR; M00 C6; `01` §5.1 |
| M2 | Storage | `maskRef: AssetRef` → IDB grayscale PNG, R=subject weight, native res | M01 R3/R4; FILTR reconnect |
| M3 | Scope cap | **One** mask on **main** only; person split | Solo MVP; RQ1 story |
| M4 | Regional model | **`regional: { subject: Effect[], background: Effect[] }`** on main | Lightroom split stacks; VideoFlow effects[] |
| M5 | Global fallback | Flat `effects[]` when no `maskRef` | Tier A recipes unchanged |
| M6 | Compositor | **Single-pass** `mix(gradeSub, gradeBg, w)` in main fragment shader | Pointwise ops; no ping-pong in I4 |
| M7 | Grade placement | Regional grade on main **before** overlay/text composite | M02 P10 |
| M8 | Mask generation | **Auto on main upload** + manual Regenerate | RQ1 UX; on-demand escape |
| M9 | Default segmenter | **MediaPipe SelfieSegmenter landscape** WASM worker | `00` D5; FEASIBLE size |
| M10 | Escape hatch | Server BiRefNet / SAM2 tiny — **post-MVP**, RQ4-driven | Cost/weight; not default |
| M11 | Validator | Admit `maskRef`+`regional` when `engineVersion ≥ 0.2.0`; Tier A mode unchanged | Backward compatible |
| M12 | PathPatch | Extend allowlist: `/maskRef`, `/regional/{subject\|background}/effects/...` | M01 R9 |
| M13 | Regional sliders | **4** axes: `bg_mute`, `bg_fade`, `subject_pop`, `subject_chroma` | Avoid 2× full banks |
| M14 | Talk tools | `set_regional_slider`, `apply_regional_preset`, `regenerate_mask` + existing refuse | M03 closed-tool pattern |
| M15 | Vision | **PARK** tag-once in `meta` only | M03 T9; D4 |
| M16 | Export | Mask required for PNG when `maskRef` present; hash carries ref only | M04 extension |
| M17 | Feature version | `engineVersion` **0.2.0** gates regional admission | M01 R13 drift control |

---

## 13. References

- Google MediaPipe Image Segmenter — [guide](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter), [JS API](https://developers.google.com/edge/api/mediapipe/js/tasks-vision.imagesegmenter), [worker sample](https://github.com/google-ai-edge/mediapipe-samples-web/blob/main/src/workers/image-segmenter.worker.ts)
- FILTR mask modulator — [antlii.work/WIP-Tool](https://antlii.work/WIP-Tool)
- Lumen modular masks — [legenki.com/lumen](https://legenki.com/lumen/)
- WebSAM / SAM2 browser — [GitHub Xevion/WebSAM](https://github.com/Xevion/WebSAM), [sam-web](https://www.npmjs.com/package/sam-web)
- ONNX Runtime WebGPU + SAM — [Microsoft OSS blog](https://opensource.microsoft.com/blog/2024/02/29/onnx-runtime-web-unleashes-generative-ai-in-the-browser-using-webgpu/)
- BiRefNet vs rembg — [pixelapi](https://pixelapi.hashnode.dev/birefnet-vs-rembg-vs-u2net-which-background-removal-model-actually-works-in-production-1-1-1-1-1), [aireiter](https://aireiter.com/blog/best-background-removal-api)
- Lightroom masking / XMP+ACR — [Adobe](https://www.adobe.com/products/photoshop-lightroom/masking.html), [Glensmith](https://glensmith.co.uk/articles/how-lightroom-and-photoshop-store-edits-explained)
- Porter & Duff — [DOI 10.1145/800031.808606](https://doi.org/10.1145/800031.808606)
- In-repo: `00_FIELD_RESEARCH.md` (RQ1, RQ4, §6 Tier B, D4/D5, §11.D), `01_ENGINE.md` §2.3/§5.1, `02_CONSTITUTION.md` §5.2, M00–M04, I0–I3 changelogs, `src/recipe/{types,validate,pathPatch}.ts`, `src/compositor/{renderer.ts,textured.frag.glsl}`

---

## Operator summary

- **Mask = weight texture**, not a layer: grayscale PNG in IDB, `maskRef` on main, single-pass `mix(subjectGrade, bgGrade, w)` in existing main shader.
- **Regional recipe:** `regional.subject` + `regional.background` effect stacks; global `effects[]` when no mask; **`engineVersion 0.2.0`** gates admission.
- **Default pipeline:** MediaPipe SelfieSegmenter in a worker, **auto on upload**; SAM2/server matting = escape hatch only.
- **Controls:** 4 regional semantic sliders + closed talk tools; global M02 path unchanged without mask.
- **Export:** PNG + hash include regional truth; missing mask fails loud like missing main.

## I4 implement pointer

**I4 slice (plan file later):** (1) MediaPipe worker → mask PNG → IDB + `maskRef`, (2) `regional` schema + `validateRecipe` Tier B gate + PathPatch allowlist, (3) dual-grade branch in `textured.frag.glsl` / `renderer.ts`, (4) 4 regional sliders + optional Regenerate, (5) extend `listMissingAssets` + export PNG parity, (6) falsifiers F1–F8 manual subset. No SAM default, no inpaint, no vision talk, no `docs/reviews/I4_*` in this task.
