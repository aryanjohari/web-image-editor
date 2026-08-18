# Prism — Engine (`01_ENGINE`)

**Status:** living machine design (phase 0.1)  
**Date:** 2026-08-18  
**Branch:** `rewrite/v1-styling`  
**Depends on:** [`VISION.md`](VISION.md), [`00_FIELD_RESEARCH.md`](00_FIELD_RESEARCH.md)  
**Feeds:** `02_CONSTITUTION.md`, `docs/modules/*`, future MATH appendix  

Lens: **EVIDENCE** / **FEASIBLE** / **POLICY (proposal)** / **OPEN**

---

## 0. Purpose of this doc

This is the **body** of Prism: what an image is *for this engine*, how a compositor and a closed op list turn a recipe into pixels, and which organs exist before any constitution or code.

It is not a product pitch, not Gonzalez & Woods, not the WebGL 2 spec, and not a restoration of Stage / Background Studio (`main`). Field facts live in `00`; this file **cites** them and **defines** the machine. Layer **expansion** remains a design RQ, but Tier A scope is now fixed. Unknown numbers stay **not measured**.

**Done when:** an operator can skim §5–6–8–12 and mark KEEP / CUT / OPEN without inventing a second renderer for heroes.

---

## 1. What the machine is (two doors, one engine)

**VISION law:** upload a still → live GPU grade → sliders + optional talk → PNG + recipe JSON; the same recipe can sit behind HTML as a quiet hero. Two doors, **one** engine: **lab** | **recipe/hero**.

| Door | What the user holds | What the GPU does |
|------|---------------------|-------------------|
| **Lab** | Photo + live view + sliders/talk | Recipe → uniforms/textures → draw |
| **Export** | PNG bytes + recipe JSON | Same draw, then **readback** |
| **Hero** | Recipe JSON + source image on a site | Same draw, **no** readback; `pointer-events: none` |

Talk and sliders write the **recipe**, not pixels. LLM is a **router** (`00` D3): intent → validated patch on a closed schema. Hero is a **use** of the same renderer (`pointer-events: none`; freeze `u_time` under `prefers-reduced-motion`). Module card later.

---

## 2. Image & canvas — data model

### 2.1 Pixel, texel, sample, uniform

For this engine (not a graphics textbook):

| Term | Meaning here |
|------|----------------|
| **Image / tensor** | \(I \in \mathbb{R}^{H \times W \times C}\), typically \(C=3\) (RGB) or \(C=4\) (RGBA). CPU array until uploaded. |
| **Texel** | One element of a GPU **texture** (`GL_TEXTURE_2D`). Indexed in texel space; filtered in UV. |
| **Sample** | A filtered lookup `texture(sampler, uv)` — often not “the” texel (linear vs nearest). |
| **Pixel / fragment** | One invocation of the fragment shader → one output on a **render target** (FBO or drawing buffer). |
| **Uniform** | Per-draw constants: matrices, floats, sampler bindings. Sliders/talk change these, not the texel store. |

