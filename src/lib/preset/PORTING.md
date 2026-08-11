# Porting the synth preset to another app

The JSON preset is **inputs only**. It does not include shaders, Three.js material code, or runtime wiring. To reproduce the same look in another repository (for example Next.js), copy or reimplement the following from this project:

1. **GLSL** — [`src/webgl/shaders/vertex.glsl`](../../webgl/shaders/vertex.glsl) and [`src/webgl/shaders/fragment.glsl`](../../webgl/shaders/fragment.glsl).

2. **Uniform wiring** — [`src/webgl/materials/SynthMaterial.tsx`](../../webgl/materials/SynthMaterial.tsx): `applyLayerUniforms` / `seedLayerUniforms`, layer prefixes `L0` / `L1` / `T0–T3` (hero texture / overlay / preview text slots), and how `u_resolution`, `u_imageResolution`, textures, and transforms are updated each frame.

3. **Text rasterization** — [`src/utils/textUtils.ts`](../../utils/textUtils.ts) `createTextTexture` (font stack, alignment, canvas size from the same dimensions you use for `u_resolution`). **Skip on production** if you embed backgrounds-only and use HTML for headlines.

4. **Decal pipeline** — [`src/utils/decalTexture.ts`](../../utils/decalTexture.ts) `createProcessedDecalTexture` if you need pixel-identical sticker cropping and alpha handling.

5. **Playback** — Apply `viewport` (drawing buffer vs CSS size / DPR), `imageResolution`, and `baseTimeSeconds` the same way as here so letterboxing, 2D text layout, and `u_*_t` (layer time × `timeScale`) match.

6. **Optional assets** — If the preset omits `assets`, supply hero texture and overlay images from your site CDN; `imageResolution` and transforms still apply once images are loaded.

For the product narrative and embed thesis, see the case study at **`/story`**. For StageRecipe drop-in inside this repo, see [`../stage/EMBED.md`](../stage/EMBED.md) and **`/embed-demo`**.

## Stage recipe embed (Phase 5)

When you already have a **StageRecipe** JSON (lab export or Jobs API):

1. Prefer the in-repo helper: `StageEmbedBackground` + `getEmbedLayerStyle` in `src/lib/stage/embed/`.
2. Keep the canvas at `z-index: 0` with `pointer-events: none`; put HTML above it.
3. Honour `prefers-reduced-motion` (helper freezes `timeScale` / `colorCycleSpeed` when enabled).
4. Outside this React+R3F app, still port GLSL + uniforms per the checklist above — there is no published standalone npm player yet.


On a production site, Background Studio output is a **decorative full-viewport layer** behind your page content. HTML owns navigation, headlines, and CTAs — not `synth.textLayers` from the preset.

### Layout (HTML + CSS)

Vanilla pattern — no framework lock-in:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      /* Full-viewport background canvas — sits behind all page content */
      #bg-canvas-wrap {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none; /* clicks pass through to HTML */
        overflow: hidden;
      }
      #bg-canvas-wrap canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
      .page-content {
        position: relative;
        z-index: 1;
        min-height: 100dvh;
      }
    </style>
  </head>
  <body>
    <div id="bg-canvas-wrap" aria-hidden="true"></div>
    <main class="page-content">
      <h1>Your headline lives in HTML</h1>
      <p>Nav, CTAs, and copy are DOM — not GPU text from the preset.</p>
    </main>
  </body>
</html>
```

Mount your ported WebGL canvas inside `#bg-canvas-wrap`.

### Load sequence

Pseudocode for a background-only embed (omit preview text rasterization):

