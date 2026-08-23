# M04 — Export (PNG + recipe + share + hero-lite)

**Status:** research card  
**Date:** 2026-08-23  
**Depends on:** `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`, `02_CONSTITUTION.md`, `M00_COMPOSITOR.md`, `M01_RECIPE_SCHEMA.md`, `M02_PACKS_AND_SLIDERS.md`, `I0_CHANGELOG.md`, `I1_CHANGELOG.md`  
**Purpose:** Lock how Prism **leaves the tab**: truthful PNG snapshot, recipe JSON download, URL-hash share (recipe only), and a **hero-lite** reuse path — same GLSL, different RT size. Closes the Tier A loop after I1 packs/grade. No LLM (M03), no second renderer, no campaign/ZIP product.

---

## 0. Question

How should Prism export and reproduce a look so that:

1. PNG readback matches the live grade (modulo resolution/DPR), from the **same** compositor shaders,
2. recipe JSON downloads as editable/replayable truth (no image bytes),
3. URL hash hydrates instructions without smuggling photos — with honest UX when assets are missing,
4. a minimal hero path can mount the same engine with `{type:"url"}` textures,
5. grain/time stays deterministic for PNG (closes I1 OPEN),
6. out-of-lane formats (WebM, server farms, campaign ZIPs) stay refused?

Constitutional locks: recipe is truth; PNG is a **snapshot**; hash = recipe only; one engine; fail closed on missing assets; preview display-sized / export source-sized (`01` E14; `02` §7.6–7.8).

---

## 1. Why export now (MVP completeness)

I0–I1 already give upload → composite → packs → sliders → grade on canvas. Without PNG + recipe leaving the tab, RQ5 (`00` §5) and Tier A ship signal (`00` §6, `02` §5.1) cannot be proven: “serializable recipes” stay a claim, not a loop.

**Why M04 before M03:** talk is the same PathPatch pipe as sliders (M01 R9; M02 P6). Export is the missing **artifact** door. LLM prompts do not unblock portfolio use; PNG + JSON do. Sequence: **looks visible → artifacts out → talk later**.

---

## 2. Research map

