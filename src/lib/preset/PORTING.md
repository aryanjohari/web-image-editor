# Porting the synth preset to another app

The JSON preset is **inputs only**. It does not include shaders, Three.js material code, or runtime wiring. To reproduce the same look in another repository (for example Next.js), copy or reimplement the following from this project:

1. **GLSL** — [`src/webgl/shaders/vertex.glsl`](../../webgl/shaders/vertex.glsl) and [`src/webgl/shaders/fragment.glsl`](../../webgl/shaders/fragment.glsl).

2. **Uniform wiring** — [`src/webgl/materials/SynthMaterial.tsx`](../../webgl/materials/SynthMaterial.tsx): `applyLayerUniforms` / `seedLayerUniforms`, layer prefixes `L0` / `L1` / `L2` (background / decal / text), and how `u_resolution`, `u_imageResolution`, textures, and transforms are updated each frame.

3. **Text rasterization** — [`src/utils/textUtils.ts`](../../utils/textUtils.ts) `createTextTexture` (font stack, alignment, canvas size from the same dimensions you use for `u_resolution`).

4. **Decal pipeline** — [`src/utils/decalTexture.ts`](../../utils/decalTexture.ts) `createProcessedDecalTexture` if you need pixel-identical sticker cropping and alpha handling.

5. **Playback** — Apply `viewport` (drawing buffer vs CSS size / DPR), `imageResolution`, and `baseTimeSeconds` the same way as here so letterboxing, 2D text layout, and `u_*_t` (layer time × `timeScale`) match.

6. **Optional assets** — If the preset omits `assets`, upload background and decal images in the UI; `imageResolution` and transforms still apply once images are loaded.