```ts
// 1. Port shader + SynthMaterial wiring from this repo (see file checklist above).
// 2. Mount WebGL canvas inside #bg-canvas-wrap; size to window (respect preset viewport.dpr).

const preset = await fetch("/synth-preset.json").then((r) => r.json());
validatePresetV2(preset);

// Background-only embed: effects path — no text layer replacement
applyEffectsOnlyFromPreset(preset);
// — or applyStylePreset(preset) if you intentionally want preset preview typography

// 3. Hero texture (if not embedded in preset.assets)
if (preset.assets?.background) {
  await applySynthPreset(preset); // loads embedded base64 images
} else {
  await loadHeroTextureFromUrl("/hero.jpg"); // site CDN; set imageResolution to match
}

// 4. Playback — match Background Studio time uniforms
let baseTimeSeconds = preset.baseTimeSeconds ?? 0;
function frame(now: number) {
  baseTimeSeconds += deltaSeconds;
  updateLayerTimes(baseTimeSeconds); // u_L0_t, u_L1_t, u_T0_t… from layerEffects.*.timeScale
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

### Preview text on production

For **background-only** embeds, ignore `synth.textLayers` or leave text slots empty. Do not call `createTextTexture` unless you deliberately want GPU typography (the lab uses preview text for layout mockups only).

### Viewport and DPR

Honor `preset.viewport` (`drawBufferWidth`, `drawBufferHeight`, `cssWidth`, `cssHeight`, `dpr`) and `preset.imageResolution` so letterboxing and uniform resolution match Background Studio exports.

### Reduced motion

Document-only pattern — no built-in embed helper in this repo:

```ts
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduceMotion) {
  // Option A: show a static PNG poster exported from Background Studio
  // Option B: zero all layerEffects.*.timeScale or stop advancing baseTimeSeconds
}
```

Export a PNG poster from Background Studio (**Export → PNG poster**) for Option A.

## Preset apply modes

Four explicit apply paths live in [`apply.ts`](apply.ts) and [`hydrate.ts`](hydrate.ts):

| Mode | Function | Touches uploads? | Touches text layers? | Use case |
|------|----------|------------------|----------------------|----------|
| **Full** | `applySynthPreset` | Yes, if preset has `assets` | Yes | Background Studio JSON import (with embedded images) |
| **Style** | `applyStylePreset` | **Never** | Yes | Landing hero, full look when "Keep preview text" is off |
| **Effects** | `applyEffectsOnlyFromPreset` | **Never** | **No** | Background looks, mood, URL preset when "Keep preview text" is on |
| **Patch** | `applyPresetPatch` | **Never** | Only if patch includes `synth.textLayers` | Partial tweaks, mood nudges, AI output (Phase 5/8) |

- **Full** — `applySynthFieldsFromV2` then `loadPresetAssets`. When embedded images are present, clears and replaces `imageTexture` / `decalTexture`.
- **Style** — `applySynthFieldsFromV2` only. Ignores `assets` even if present. User uploads stay intact. Replaces text layers.
- **Effects** — `applyEffectsFieldsFromV2` only (layer effects, decal placement scalars, link flags, `textLayerEffects`). Never touches `textLayers`, `selectedTextLayerId`, or textures.
- **Patch** — shallow merge into current store state (`layerEffects`, synth scalars, optional `textLayers` full replace, per-id `textLayerEffects` merge). Never touches textures.

**Phase 5 composition** (style baseline + patch nudge):

```ts
applyStylePreset(basePresetFromCatalog);
applyPresetPatch({ layerEffects: { background: { meltIntensity: 0.5 } } });
```

Apply style first, then patch. Both preserve uploads.

**Landing mood** — `applyMoodFromText` on `/` runs style + patch from keyword mapping or optional AI (`{ basePresetId, patch? }` → validate → same apply modes); never reloads the hero texture.

**AI mood (Phase 8)** — When enabled, a serverless `/api/mood` route asks an LLM for `{ basePresetId, patch? }`. The response is validated (`parseAiMoodResponse`, `validatePresetPatch`) then applied with **`applyStylePreset`** + **`applyPresetPatch`** — identical to keyword mood composition. AI never outputs images or full preset files; keyword mapper remains the fallback. For ambient site-background requests, AI prefers **featured** catalog presets unless the mood explicitly asks for glitch, neon, or punk aesthetics.

**Note:** Background looks catalog presets are style-only (no embedded `assets`). Background Studio JSON import may be full (`applySynthPreset`) when the export includes embedded hero/overlay images.