**EVIDENCE:** texel vs image vs texture ([Geometrian](https://geometrian.com/programming/tutorials/gltextureterm/index.php)); `texture` vs `texelFetch` ([Lighthouse3D](https://www.lighthouse3d.com/tutorials/glsl-tutorial/texturing-with-images/)). Warp **moves UV then samples** — not a convolution (`00` §11.A).

### 2.2 Color as a 3-vector

A working color is \(\mathbf{c} \in \mathbb{R}^3\). Linear appearance ops are \(3\times 3\) matrices \(\mathbf{c}' = M\mathbf{c}\) (channel mixer, bleed, Rec.709 luma as a row). Nonlinear tone is **curves** (1D LUT per channel or luma) or **ASC CDL** slope/offset/power. Arbitrary global maps are **3D LUTs** (`sampler3D` in WebGL2).

**EVIDENCE:** Rec.709 luma \(Y' = 0.2126 R' + 0.7152 G' + 0.0722 B'\) ([ITU-R BT.709](https://www.itu.int/rec/R-REC-BT.709)); GPU 3D LUT as dependent texture lookup ([GPU Gems 2 ch.24](https://developer.nvidia.com/gpugems/gpugems2/part-iii-high-quality-rendering/chapter-24-using-lookup-tables-accelerate-color)); ASC CDL is standardized SOP, lift-gamma-gain is **not** ([Pomfort](https://pomfort.com/article/an-in-depth-look-at-asc-cdl-based-color-controls/)).

**Hard limit (`00` §11.A):** a 3D LUT cannot encode **spatial** ops (grain, vignette, warp, blur). PassXMP zeros those when baking Lightroom → Hald. LUT is a **color** op, never the whole look.

**Working space:** Tier A grades **display-referred** (typical sRGB upload). Scene-linear CDL is **later**. Identity: ungraded photo through the pipeline ≈ source (modulo 8-bit roundtrip). **Not measured.**

### 2.3 Premultiplied vs straight alpha

Porter–Duff **over** is simple only in **premultiplied** alpha: \(C_o = C_a + C_b(1-\alpha_a)\) ([Porter & Duff 1984](https://doi.org/10.1145/800031.808606); [PDF](https://keithp.com/~keithp/porterduff/p253-porter.pdf)). Straight RGB ignores coverage; late multiply filters edges wrong.

**POLICY:** GPU buffers **premultiplied**. PNG is usually straight → `UNPACK_PREMULTIPLY_ALPHA_WEBGL` or shader multiply. Page composite defaults `premultipliedAlpha: true` ([WebGL spec](https://registry.khronos.org/webgl/specs/latest/1.0/); [webglfundamentals α](https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html)). Opaque photos (\(\alpha=1\)): no-op until masks.

### 2.4 What “the canvas” is

**POLICY:** the canvas is **not** an organ. It is the **view** of `(recipe, image)`. Organs are image, recipe, GPU compositor.

Four sizes that must not be collapsed:

| Surface | What it is |
|---------|------------|
| **CSS box** | How large the `<canvas>` *looks* (`clientWidth` / style). |
| **Drawing buffer** | `canvas.width` × `canvas.height` = GL default framebuffer size. Independent of CSS. |
| **Device pixels** | Prefer `ResizeObserver` `device-pixel-content-box` over `clientWidth * devicePixelRatio` ([webgl2fundamentals resize](https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html); [Khronos #2460](https://github.com/KhronosGroup/WebGL/issues/2460)). |
| **Working / export RT** | FBO (or drawing buffer) used for the **grade**. May equal source \(H\times W\), or a clamped preview size. |

`gl.drawingBufferWidth/Height` is what actually allocated (may be smaller than requested). Clamp all RTs to `MAX_TEXTURE_SIZE` (WebGL2 **minimum** 2048; most devices 4096 — [webgl2fundamentals cross-platform](https://webgl2fundamentals.org/webgl/lessons/webgl-cross-platform-issues.html); [MDN best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)).

**Resolution policy:**

- **Source of truth for pixels:** uploaded image native \(H\times W\), clamped to `MAX_TEXTURE_SIZE`.
- **Lab preview:** drawing buffer = display/device-pixel box of the view; contain/letterbox the image (CSS `object-fit: contain` analog). Do not stretch.
- **PNG export:** render at **source** resolution (or user integer scale), preferably from an **FBO**, then `readPixels` / encode. Do not PNG the CSS-sized canvas.
- **Hero:** drawing buffer ≈ display; **GPU-only**; no export path required.

Default WebGL clears the drawing buffer after present (`preserveDrawingBuffer: false`). `toDataURL` / `toBlob` after the frame is **undefined** unless you read **before present** or set preserve ([WebGL spec](https://registry.khronos.org/webgl/specs/latest/1.0/); [gpuweb #4356](https://github.com/gpuweb/gpuweb/discussions/4356)). **POLICY:** export from FBO `readPixels`, not from a preserved backbuffer as the design.

---

## 3. Organ map

| Organ | Responsibility | Side-effect | Tier |
|-------|----------------|-------------|------|
| **image** | Decode upload → CPU tensor → normalize EXIF orientation → `texImage2D`; hold native \(H\times W\) | GPU texture; revoke object URLs | A |
| **recipe** | Ordered `layers[]` + `ops[]` + uniforms + `packVersion`; **source of truth** | None until validate | A |
| **packs** | Named base recipe + semantic axes (VSCO Pro–style decompose; `00` D6) | Loads defaults into recipe | A (3 packs) |
| **gpu / compositor** | Compile/bind shaders; hybrid single-pass + ping-pong; uniforms every frame | Draw to RT / canvas | A |
| **layers** | Stack of image-bearing units; each has opacity, blend, transform, local op list | Extra textures/FBOs as N grows | A schema; Tier A ships 1 live |
| **sliders** | Semantic knobs → **same** recipe fields as talk | Recipe mutation | A |
| **talk** | LLM router → validated **patch JSON** only | Network; never pixels | A optional |
| **export** | FBO readback → PNG; serialize recipe JSON (+ URL hash) | CPU copy; download | A |
| **hero embed** (stub) | Same compositor; CSS behind content | Animation if time ops on | A use / module later |
| **masks** (stub) | Extra weight texture; mix(in, op(in), m) | Upload / vision once | B (`00` RQ1) |
| **layout / type** (stub) | Crop, type, poster slot | CPU text atlas if ever | B+; not engine core |
| **vision tag** (stub) | One-shot colors/scene → recipe metadata | Cached tags | Optional A (`00` D4) |

Packs are **recipes with names**, not campaign-pack SaaS. Masks, posters, LLM depth: **module cards later**.

---

## 4. Control loop

```text
[upload] → image organ (CPU decode → GPU tex)     // once per photo
[pack pick] → recipe ← pack defaults               // CPU
[slider | talk] → patch JSON → merge → recipe
        → VALIDATE (closed op ids, ranges, packVersion)
        → dirty: uniforms and/or shader recompile
        → compositor: textures + uniforms → GPU
        → drawing buffer → <canvas>  (view only)

export branch (on demand):
        recipe + image → FBO at export res → readPixels → PNG
        recipe → JSON (+ optional URL hash)
        (do not PNG the CSS canvas)

hero branch:
        same compositor; no readback; pointer-events:none
        reduced-motion → freeze u_time / still
```

**What is GPU every frame:** fragment math, uniform uploads if dirty, present.  
**What is CPU once (or on recipe compile):** schema validate, shader link, texture upload, LUT upload, pack load, LLM call.  
**Dirty-flag (EVIDENCE):** Lumen renders only when the stack changes ([legenki.com/lumen](https://legenki.com/lumen/)); FILTR pause = render-on-change ([antlii FILTR](https://antlii.work/WIP-Tool)). Still-image lab **should not** spin a 60 fps loop unless a **time** op is active.

Talk failure → sliders still work (VISION; `00` RQ3 mitigation).

---

## 5. Layer & compositor model

### 5.1 Stack semantics

A **layer** is a unit that **emits RGBA** into the composite:

1. Sample (photo texture, or later: fill/noise).
2. Run that layer’s **ordered op list** (warp → color → texture).
3. Apply **opacity** + **blend mode** **over** the accumulator (bottom → top).

W3C splits **blend** (how colors mix where both cover) from **Porter–Duff** (coverage). Default: blend `normal`, composite `source-over` ([Compositing and Blending L1](https://www.w3.org/TR/compositing-1/)). Photoshop-style overlay/multiply/screen are **blend modes**, implemented in the **fragment shader** (not `glBlendFunc` alone — overlay needs a branch; [Khronos forums](https://community.khronos.org/t/blending-mode/34770); [glsl-blend](https://github.com/jamieowen/glsl-blend/)).

**Tier A blend set:** `normal` (over), `multiply`, `screen`, `overlay`.  
**Later:** `soft-light`, `hard-light`, `darken`, `lighten`.  
**Won’t-chase v1:** hue/saturation/color/luminosity (HSL channel swaps; more code, weak editorial need).

**Masks vs layers:** FILTR treats a mask as a **weight texture** modulating assigned passes, not as another photo layer ([FILTR docs](https://antlii.work/WIP-Tool)). Lumen: any module can alpha-mask a group. **POLICY:** masks = extra **textures** (Tier B). Do not invent a mask-layer type in Tier A.

### 5.2 How field engines model a stack (`00` §4, not recopied)

| Engine | Stack model | Pass architecture |
|--------|-------------|-------------------|
| **FILTR** | Ordered modules (pass \| mask); order **is** the look | **Ping-pong two FBOs**; each pass reads A, writes B, swap. HALF_FLOAT RTs. |
| **Lumen** | Modular pipeline; 6 families (fill, displace, blur, colour, effects, mask) | Shared core; **dirty-flag**; not a 60 fps toy |
| **kampos** | `effects[]` on a `Kampos` instance; SVG-filter-like DSL (~4KB) | Core compositor; **optional FBO** for displacement/flowmap ([wix-incubator/kampos](https://github.com/wix-incubator/kampos); [Wix eng](https://www.wix.engineering/post/introducing-kampos-a-tiny-and-fast-effects-compositor)) |
| **VideoFlow** | Per-layer `effects[]` in JSON; order = pass order; resolution-agnostic | Sequential GLSL; browser WebGL2 + server same shaders ([blog](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)) |
| **Shaddy** | Ordered **cards** compiled to **one** fragment `main()`; URL = LZ JSON | Raw WebGL2 **fullscreen quad**; recompile on graph change ([Devpost](https://devpost.com/software/shaddy)) |
| **three.js EffectComposer** | `Pass[]`; ping-pong `rtA`/`rtB` | Scene → RT → ShaderPass chain ([manual](https://threejs.org/manual/en/post-processing.html)) |
| **`main` (legacy)** | Fixed L0/L1 + T0–T3 **uniform banks** in **one** uber-shader | Single draw; **not** a recipe op list |

**Claim:** ping-pong is the honest model for **neighborhood** ops (blur samples neighbors of the *previous* result). Single-pass uber-shaders are honest for **pointwise + UV-warp** chains (each fragment reads the **source** photo, maybe warped). Mixing them without an FBO is how you get “blur the original, not the grade.”

### 5.3 Pass architecture (POLICY)

**Hybrid:**

1. **Per layer, pointwise+warp ops** compile into **one** fragment shader (Shaddy/kampos), sampling the **layer source** (and optional mask).
2. **Ping-pong** only when (a) a **neighborhood** op is in the stack, or (b) **compositing** truly requires reading a previous-pass or accumulator texture.
3. Tier A can ship **without blur** → **one fullscreen quad**, photo → grade → drawing buffer (or one FBO for export). Do **not** start from EffectComposer or a 10-pass rack.

Per-layer math is **not** a hardcoded `u_L0_*` bank. It is: `layer.ops[i].id` → registry function + `layer.ops[i].params` → uniforms (or inlined constants at compile). Recompile when **op identity/order** changes; uniform-update when **values** change.

### 5.4 How many layers?

| | Schema | Runtime validator | Tier A **ship** |
|--|--------|-------------------|-----------------|
| **Locked** | `layers: Layer[]` (kept open in the type) | allow later cap, but do not treat it as a v1 decision gate | **1** live photo layer |

Do not lock “5–10 layers.” Recipe **allows** a stack; v1 **ships one live image layer**. A second layer (overlay/decal) is **later**, not destiny. Text-as-GPU-layer is **layout stub**, not an organ of the grade.

**Ping-pong memory (order of magnitude, not a benchmark):** RGBA8 1920×1080 × 2 ≈ 16 MB. HALF_FLOAT ×2. FILTR moved to HALF_FLOAT for banding. **Not measured** on our hardware.

---

## 6. Op / parameter catalog (closed registry)

**POLICY:** the engine exposes a **closed op registry**. Recipe lists `op` ids from this set. Not infinite Photoshop; not generated GLSL from the LLM.

**Eval hook (`00` RQ2):** ≤12 shader ops / ≤20 patch fields as a *coverage* RQ — not a hard product ceiling. This table is the **closed v1 registry plan**; the Tier A ship set stays intentionally minimal.

Legend: **A** = Tier A ship · **L** = later · **X** = won’t-chase v1

### 6.1 Color / tone

| Op id | Uniform axes (typical) | Notes | Tier |
|-------|------------------------|-------|------|
| `exposure` | `ev` | `c * 2^ev` display-referred | A |
| `contrast` | `amount`, `pivot` | Mix toward gray/pivot | A |
| `saturation` | `amount` | Lerp to Rec.709 luma | A |
| `temperature` | `kelvinish` −1..1 | Cheap white-balance mix (not spectral) | A |
| `channelMix` | `mat3` | Linear \(M\mathbf{c}\); bleed is a special case | L |
| `cdl` | `slope[3]`, `offset[3]`, `power[3]` | ASC CDL; prefer over vague LGG | L |
| `curve` | 1D LUT tex or 4–8 knots | Per-channel or luma | L |
| `lut3d` | `sampler3D`, `intensity` | Global color only; 17³–32³; trilinear OK | L |
| `duotone` | `cA`, `cB`, `blend` | Luma → mix; `00`/legacy KEEP | A |
| `posterize` | `steps` | Quantize | L or CUT |
| `fade` | `black`, `white` | Lift blacks / compress whites | A |

**X:** spectral film model (VSCO Film X lab), printer lights, full OCIO.

### 6.2 Space / warp

| Op id | Axes | Notes | Tier |
|-------|------|-------|------|
| `contain` | (derived from resolutions) | Letterbox; not a “look” | A builtin |
| `cropScale` | `scale`, `offset` | UV scale/translate | A simple |
| `twirl` | `amount`, `center`, `radius` | Rotational warp + radial mask | L |
| `ripple` / `melt` | `amount`, `freq`, `time` | UV offset; **not** blur | L (legacy KEEP as optional) |
| `lensDist` | `k1`… | Barrel/pincushion | L |
| `blur` | `radius` | **Neighborhood** → ping-pong | L |

**X:** content-aware scale, 3D camera, fluid sim as core (`00` FLUID = art toy).

### 6.3 Texture (spatial — cannot bake to 3D LUT)

| Op id | Axes | Notes | Tier |
|-------|------|-------|------|
| `grain` | `amount`, `size`, `seed` | Hash or blue-noise; animated optional | A |
| `vignette` | `amount`, `roundness` | Radial multiply | A |
| `halftone` | `amount`, `scale` | Screen-space dots vs luma | L |
| `scanline` | `amount` | Horizontal sine | L or CUT |
| `sharpen` | `amount` | Unsharp = neighborhood | L |

**X:** denoise ML, frequency separation, beauty skin.

### 6.4 Layer (composite, not “look math”)

| Axis | Notes | Tier |
|------|-------|------|
| `opacity` | 0–1 after blend | A (even if N=1, schema has it) |
| `blend` | enum, §5.1 | A: over + 3 modes |
| `transform` | 2D translate/scale (UV) | A simple |
| `maskRef` | texture id + channel | B stub |

### 6.5 Time (optional; still **image** source)

| Axis | Notes | Tier |
|------|-------|------|
| `u_time` | Seconds; drives grain seed, melt, duotone LFO | A **off** by default |
| `timeScale` | Per-layer | L |
| `loop` | Hero seamless loop | L; not VJ (`00` G) |

Hero may animate **uniforms** on a still texture. **X:** audio-reactive, video decode as v1 product.

### 6.6 Layout / type (organ stub)

Crop-to-ratio, type overlay, poster template: **not** GPU grade. CPU/DOM later. **X:** Canva Autofill, brand-kit jobs.

### 6.7 Suggested Tier A **ship** set (few)

`contain` (builtin), `exposure`, `contrast`, `saturation`, `temperature`, `fade` or `duotone`, `grain`, `vignette`, layer `opacity`/`blend`. Packs are **preset values** of this set, not new ops. Blur, LUT3D, CDL, halftone, sharpen, and richer warps stay later.

---

## 7. Recipe contract (shape, not TypeScript)

Source of truth. Talk + sliders emit **patches** against this.

```text
Recipe {
  packVersion: string          // engine + pack id + schema rev
  packId: string | null
  image: { width, height }     // native; pixels are NOT in the JSON
  layers: Layer[]              // length 1 in Tier A ship; type still a list
}

Layer {
  id: string
  source: "image" | "fill"     // fill later
  opacity: number              // 0..1
  blend: BlendId               // closed enum
  transform: { x, y, scale }   // UV space
  ops: Op[]                    // ordered
  maskId?: string              // Tier B
}

Op {
  id: OpId                     // registry key
  params: Record<string, number | number[] | string>
}

Patch {
  // patch transport format remains OPEN (JSON Merge Patch or explicit path ops)
  // MUST validate against registry + numeric ranges
}
```

**Validation:** unknown `op.id` → reject; out-of-range → reject loudly / fail closed; `packVersion` mismatch → refuse silent look-drift. Round-trip: `JSON.parse(JSON.stringify(r))` equals `r` (no NaN, no `undefined`). URL/hash: LZ-compressed JSON in hash like Shaddy; VideoFlow JSON is resolution-agnostic; Lumen presets. **POLICY:** hash shares **recipe**, not a catalog id (`main` `?preset=` is weaker).

Images stay **out of** the recipe (FILTR: presets store names, not blobs). Optional later: content-addressed asset sidecar. **X:** embedding base64 photos in the share URL.

---

## 8. GPU data path (WebGL2)

**D1 (`00`):** raw **WebGL2** first. **2026 note:** WebGPU is in Chrome/Firefox/Safari 26+ ([gpuweb wiki](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)), but this v1 is a **2D fullscreen grade**, GLSL ecosystem (Lumen/FILTR/kampos) is WebGL2, and older iOS still matters. WebGPU = later port of the **same** op graph, not a v1 requirement. Compute shaders are unused until we want them.

### 8.1 What the GPU needs

| Piece | Role |
|-------|------|
| **Vertex** | Fullscreen quad (clip-space `(-1,-1)…(1,1)`), UV `0–1`. No 3D camera. |
| **Fragment** | Per-pixel: warp UV → sample → ops → blend. |
| **Uniforms** | Op params, resolutions, `u_time`, blend enum. |
| **Textures** | Photo (`sampler2D`); later mask, 1D curve, `sampler3D` LUT. |
| **FBO** | Export RT; ping-pong if neighborhood/composite. |

No Three.js **as destiny**. Shaddy’s raw WebGL2 quad is the smaller organ, and raw WebGL2 is the renderer core. R3F on `main` is a **port candidate**, not the architecture.

### 8.2 Upload vs bind vs draw

| When | CPU → GPU |
|------|-----------|
| Photo change | `texImage2D` (once); maybe downsample if \(>\) max |
| LUT/curve/pack change | Upload small textures |
| Op **graph** change | Recompile/link program (Shaddy cost); keep a cache keyed by op-id list |
| Op **value** change | `uniform*` only |
| Resize preview | Recreate drawing buffer / viewport; **not** re-upload photo |
| Export | Bind export FBO size = source (clamped); draw; `readPixels` RGBA; encode PNG on CPU |
| Hero | Draw; never `readPixels` |

Precision: `highp` in fragment is required in WebGL2 (ESSL 3.00); still prefer it explicitly so mobile doesn’t quietly `mediump` grade math ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)). Ping-pong: RGBA8 first; HALF_FLOAT if banding shows (**not measured**).

`MAX_FRAGMENT_UNIFORM_VECTORS` ≥ 224 in WebGL2 — enough for a small op list; if the compiler inlines a huge Shaddy-style graph, watch compile time (Shaddy: DPR throttle + compile recovery). **Not measured.**

### 8.3 Preview vs export parity

Same shaders, same recipe. Difference is **RT size** and **whether we read back**. VideoFlow’s browser/server split is the pattern we want **inside one tab**: preview RT ≠ export RT, identical GLSL.

---

## 9. Sliders + talk (same schema)

Organs, not UI chrome.

| Path | Writes | Must not |
|------|--------|----------|
| **Semantic sliders** | Bounded fields (`grain.amount`, `fade.black`, pack axes) | Invent ops; send pixels |
| **Talk** | Patch JSON `{ packId?, ops?, params? }` | Free-form GLSL; image bytes in prompt |
| **Both** | After merge → **one** validator → recipe | Diverge schemas |

**GPU every frame:** nothing extra for talk. LLM is CPU/network **once per turn**.  
**GPU every frame:** uniform updates from sliders (cheap).  
**CPU once:** shader compile on graph change.

Semantic sliders are **named covers** of registry fields (VSCO Pro Color/Contrast/Tone; `00` D6). Legacy `main` mapped intensity/motion/grit → many uniforms (`mapSemanticSliders.ts`) — **ADAPT** the idea, **DROP** the old field names.

Router context: previous recipe + user sentence → delta (`00` RQ3). Structured output APIs (**EVIDENCE**). Fallback: ignore talk, keep sliders.

---

## 10. Acceptance criteria (how we know the engine is real)

Falsifiable; no demo theater. Numbers from `00` §2 unless **not measured**.

1. **Loop:** upload still → pack or identity recipe → live canvas &lt; **500 ms** to first interactive frame at 1080p (**target**, not measured).
2. **Recipe is truth:** change a slider → JSON field changes → reload JSON → **same** view (human pixel-peep; ΔE **not measured**).
3. **Talk = sliders:** a router patch that sets `grain.amount` equals the slider for that field (validator identity).
4. **Closed set:** unknown op id **rejected**; GPU never compiles LLM prose.
5. **Export parity:** PNG from export FBO matches on-screen grade modulo resolution/DPR (SSIM **not measured**; “looks the same” lab check).
6. **Share:** URL hash deserializes; 100% round-trip of recipe object (`00` metric).
7. **Hero:** same program + recipe; `pointer-events: none`; reduced-motion still.
8. **One engine:** no second shader tree for embed.
9. **Won’t-chase still holds:** “put me on a beach” has **no** op; UI/router refuses generative stories (`00` F).

---

## 11. Non-goals (engine-level)

From VISION + `00` §7, restated as **machine** refusals:

- Second renderer for heroes; Jobs API; campaign packs; brand-kit SaaS.
- Photoshop layer comps, healing, content-aware fill.
- Inpaint / background invent / object removal / beauty retouch.
- Neural shading, photo→shader gradient descent (Shaddy **cut** this; we do too).
- VJ / audio-reactive / sound-visualiser duplication.
- Dumping full CV or Gonzalez into the compositor.
- Claiming fps/ΔE/mask IoU without a measured set.

---

## 12. Decision log

| # | Topic | Proposal | Evidence | Open? |
|---|-------|----------|----------|-------|
| E1 | API | raw **WebGL2** fullscreen quad; WebGPU later | `00` D1; GLSL field; Safari 26 WebGPU exists but unused | Yes — iOS floor |
| E2 | Pass architecture | **Hybrid**: pointwise+warp = one shader; ping-pong only when neighborhood/composite needs previous-pass textures | FILTR ping-pong; Shaddy compile; EffectComposer overkill for A | No |
| E3 | Layer scope | Schema keeps `layers[]`; Tier A **ships 1 live image layer** | Layer count is RQ, not a number from `main` L0–T3 | No |
| E4 | Alpha | Premultiplied working buffers; Porter-Duff over | Porter & Duff 1984; WebGL default | No |
| E5 | Canvas | **View**, not organ; export from FBO | webgl2fundamentals sizes | No |
| E6 | Registry | Closed ops §6; Tier A ship set is minimal; packs = values | `00` D2, RQ2 | No |
| E7 | Grade space | Display-referred v1; CDL/linear later | Instagram-grade `00` A; ASC on linear | Yes |
| E8 | Time | `u_time` off unless op asks; dirty-flag loop | Lumen/FILTR | No |
| E9 | Share | Hash = recipe JSON, no image bytes | Shaddy; FILTR refs-only | No |
| E10 | LLM | Patch only, same schema as sliders | VISION; `00` D3 | Model choice |
| E11 | three.js | Not required; renderer core is raw WebGL2 | Shaddy/kampos raw GL | No |
| E12 | Masks | Texture weights, Tier B | FILTR; `00` D5 | Yes |
| E13 | Recipe scope | v1 recipe is **per-layer ops only**; no document-level global ops yet | Simpler validator and compile model for Tier A | No |
| E14 | Preview/export resolution | Preview at display/device-pixel size; export at source/native resolution | webgl2fundamentals sizes; FBO export path | No |
| E15 | Blend modes | Tier A = `normal`, `multiply`, `screen`, `overlay` | W3C + GLSL blend implementations | No |
| E16 | EXIF | Normalize orientation on import | Consistent texture upload and export parity | No |
| E17 | Invalid patch policy | Reject invalid patches loudly / fail closed | Closed registry; avoid silent look drift | No |

**Operator — remaining OPEN only:**

- [ ] **iOS/WebGL2 floor** to support before declaring v1 device compatibility
- [ ] **Grade space follow-up** beyond display-referred v1 (if/when CDL or linear workflow graduates)
- [ ] **Patch transport** (`JSON Merge Patch` vs explicit path ops)
- [ ] **Masks** timing and exact contract in Tier B

---

## 13. Legacy port list LAST

Pointers into `main` after organs are named — they do not dictate the body.

| Pointer | Verdict | Why |
|---------|---------|-----|
| `fragment.glsl` warp→sample→shade→over; `vertex.glsl` quad | **ADAPT** | Real GLSL; L0/L1/T0–T3 banks are **not** the schema |
| `layerEffects.ts` one bundle × 3 ids | **DROP** as model | Replace with `ops[]` |
| melt / twirl / bleed / duotone / grain / vignette / halftone / scanline / posterize | **KEEP** as optional ops | Spatial vs color split is right; not all in A |
| text slots T0–T3; Jobs API; brand kit; campaign packs | **DROP** | Layout stub / VISION refuse |
| decal as L1 | **ADAPT** | Optional second **layer**, not a special organ |
| `preset/validate.ts` + `presetSchemaVersion` | **KEEP** pattern | New shape; fail-closed |
| `presetShareUrl.ts` catalog-id share | **DROP** | Recipe hash instead |
| `mapSemanticSliders.ts`; `captureCanvasAtSize.ts` | **ADAPT** | Semantic→fields; encode from FBO not R3F `setSize` |
| `EMBED.md` pointer-events + reduced-motion | **KEEP** | Hero rules, not Stage API |
| `MATH.md` | **ADAPT** then rewrite | Tied to old shader; new MATH appendix later |

---

## 14. References

**Papers / standards:** Porter & Duff 1984 [DOI](https://doi.org/10.1145/800031.808606) [PDF](https://keithp.com/~keithp/porterduff/p253-porter.pdf) · [W3C Compositing L1](https://www.w3.org/TR/compositing-1/) · [ITU-R BT.709](https://www.itu.int/rec/R-REC-BT.709) · GPU Gems 2 ch.24 [LUTs](https://developer.nvidia.com/gpugems/gpugems2/part-iii-high-quality-rendering/chapter-24-using-lookup-tables-accelerate-color) · [WebGL spec](https://registry.khronos.org/webgl/specs/latest/1.0/) · 3D LUT encoding [DOI 10.1609/aaai.v39i9.33059](https://doi.org/10.1609/aaai.v39i9.33059) *(via `00`; not v1)*

**Compositors (`00` §4):** [FILTR ping-pong](https://antlii.work/WIP-Tool) · [Lumen dirty-flag](https://legenki.com/lumen/) · [kampos](https://github.com/wix-incubator/kampos) ([Wix](https://www.wix.engineering/post/introducing-kampos-a-tiny-and-fast-effects-compositor)) · [VideoFlow stacks](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow) · [Shaddy](https://devpost.com/software/shaddy) · [EffectComposer](https://threejs.org/manual/en/post-processing.html) · [Utilora WebGPU](https://utilora.app/tools/image-tools/webgpu-filter-studio) *(parity, not v1)*

**Color / canvas:** [Pomfort CDL vs LGG](https://pomfort.com/article/an-in-depth-look-at-asc-cdl-based-color-controls/) · [PassXMP](https://github.com/maxthomason/PassXMP) · [WebGL and Alpha](https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html) · [glsl-blend](https://github.com/jamieowen/glsl-blend/) · [canvas resize](https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html) · [`MAX_TEXTURE_SIZE`](https://webgl2fundamentals.org/webgl/lessons/webgl-cross-platform-issues.html) · [MDN precision](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) · [Khronos #2460](https://github.com/KhronosGroup/WebGL/issues/2460) · [WebGPU status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)

**In-repo:** [`00_FIELD_RESEARCH.md`](00_FIELD_RESEARCH.md) · [`VISION.md`](VISION.md)

---

## Executive summary

- **One engine:** recipe + image in; GPU compositor out; lab canvas, PNG readback, and hero present are **views**, not three machines.
- **Image:** \(H\times W\times C\) tensor → texture; color is a 3-vector (matrices, curves, 3D LUT); spatial ops stay separate; working alpha is premultiplied.
- **Compositor:** raw WebGL2, `layers[]` kept open in schema, Tier A **ships 1 live photo layer** with a minimal closed op list; ping-pong only when a pass must read a **previous result**.
- **Control:** sliders and talk patch the **same** JSON; validate; uniforms every change; compile on graph change; dirty-flag, not a mandatory 60 fps loop.
- **Honest floor:** raw WebGL2 quad, preview at display resolution, export at source resolution, no inpaint, no neural shading, no fake fps/ΔE; WebGPU and masks are later.

---

Operator next: skim §5–6–8–12 and only carry forward the genuinely unresolved OPEN items before constitution or code.