| Source | Lesson for Prism |
|--------|------------------|
| **WebGL Fundamentals / spec** | Default `preserveDrawingBuffer: false`; drawing-buffer read after present is undefined. Prefer **FBO render → `readPixels`** in the same export call ([render-to-texture](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html); [WebGL α / clear](https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html); `01` §2.4) |
| **VideoFlow** | Same GLSL stack; **preview vs export RT size** differ; recipe is resolution-agnostic ([stacking blog](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)) |
| **Shaddy** | LZ-compressed **recipe JSON in URL hash**; no backend ([Devpost](https://devpost.com/software/shaddy)). Practical hash budgets ~2k–tens of k chars — size the recipe, never photos |
| **FILTR / Lumen** | Presets = stack + **media refs**; reconnect media on reload ([FILTR](https://antlii.work/WIP-Tool); [Lumen](https://legenki.com/lumen/)) |
| **Canvas 2D encode** | `readPixels` → `ImageData` / 2D canvas → `toBlob("image/png")` is the honest encode path; canvas `toBlob` alone only equals display buffer if you wrongly PNG the CSS canvas |
| **CORS / tainted** | Cross-origin `{type:"url"}` without CORS → tainted / blocked `readPixels` & `toBlob` ([WebGL2 CORS](https://webgl2fundamentals.org/webgl/lessons/webgl-cors-permission.html); M01 F6) |
| **`prefers-reduced-motion`** | Hero must freeze time/still under reduce ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion); `01` hero stub) |
| **In-repo I0/I1** | Preview already uses FBO pair at **display** size (`renderer.ts`); `preserveDrawingBuffer: false` (`gl.ts`); grain = **UV hash, no `u_time`** (I1 OPEN → lock here); blends approximate (PNG matches **preview**, not Photoshop) |

---

## 3. PNG pipeline (RT size, readback, text scale, grain seed)

### Method (locked)

```text
resolve assets (fail closed if main missing)
  → choose export RT = main native W×H, clamped to MAX_TEXTURE_SIZE
  → (re)rasterize text at export scale
  → bind export FBO(s); same draw path as preview (same programs/uniforms)
  → gl.readPixels(RGBA, UNSIGNED_BYTE) from export FBO
  → flip Y if needed (GL origin bottom-left)
  → Canvas2D putImageData → canvas.toBlob("image/png")
  → trigger download
```

**Not chosen:** `preserveDrawingBuffer: true` + `canvas.toBlob` on the lab view (ties export to CSS/DPR; violates E14).  
**Not chosen:** second CPU/Canvas2D grade path for “high-res PNG.”

### RT / DPR policy (`01` E14)

| Surface | Size |
|---------|------|
| **Lab preview** | Drawing buffer ≈ CSS box × DPR (current `Compositor.resize`) |
| **PNG export** | **Main image native** \(W\times H\), clamped to `MAX_TEXTURE_SIZE`; optional later: user integer scale 1×/2× |
| **Hero** | Display-sized; GPU present only; **no** readback required |

Parity claim: **same recipe + same shaders**; difference is RT size (and text raster scale). Human “looks the same” is Tier A check; ΔE/SSIM **not measured**.

### Text raster scale (M00 C9 / M01 F7)

`TextSource.fontSize` is CSS-px intent. On export:

\[
\text{exportFontPx} = \text{fontSize} \times \frac{\text{exportRT height (or width)}}{\text{previewRT height (or width)}}
\]

Prefer **height ratio** of export RT vs current preview drawing-buffer (or vs `recipe.canvas` hint if present). Re-rasterize text texture for the export pass only; do not permanently mutate recipe typography fields.

### Grain / time (closes I1 OPEN)

| Decision | Choice |
|----------|--------|
| **Export grain** | Deterministic: UV-space hash (current I1) **or** `grain.params.seed` (number) folded into hash if present |
| **`u_time`** | Off for PNG; if a later time op exists, freeze to `0` (or recipe `freezeTime`) for export |
| **Preview** | Keep dirty-flag / still path; no mandatory 60 fps grain animation in Tier A |

Recommend: add optional `seed` on `grain` in registry (default `0`); document that PNG grain matches preview when seed + UV hash match. Do **not** introduce animated grain for export.

### Honesty: blends

I0 approximate non-`normal` blends remain: **PNG matches what the lab showed**, not Adobe blend math. Document in UI copy (“approximate blend”) rather than inventing a Photoshop export farm.

### Fail closed

- Missing **main** `AssetRef` → **no PNG**; loud error (same class as compositor `MISSING_ASSET`).
- Missing overlay/text asset when object is `visible` → fail closed (no fake composite).
- CORS-tainted `{url}` → fail closed with explicit message; do not download a partial/clear PNG.

---

## 4. Recipe download + optional sidecar

| Artifact | Shape | Notes |
|----------|-------|--------|
| **Recipe file** | `prism-recipe.json` (or `meta.title`-derived) | Full validated `Recipe` document (M01); **no** blobs, **no** base64 |
| **PNG file** | `prism-export.png` | Snapshot only; not editable truth |
| **Optional sidecar** | Same recipe JSON downloaded **alongside** PNG (two files / two `<a download>`) | Not a ZIP product; not Meta campaign pack |

**POLICY:** PNG does not get written back into the recipe. Sidecar is convenience for “pixels + instructions,” not a third truth model.

Optional later (won’t-chase Tier A): `.prism.zip` with `{recipe.json, export.png}` — refuse as product surface now.

---

## 5. URL hash share + missing-asset UX

### Hash contract (M01 R12)

```text
#r=<lz|deflate + base64url(recipe JSON)>
```

- Contents: **recipe only** (versions, `objects[]`, AssetRefs as ids/urls, text, effects).
- Never: photo bytes, IndexedDB dumps, PNG data-URLs.
- On hydrate: `decode → validateRecipe → replace document` (M01 full-replace path).
- Over budget / corrupt → loud fail; keep prior recipe.

**Budget:** warn or refuse if encoded hash exceeds a practical ceiling (start ~8–16 KiB encoded; tune after measuring Tier A recipes). Shaddy-class compression; solo-dev FEASIBLE with `fflate` / `lz-string`.

### Missing-asset UX (falsifier of “share = done”)

| State | Behavior |
|-------|----------|
| Hash valid, main `assetId` unresolved | Show recipe meta + pack id; canvas blocked; **Re-upload main** prompt keyed by expected role (and optional `meta` filename hint if ever stored) |
| Overlay/text missing | Same pattern per missing ref |
| `{type:"url"}` in shared recipe | Attempt fetch; CORS/404 → loud fail |

FILTR reconnect pattern: instructions travel; media reconnects locally. Hash alone never pretends the photo arrived.

---

## 6. Hero-lite (same renderer; url AssetRefs)

**Hero is a use, not a site-builder** (`VISION`; `02` §2.6, §11.7).

### Minimum path

1. Demo route **or** small embed helper (`mountPrismHero(el, { recipe, … })`).
2. Recipe with main (and optional overlay) as `{ type: "url", url }` pointing at **same-origin or CORS-clean** bundled textures.
3. Same `Compositor` programs; drawing buffer ≈ host CSS box; **no** export/readback in default hero.
4. CSS: `pointer-events: none`; canvas behind content.
5. `matchMedia("(prefers-reduced-motion: reduce)")` → freeze `u_time` / single still frame (I1 already still; keep the rule for future time ops).

### Lab IndexedDB vs hero URLs

| Mode | Assets |
|------|--------|
| **Lab** | `{type:"id"}` → IndexedDB Blobs |
| **Hero deploy** | `{type:"url"}` → bundled/static files |

Do not require IDB bootstrap on third-party pages. Do not ship a CMS, template marketplace, or layout builder.

---

## 7. Lab UX stub

Minimal proving chrome for I2 (not a design system):

- **Download PNG** — disabled until main resolves; spinner/busy during FBO readback.
- **Download recipe JSON** — always when recipe validates.
- **Copy share link** — writes `#r=…` to clipboard; toast if over size budget.
- **Optional “PNG + recipe”** — triggers both downloads.
- On hash load at boot: hydrate or show decode/validate error.
- Keep existing error banner for `MISSING_ASSET` / CORS / validate failures.
- One-line honesty: “PNG matches lab preview (blends are approximate).”

No portfolio site chrome, no publish-to-social, no ZIP wizard.

---

## 8. Open questions / falsifiers

| # | Falsifier | Meaning |
|---|-----------|---------|
| F1 | PNG looks like a different grade than lab at same pack/sliders | Export path diverged (wrong RT, wrong uniforms, or second renderer) |
| F2 | PNG is CSS/DPR-sized soft upsample of preview | Violated source-RT policy (E14) |
| F3 | Export succeeds with main asset missing | Fail-closed breach |
| F4 | Hash round-trips recipe but UI claims “ready” with blank canvas | Missing-asset UX failure (M01 F1) |
| F5 | Text soft/wrong size on PNG vs preview | Export text scale policy wrong (M01 F7) |
| F6 | Grain flickers between preview and PNG | Seed/`u_time` not frozen |
| F7 | Cross-origin hero `{url}` taints and export/readback throws silently | CORS contract ignored (M01 F6) |
| F8 | Users only ever take PNG; recipe never reloaded | Weakens RQ5 — still ship recipe; measure later |

Open (non-blocking): exact hash compressor library; integer export scale UI; whether sidecar filenames share a stem.

---

## 9. Won’t chase

- WebM / video export / audio-reactive
- Server raster farm / headless Chromium encode service
- Campaign ZIP packs, Meta publish, Canva Autofill, Jobs API
- Generative export / inpaint / beauty retouch
- Base64 photos in hash or recipe
- Second shader tree for “print quality”
- Site-builder hero product; layout/poster system as export requirement
- M03 LLM prompts / mood router (explicitly later)
- Reopening M00 hybrid architecture, M01 PathPatch/storage, M02 pack catalog

---

## 10. Decision log

| # | Topic | Decision | Why |
|---|-------|----------|-----|
| X1 | PNG method | Export FBO at source/native RT → `readPixels` → 2D `toBlob` PNG | `01` E5/E14; WebGL Fundamentals; avoid preserveDrawingBuffer design |
| X2 | Shader parity | Same GLSL/programs as preview; RT size differs | Constitution one-engine; VideoFlow pattern |
| X3 | Recipe download | Validated JSON file; no image bytes | M01 three artifacts; recipe is truth |
| X4 | Sidecar | Optional second download of same JSON with PNG; no ZIP product | Convenience without campaign-pack shape |
| X5 | Hash | LZ/deflate + base64url of recipe only; size-budgeted | Shaddy + `01` E9; FILTR refs honesty |
| X6 | Missing assets | Loud block + re-upload; never fake PNG | `02` fail closed; M01 R14 |
| X7 | Grain | Deterministic UV hash; optional `seed`; freeze time on export | Closes I1 OPEN; PNG ≡ preview |
| X8 | Text export | Re-rasterize at RT scale ratio | M00 C9; avoid soft type |
| X9 | Hero-lite | Demo route or embed helper; `{url}` assets; `pointer-events: none`; reduced-motion still | VISION reuse, not site-builder |
| X10 | Blend honesty | PNG = lab approximate blends | I0/I1 limit; don’t claim Photoshop |
| X11 | Sequencing | M04 before M03 | Artifacts complete Tier A door; talk reuses PathPatch |
| X12 | Out | No WebM, server farm, campaign ZIP, generative | Constitution hard boundaries |

---

## 11. References

- WebGL Fundamentals — [render to texture](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html), [alpha](https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html), [resize](https://webgl2fundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html)  
- WebGL2 — [framebuffers](https://webgl2fundamentals.org/webgl/lessons/webgl-framebuffers.html), [CORS images](https://webgl2fundamentals.org/webgl/lessons/webgl-cors-permission.html)  
- VideoFlow — resolution-agnostic stacks / same shaders — [blog](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)  
- Shaddy — LZ recipe in URL hash — [Devpost](https://devpost.com/software/shaddy)  
- FILTR / Lumen — preset vs media reconnect — [FILTR](https://antlii.work/WIP-Tool), [Lumen](https://legenki.com/lumen/)  
- MDN — [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion), [CORS-enabled images](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image)  
- In-repo: `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`, `02_CONSTITUTION.md`, `M00`–`M02`, `I0_CHANGELOG.md`, `I1_CHANGELOG.md`, `src/compositor/renderer.ts`, `gl.ts`, `textRaster.ts`, `textured.frag.glsl`

---

## Operator summary

- **PNG method + RT policy:** Same GLSL → **export FBO at main native resolution** (clamped) → `readPixels` → Canvas2D `toBlob` PNG; preview stays display/DPR-sized; never PNG the CSS canvas via `preserveDrawingBuffer`.
- **Recipe download shape:** Validated `Recipe` JSON file (no bytes); optional sidecar = same JSON downloaded next to PNG (two files, not a ZIP product).
- **Hash/share story:** `#r=` LZ/deflate recipe only; hydrate → validate → replace; missing assets → blocked canvas + re-upload UX (FILTR reconnect).
- **Hero-lite minimum:** Demo route or embed helper; bundled `{type:"url"}` textures; same compositor; `pointer-events: none`; `prefers-reduced-motion` freezes still.
- **I2 implement order:** (1) `exportPng(recipe, assets)` FBO path + text scale + grain freeze, (2) recipe JSON download + optional dual download, (3) hash encode/decode + boot hydrate + missing-asset UX, (4) hero-lite demo route with url AssetRefs.

## Next implement pointer (I2)

**I2 plan:** `src/export/png.ts` (FBO-at-source readback) + `recipeDownload.ts` + `shareHash.ts` → Lab buttons (PNG / JSON / copy link) → fail-closed missing-main tests → `/hero` (or embed helper) with bundled `{url}` sample + reduced-motion still. M03 talk stays blocked until export round-trip is manual-checkable.
