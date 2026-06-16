# Porting the synth preset to another app

The JSON preset is **inputs only**. It does not include shaders, Three.js material code, or runtime wiring. To reproduce the same look in another repository (for example Next.js), copy or reimplement the following from this project:

1. **GLSL** — [`src/webgl/shaders/vertex.glsl`](../../webgl/shaders/vertex.glsl) and [`src/webgl/shaders/fragment.glsl`](../../webgl/shaders/fragment.glsl).

2. **Uniform wiring** — [`src/webgl/materials/SynthMaterial.tsx`](../../webgl/materials/SynthMaterial.tsx): `applyLayerUniforms` / `seedLayerUniforms`, layer prefixes `L0` / `L1` / `L2` (background / decal / text), and how `u_resolution`, `u_imageResolution`, textures, and transforms are updated each frame.

3. **Text rasterization** — [`src/utils/textUtils.ts`](../../utils/textUtils.ts) `createTextTexture` (font stack, alignment, canvas size from the same dimensions you use for `u_resolution`).

4. **Decal pipeline** — [`src/utils/decalTexture.ts`](../../utils/decalTexture.ts) `createProcessedDecalTexture` if you need pixel-identical sticker cropping and alpha handling.

5. **Playback** — Apply `viewport` (drawing buffer vs CSS size / DPR), `imageResolution`, and `baseTimeSeconds` the same way as here so letterboxing, 2D text layout, and `u_*_t` (layer time × `timeScale`) match.

6. **Optional assets** — If the preset omits `assets`, upload background and decal images in the UI; `imageResolution` and transforms still apply once images are loaded.

## Preset apply modes

Three explicit apply paths live in [`apply.ts`](apply.ts) and [`hydrate.ts`](hydrate.ts):

| Mode | Function | Touches uploads? | Touches text layers? | Use case |
|------|----------|------------------|----------------------|----------|
| **Full** | `applySynthPreset` | Yes, if preset has `assets` | Yes | Stack JSON import (with embedded images) |
| **Style** | `applyStylePreset` | **Never** | Yes | Landing hero, full look when "Keep my text" is off |
| **Effects** | `applyEffectsOnlyFromPreset` | **Never** | **No** | Ideas, mood, URL preset when "Keep my text" is on |
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

**AI mood (Phase 8)** — When enabled, a serverless `/api/mood` route asks an LLM for `{ basePresetId, patch? }`. The response is validated (`parseAiMoodResponse`, `validatePresetPatch`) then applied with **`applyStylePreset`** + **`applyPresetPatch`** — identical to keyword mood composition. AI never outputs images or full preset files; keyword mapper remains the fallback.

**Note:** Ideas catalog presets are style-only. Stack import may be full (`applySynthPreset`).
