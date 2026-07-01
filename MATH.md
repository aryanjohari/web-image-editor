# GPU math in Background Studio

*The Algorithm Engine* — technical reference for the live background shader. Teaching notes tied to the **actual** shader and store code in this repo—not generic WebGL theory. Primary sources: [`src/webgl/shaders/fragment.glsl`](src/webgl/shaders/fragment.glsl), [`src/store/layerEffects.ts`](src/store/layerEffects.ts), [`src/webgl/materials/SynthMaterial.tsx`](src/webgl/materials/SynthMaterial.tsx).

---

## 1. Pipeline overview

Each frame, `main()` in `fragment.glsl` runs **once per pixel** on a full-screen quad. For every visible pixel the path is:

**warp → sample → shade → composite**

```text
baseUV (letterboxed contain)
  → layerWarp (melt + twirl, radial mask)     ← space
  → texture2D (background / decal / text slot)  ← sample
  → layerShade (bleed, posterize, duotone, …) ← color
  → mix (alpha-over stack)                      ← composite
```

Layer order in `main()`:

1. **L0** — background (`u_texture`)
2. **L1** — decal (`u_decalTexture`), alpha-over or optional luma-multiply mask
3. **T0–T3** — text slots bottom-to-top (`shadeTextSlot` wraps warp + sample + shade)

Helper chain: `layerWarp` calls `spaceDistortionFor` then `applyTwirl`. `layerShade` calls `colorMutationFor`, `applyDuotoneFor`, `applyHalftoneFor`, `applyScanlinesFor`, `proceduralNoiseFor`.

Uniforms are seeded and updated each frame in `SynthMaterial.tsx` (`applyLayerUniforms` / `useFrame`).

---

## 2. Pixel vs sample vs uniform

| Term | Meaning here |
|------|----------------|
| **Pixel** | One fragment shader invocation → one output color (`gl_FragColor`) on the canvas. |
| **Sample** | A `texture2D(sampler, uv)` lookup. UVs may be warped (`layerWarp`) before sampling. `v_uv` is quad space (0–1); warped UVs index into image/text atlases. |
| **Uniform** | GPU-global constants for the draw call: textures, resolution, per-layer knobs (`u_L0_melt`, …). Sliders write Zustand → `useFrame` copies into the material each frame. |

**Contain math:** `main()` maps canvas coordinates to `baseUV` so the background behaves like CSS `object-fit: contain` (letterbox black outside the image).

---

## 3. Formula glossary

Each **Background Studio** knob (UI label; Phase D may rename layer tabs) maps to a function in `fragment.glsl`. Store field names live in `LayerEffectParams` (`layerEffects.ts`).

| UI / store field | Shader function | Math (short) |
|------------------|-----------------|--------------|
| `colorBleed` | `colorMutationFor` | Off-diagonal `mat3` mixes RGB channels: `col = bleedMat * col` |
| `posterizeSteps` | `colorMutationFor` | `floor(col * steps) / steps` |
| `meltIntensity` | `spaceDistortionFor` | Sin/cos ripple on UV: `uv + offset` (animated by `tAnim`) |
| `twirlIntensity`, mask | `applyTwirl`, `layerWarp` | `mat2` rotation around center; `smoothstep` radial mask blends warp in |
| `duotoneBlend`, `colorA/B`, `colorCycleSpeed` | `applyDuotoneFor` | Luminance → `mix(cA, cB, t)`; LFO via `sin(tAnim * cycleSpeed)`; blend with original |
| `halftoneIntensity` | `applyHalftoneFor` | Dot grid from `sin(uv * resolution)` vs luma; `mix` with source |
| `scanlineIntensity` | `applyScanlinesFor` | Horizontal sine darkening: `mix(color, color * lines, intensity)` |
| `noiseLevel` | `proceduralNoiseFor` | Hash noise on screen UV + time; added in `layerShade` |
| Decal / text over background | `main()` | Standard: `mix(bgRgb, decalPixel.rgb, decalPixel.a)`; text slots: `mix(outRgb, tp.rgb, tp.a)` |

**Time:** `u_L0_t`, `u_L1_t`, `u_T0_t`, … = `baseTime * timeScale` per layer (see `SynthMaterial.tsx`).

