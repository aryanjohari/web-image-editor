# The Algorithm Engine

Master architectural document for **web-image-editor**: a browser-based, math-driven visual synthesizer. The product uploads a **background image** plus an optional **decal** sticker and stacks up to **four text overlays**, all rendered on a **single full-screen quad** with **custom GLSL**. Warp, color, and texture math still live in **one fragment program**, but **each logical layer gets its own effect bundle** (uniforms keyed `L0` / `L1` / `T0–T3`) so background, decal, and text can diverge creatively.

This README is written so an AI assistant (or a new contributor) can quickly grasp **context**, **capabilities**, **data flow**, and **constraints** without spelunking the tree.

---

## Routes

| Path | Purpose |
|------|---------|
| **`/`** | **Landing** — living hero: auto-loads `public/demo/hero.jpg` + bundled preset (motion, grade, GPU text). Minimal chrome; link to the lab. Replace `public/demo/hero.jpg` with your own image to customize the hero. |
| **`/lab`** | **Lab** — full editor (Ideas, Stack, uploads, presets, export) |
| **`/story`** | **Case study** — static explainer (coming in a later phase) |

Unknown paths redirect to **`/`**. Product vision and phased plan: [PROJECT.md](PROJECT.md).

**GPU pipeline & formula glossary:** [MATH.md](MATH.md)

**Static deploy / SPA:** `public/_redirects` sends all paths to `index.html` (Netlify). `npm run preview` also serves client routes after `npm run build`.

---

## Overview

**The Algorithm Engine** is a **WebGL-first image lab**: users upload raster images, compose overlay content, tune continuous parameters per stack tab, and see the result in real time via a GPU fragment shader. The draw path stays minimal—one plane, one `ShaderMaterial`, one fragment program—while the shader **composites** tinted, warped samples in order: **background texture → decal alpha-over (+ optional luminance-mask blend) → text slots bottom-to-top**.

---

## Tech Stack

| Layer | Choice | Role in this repo |
|--------|--------|-------------------|
| **App shell** | **React 19** + **Vite 8** | SPA entry (`main.tsx`), layout, controls |
| **Language** | **TypeScript** | Store, components, typed Three.js usage |
| **3D / WebGL** | **Three.js** + **React Three Fiber (R3F)** + **@react-three/drei** | `Canvas`, render loop, `OrthographicCamera`, `shaderMaterial` |
| **State** | **Zustand** | Layer effect maps, text layers, textures, decal transform, UI tabs / panel visibility |
| **Motion (UI)** | **GSAP** | Slide in/out of the control stack panel |
| **Styling** | **Tailwind CSS** | Layout, typography, control chrome |
| **Shaders** | **GLSL** (`.glsl` files) | Bundled via `vite-plugin-glsl`; imported as strings into `ShaderMaterial` |

**Path alias:** `@/` → `src/` (see `vite.config.ts`).

---

## Core Architecture

### High-level data flow

1. **File upload** — **Background**: PNG/JPEG/WebP → `TextureLoader` → **`setImageTexture`** stores `Texture` plus **bitmap dimensions**. **Decal**: same formats through **`createProcessedDecalTexture`** (`decalTexture` utils) → **`setDecalTexture`** for the sticker atlas.
2. **Zustand (`useSynthStore`)** holds:
   - **`imageTexture` / `imageResolution`** — background sampling and letterbox math
   - **`decalTexture`** — optional overlay texture
   - **`SynthParams`** (global synth fields): `decalScale`, `decalOffsetX` / `decalOffsetY`, `decalBackgroundLumaMask`, `linkDecalToMath`, `linkTextToMath`
   - **`layerEffects`** — `Record<"background" | "decal" | "text", LayerEffectParams>`: full effect bundle (**melt, bleed, noise, posterize, timeScale, radial mask + twirl, duotone colors + cycle speed, halftone, scanlines**) per logical layer master
   - **`textLayers`** — up to **`MAX_TEXT_LAYERS` (4)** entries (`TextLayer`: id, text, color, `fontSize`, offsets, scale, **`effectsLinked`**)
   - **`textLayerEffects`** — when a text layer unlinks from the master `layerEffects.text`, its private `LayerEffectParams` live keyed by layer id
   - **UI**: `stackTab` (`background` | `decal` | `text`), `selectedTextLayerId`, `panelOpen`
