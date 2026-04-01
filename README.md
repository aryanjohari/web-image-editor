# The Algorithm Engine

Master architectural document for **web-image-editor**: a browser-based, math-driven visual synthesizer. The product treats an uploaded image as a signal that passes through a **single full-screen quad** rendered with **custom GLSL**. All “effects” are **parameterized mathematical transforms** (UV distortion, channel mixing, quantization, procedural noise) rather than a stack of bitmap filters.

This README is written so an AI assistant (or a new contributor) can quickly grasp **context**, **capabilities**, **data flow**, and **constraints** without spelunking the tree.

---

## Overview

**The Algorithm Engine** is a **WebGL-first image lab**: users upload a raster image, tune a small set of continuous parameters, and see the result in real time on a GPU fragment shader. The experience is intentionally minimal—one plane, one material, one fragment program—so the creative surface area is the **math inside the shader** and the **uniforms** that drive it.

---

## Tech Stack

| Layer | Choice | Role in this repo |
|--------|--------|-------------------|
| **App shell** | **React 19** + **Vite 8** | SPA entry (`main.tsx`), layout, controls |
| **Language** | **TypeScript** | Store, components, typed Three.js usage |
| **3D / WebGL** | **Three.js** + **React Three Fiber (R3F)** + **@react-three/drei** | `Canvas`, render loop, `OrthographicCamera`, `shaderMaterial` |
| **State** | **Zustand** | Global synth parameters, texture handle, panel visibility, image pixel dimensions |
| **Motion (UI)** | **GSAP** | Slide in/out of the control stack panel |
| **Styling** | **Tailwind CSS** | Layout, typography, control chrome |
| **Shaders** | **GLSL** (`.glsl` files) | Bundled via `vite-plugin-glsl`; imported as strings into `ShaderMaterial` |

**Path alias:** `@/` → `src/` (see `vite.config.ts`).

---

## Core Architecture

### High-level data flow

1. **File upload** — User picks PNG/JPEG/WebP. `TextureLoader` decodes via object URL, applies texture settings, then **`setImageTexture`** stores the Three.js `Texture` plus **native bitmap dimensions** in Zustand.
2. **Zustand (`useSynthStore`)** — Holds:
   - `imageTexture` / `imageResolution` (for aspect-aware sampling)
   - `SynthParams`: `meltIntensity`, `colorBleed`, `noiseLevel`, `posterizeSteps`, `timeScale`
   - UI: `panelOpen`, setters
3. **React Three Fiber** — `<Canvas>` with **`gl={{ preserveDrawingBuffer: true }}`** (needed for **PNG export**), **`dpr={[1, 2]}`**, default **`OrthographicCamera`** (manual frustum: ±1 plane, Z toward scene).
4. **Scene graph** — `SynthScene`: one **`mesh`** with **`planeGeometry(2, 2)`** filling the clip-space quad and **`SynthMaterial`** (shader pipeline).
5. **Fragment shader** — Samples `u_texture` after **object-fit: cover** UV remapping, then applies **space distortion (melt)**, **color mutation (bleed + posterize)**, and **procedural noise**, driven by uniforms updated every frame from the store and R3F clock.

### Key implementation details (for maintainers & AI)

- **Material remount:** `SynthMaterial` is keyed by `imageTexture?.uuid` so swapping images gets a clean material lifecycle when needed (`SynthCanvas.tsx` / `SynthScene`).
- **Uniform updates:** Initial `useMemo` seeds uniforms; **`useFrame`** pulls fresh values via `useSynthStore.getState()` so sliders can write through the store without relying on React render timing (`SliderControl` uses `getState().setParam`).
- **Fallback texture:** When no image is loaded, a 1×1 `DataTexture` avoids invalid sampler state (`SynthMaterial.tsx`).
- **Vertex stage:** Pass-through UVs to the fragment shader (`vertex.glsl`).

---

## Current Capabilities

### Image upload pipeline