---

## 4. Convolution vs UV warp

**Melt is not a blur.** A convolution (box/Gaussian blur) averages neighboring texels in a kernel. `spaceDistortionFor` **moves the UV coordinates** before `texture2D`—each output pixel still reads one (or effectively one) texel, but from a shifted location. Ripples and twirl are **geometric warps**, not low-pass filters.

Posterize, bleed, halftone, and scanlines operate on **already-sampled RGB** in `layerShade`; they do not re-fetch neighbors for blur either.

---

## 5. Per-layer uniforms (`L0` / `L1` / `T0–T3`)

The fragment shader duplicates one effect bank per logical layer:

| Prefix | Layer | Store key |
|--------|-------|-----------|
| `L0` | Background (hero texture) | `layerEffects.background` |
| `L1` | Decal | `layerEffects.decal` |
| `T0`–`T3` | Text slots 0–3 | Master `layerEffects.text` or per-id `textLayerEffects` |

`SynthMaterial.tsx` maps `LayerEffectParams` fields to `u_{prefix}_melt`, `_bleed`, `_posterize`, etc. Text layers can **unlink** from the master text bundle and get their own coefficient set while sharing the same shader functions.

Global compositing uniforms (`u_decalTransform`, `u_linkDecalToMath`, `u_linkTextToMath`) control placement and whether decal/text share the background’s warped UV grid.

---

## 6. Presets as coefficients

Preset JSON stores **numbers and metadata**, not rendered pixels. A preset is input to the same shader—not a baked image. This is what you embed on production sites.

- Schema: [`src/lib/preset/types.ts`](src/lib/preset/types.ts) (`SynthPresetV2`: `synth`, `layerEffects`, `viewport`, `baseTimeSeconds`, optional base64 `assets`).
- Porting checklist: [`src/lib/preset/PORTING.md`](src/lib/preset/PORTING.md).

Hydration writes into Zustand; the next `useFrame` pushes values into uniforms. Optional embedded PNGs become textures—still sampled through the same warp/shade pipeline.

---

## 7. Interview cheat sheet

1. **What changes when you move a slider?** UI → Zustand (`layerEffects` or `textLayerEffects`) → `SynthMaterial` `useFrame` → uniform update → same fragment shader, new coefficients.

2. **Why one fragment shader?** Single full-screen draw; compositing order and per-layer looks are branches/uniform banks, not multi-pass FBO chains.

3. **How is the background not stretched?** `u_resolution` vs `u_imageResolution` compute contain scale; pixels outside the content rect output black.

4. **How does melt animate?** `u_*_t` (layer time × `timeScale`) feeds `spaceDistortionFor` and duotone LFO; export uses `window.__SYNTH_EXPORT_TIME__` for deterministic WebM frames.

5. **Decal vs background effects?** Independent `L0` and `L1` uniforms; optional `u_linkDecalToMath` mixes decal UV grid toward the warped background grid.

6. **How is text drawn?** CPU rasterizes to `CanvasTexture` (`textUtils.ts`); GPU treats each slot like a small atlas with its own warp/shade bank (`T0`–`T3`). Lab preview only — production sites use DOM text above the canvas.

7. **What does a preset save?** Coefficients + transforms + viewport/time snapshot (+ optional images)—see `buildPreset` / `gatherPresetExportInput`.

8. **Convolution vs melt?** Melt warps UVs; no blur kernel. Halftone/scanlines are procedural screen-space modifiers on RGB after sample.

---

## 8. Formula glossary (Lab)

**Formula glossary** in Background Studio (`/lab` → open panel → **Tune** → expand **Formula glossary**) exposes a Tier-1 catalog of shader coefficients with plain-English descriptions and teaching equations. Source of truth for entries: [`src/data/formulaCatalog.ts`](src/data/formulaCatalog.ts), derived from §3 above.

- Pick **Hero texture**, **Overlay**, or **Preview text** to filter formulas for that layer.
- Select a formula to read its equation and adjust one live slider; changes flow Zustand → `SynthMaterial` → uniforms immediately.
- For text, Tier 1 edits the master `layerEffects.text` bundle only (not per-sublayer unlinked copies).
- Full glossary and pipeline context remain in this file; the UI links here from the formula glossary.