3. **React Three Fiber** — `<Canvas>` with **`gl={{ preserveDrawingBuffer: true }}`** (PNG export), **`dpr={[1, 2]}`**, Drei **`OrthographicCamera`** (`manual`: ±1 frustum, plane at \(z=0\)).
4. **Scene graph** — **`SynthScene`** (`SynthCanvas.tsx`): one **`mesh`**, **`planeGeometry(2, 2)`**, **`SynthMaterial`**. **`SynthMaterial`** is **`key`**ed by `imageTexture?.uuid` so swaps get a predictable material lifecycle.
5. **`SynthMaterial`** — Seeds and updates uniforms. **Per-layer time:** each `LayerEffectParams.timeScale` multiplies the shared **`baseTime`** (R3F clock **`elapsedTime`** or **`window.__SYNTH_EXPORT_TIME__`** during WebM capture) into separate uniforms (`u_L0_t`, `u_L1_t`, `u_T0_t`, …).
6. **Text rasterization** — `createTextTexture` (`textUtils`) builds **`CanvasTexture`**s per populated slot when `textLayers` or viewport size changes; slots map to **`u_textSlot0`…`u_textSlot3`** and transforms **`u_textTransform0…3`** `(offsetX, offsetY, scale)`.
7. **Fragment shader** — Shared **contain** UVs for the background; **warp + shade pipeline** (`layerWarp` → sample → `layerShade` with bleed, posterize, duotone + LFO, halftone, scanlines, grain) runs per layer prefix. Decal sampling uses **`u_decalTransform`** and optional **`u_linkDecalToMath`** to share background warp grid. Text uses **`u_linkTextToMath`** (semantics coupled to whether a decal is present—see **`SynthMaterial` `useFrame`**). Outputs alpha-composite text slots in slot order (**first list item = drawn first / underneath**).

### Interaction

- **Pointer drag on the canvas** (`SynthScene`): with **Decal or Background** tab active, dragging updates **`decalOffsetX` / `decalOffsetY`**. With **Text** tab active and both a decal and selection, dragging updates **the selected text layer’s** **`offsetX` / `offsetY`** (`updateSelectedTextLayerOffset`). Cursor switches to grab/grabbing during drag.

### Key implementation details (for maintainers & AI)

- **Uniform updates:** initial `useMemo` seeds uniforms; **`useFrame`** reads **`useSynthStore.getState()`** so sliders can commit through the store without waiting on React reconcile timing.
- **Export timeline:** **`exportLoopWebm`** assigns **`window.__SYNTH_EXPORT_TIME__`** each frame; `finally` **deletes** it so preview returns to the scene clock (**same pattern as older single-`u_time` docs**, now applied to each layer’s `u_*_t`).
- **`window.__SYNTH_LAST_BASE_TIME__`** — written each frame for **preset snapshot** / reproducibility hooks (`preset/snapshot`).
- **Fallback textures:** 1×1 opaque and transparent **`DataTexture`**s avoid invalid samplers when images are missing (`SynthMaterial.tsx`).
- **Vertex stage:** Passthrough UVs (`vertex.glsl`).

---

## Current Capabilities

### Image upload pipeline

- **Formats:** PNG, JPEG, WebP on file inputs.
- **Background:** `SRGBColorSpace`, NPOT-safe **`LinearFilter`**, mipmaps off (same rationale as legacy README).
- **Object-fit contain (shader):** Fragment shader maps quad space to bitmap space using **`u_resolution`** × **`u_imageResolution`** so content is letterboxed centered (black margins outside).

### Layer tabs & effect bundles

The **Stack** panel uses three tabs; **`LayerEffectControls`** reads/writes **`layerEffects[layer]`** for **`background`** and **`decal`**. On the **Text** tab, **`effectsLinked`** can pin a layer to **`layerEffects.text`** or carve out **`textLayerEffects[id]`**.

| Area | Store / keys | Shader |
|------|----------------|--------|
| Background | `layerEffects.background` | Prefix **`L0`** |
| Decal | `layerEffects.decal`, `decal*` params, `linkDecalToMath`, `decalBackgroundLumaMask` | Prefix **`L1`**, decal sample + tint stack |
| Text (≤4) | `textLayers`, `textLayerEffects`, `linkTextToMath`, placement | Prefixes **`T0`–`T3`**, rasterized canvas textures |

**Decal extras:** **`decalBackgroundLumaMask`** blends from normal alpha-over toward **multiplying the shaded background by raw decal luminance** (shader uses decal RGB before L1 shading for that branch).