- **Formats:** PNG, JPEG, WebP (`accept` on file input).
- **Loading:** `URL.createObjectURL` → `TextureLoader` → revoke URL after load.
- **Color space:** `SRGBColorSpace` on the loaded texture.
- **NPOT / filtering:** `generateMipmaps = false`, **`LinearFilter`** for min/mag — avoids mip requirements on **non-power-of-two** sizes and keeps sampling predictable for full-screen quad use.
- **Object-fit: cover (shader):** Fragment shader maps quad UVs to texture space using **`u_resolution`** (draw buffer / canvas pixels) and **`u_imageResolution`** (bitmap pixels) so the image **fills the view without stretching**, cropping centered like CSS `object-fit: cover` (`objectFitCoverUV` in `fragment.glsl`).

### Active parameter sliders (5)

| Label | Store key | Shader role (summary) |
|--------|-----------|------------------------|
| **Melt Intensity** | `meltIntensity` | UV warp via summed trig waves + time |
| **Color Bleed** | `colorBleed` | Channel cross-talk matrix on RGB |
| **Noise Level** | `noiseLevel` | Animated hash-based grain added to RGB |
| **Posterize Steps** | `posterizeSteps` | Per-channel floor quantization (2–24 in UI) |
| **Time Scale** | `timeScale` | Scales R3F elapsed time for animation-heavy effects |

### Export

- **PNG — working:** Reads the WebGL `<canvas>`, draws to an offscreen 2D canvas (optional scale; default export uses **1.5×** in `StackPanel`), triggers download (`exportImage.ts`). Depends on **`preserveDrawingBuffer: true`**.
- **WebM — present in UI:** `exportLoopWebm` uses **`MediaRecorder`** + `captureStream`. It sets **`window.__SYNTH_EXPORT_TIME__`** during the capture loop, but **the shader / material does not read this value yet** — animation during export still follows the live R3F clock. Treat loop export as **experimental** until uniforms wire to that override.

### Shell UX

- Right **Stack** panel: upload, sliders, export; **GSAP** slide off-screen with **Hide** / floating **Open Stack**.
- **@react-three/drei** `OrthographicCamera` with `makeDefault` + manual frustum matching the 2×2 plane.

---

## Constraints & Gotchas (for AI / contributors)

- **Single full-screen effect:** No layer compositor, masks, or multi-pass pipeline yet — all logic is in one fragment program.
- **Export coupling:** PNG/WebM grab `document.querySelector("canvas")` — assumes **one** prominent canvas (fragile if the DOM gains more canvases).
- **Debug logging:** `useSynthStore` / `UploadButton` use `DEBUG = true` console noise; tune before production polish.
- **WebM time override:** `__SYNTH_EXPORT_TIME__` is written but not consumed — documented above to prevent false assumptions about deterministic export.

---

## Roadmap

Placeholder phases for product direction (not implemented in this document’s snapshot):

| Phase | Theme | Intent |
|-------|--------|--------|
| **Phase 1** | **Localized Masking** | Apply parameter regions spatially (brush / matte / weight map) instead of global full-frame math only. |
| **Phase 2** | **Pro Color Engine** | Richer color science: grading curves, spaces, intentional film/print models beyond the current bleed + posterize matrix. |
| **Phase 3** | **Texture Generators** | Procedural sources and/or multi-input blending — not only single uploaded stills. |
| **Phase 4** | **Video Export** | Reliable timeline-driven export (uniform time override, audio sync if needed, format choices) building on or replacing the current WebM experiment. |

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
| App layout / Canvas | `src/App.tsx` |
| Global state | `src/store/useSynthStore.ts` |
| R3F scene | `src/webgl/SynthCanvas.tsx` |
| Shader material + uniforms | `src/webgl/materials/SynthMaterial.tsx` |
| GLSL | `src/webgl/shaders/vertex.glsl`, `src/webgl/shaders/fragment.glsl` |
| Upload | `src/components/UploadButton.tsx` |
| Controls + export triggers | `src/components/controls/StackPanel.tsx`, `SliderControl.tsx` |
| PNG export | `src/lib/export/exportImage.ts` |
| WebM capture | `src/lib/export/exportLoopWebm.ts` |