### Presets (`src/lib/preset/`)

- **Current schema:** **`PRESET_SCHEMA_VERSION` = 2** — embeds **`synth`** (`SynthParams` + `textLayers` + selection + `textLayerEffects`), **`layerEffects`**, **`imageResolution`**, **`viewport`**, **`baseTimeSeconds`**, optional **base64 PNG `assets`** (background/decal).
- **v1 presets** (`LegacySynthParamsV1`) are still **validated and hydrated** (`applySynthPreset` → versioned apply).
- **Stack panel:** copy JSON to clipboard, download `synth-preset.json`, file import with validation (**`PresetValidationError`** UX), toggle **include embedded images**.
- **Ideas catalog:** [`src/data/presetCatalog.ts`](src/data/presetCatalog.ts) — **10 style-only looks** (Acid Noir, Glitch Core, Archive, Soft Bloom, Xerox Punk, Cold Scan, Sunset Melt, Strobe Haze, Tape Worn, Raw Zine). Single registry for the Ideas gallery and future mood mapping; landing hero preset stays separate in [`src/data/landingHomePreset.ts`](src/data/landingHomePreset.ts).
- **`gatherPresetExportInput`** / **`buildPreset`** / **`hydrate`** — round-trip authoring.

### Export

- **PNG:** `exportCanvasPng` draws WebGL canvas to 2D (default **1.5×** scale in **`StackPanel`**) → download (`exportImage.ts`). Requires **`preserveDrawingBuffer`**.
- **WebM:** **`exportLoopWebm`** (`MediaRecorder` + `captureStream`), timeline via **`__SYNTH_EXPORT_TIME__`**, **`finally`** cleanup.

### Shell UX

- Right **Stack** panel: tabs, uploads, sliders, presets, PNG/WebM; **GSAP** slide + **Hide** / floating **Open Stack**.
- **`/`** landing shell: shared canvas + living hero (auto-loads demo image + preset on mount) + link to **`/lab`**. No Stack or Ideas.
- **`/lab`** shell: Ideas menu + Stack drawer + shared canvas (`LandingShell` / `LabShell` in `src/shells/`).

---

## Constraints & Gotchas (for AI / contributors)

- **Single draw pass:** Compositing is **not** a multi-pass framebuffer stack; complexity is **in one fragment shader** with duplicated uniform banks per logical layer.
- **Export / queries:** PNG, WebM, and preset helpers use **`document.querySelector("canvas")`** — brittle if multiple canvases appear.
- **Debug logging:** **`useSynthStore`** and **`UploadButton`** ship with **`DEBUG = true`** console noise (`SynthMaterial` debug is **`false`**); tighten before shipping a quiet build.

---

## Future direction

Same product themes as before: **audio reactivity**, richer blending / multi-pass options, codec and duration UX for capture, optional audio-synced export — not prerequisites for the current single-pass architecture.

---

## Project scripts

```bash
npm run dev      # Vite dev server
npm run build    # Typecheck + production bundle
npm run preview  # Preview production build
npm run lint     # ESLint
```

---

## Entry points (quick map)

| Area | Primary files |
|------|----------------|
| App routing | `src/App.tsx`, `src/main.tsx`, `src/shells/LandingShell.tsx`, `src/shells/LabShell.tsx` |
| Shared canvas | `src/components/SynthCanvasView.tsx` |
| Global store | `src/store/useSynthStore.ts` |
| Per-layer defaults & types | `src/store/layerEffects.ts`, `src/store/textLayers.ts` |
| R3F scene | `src/webgl/SynthCanvas.tsx` (`SynthScene`) |
| Shader material + uniforms | `src/webgl/materials/SynthMaterial.tsx` |
| GLSL | `src/webgl/shaders/vertex.glsl`, `src/webgl/shaders/fragment.glsl` |
| Upload | `src/components/UploadButton.tsx`, `src/utils/decalTexture.ts` |
| Controls / preset + export triggers | `src/components/controls/StackPanel.tsx`, `LayerEffectControls.tsx`, `SliderControl.tsx` |
| Text raster helpers | `src/utils/textUtils.ts` |
| Presets | `src/lib/preset/*.ts` |
| PNG export | `src/lib/export/exportImage.ts` |
| WebM capture | `src/lib/export/exportLoopWebm.ts` |
