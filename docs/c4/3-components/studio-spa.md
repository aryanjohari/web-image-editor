# C3 — studio-spa

Internals of the Background Studio SPA (browser). Shared Zustand + one WebGL canvas across routes.

## Components

| ID / label | Evidence | Role |
|------------|----------|------|
| Route shells | `src/shells/*`, `src/App.tsx` | `/` living demo, `/lab` studio drawer, `/story` case study; unknown → `/` |
| Zustand scene store | `src/store/useSynthStore.ts`, `layerEffects.ts`, `textLayers.ts` | Textures, global synth params, per-layer effect maps, UI tabs — in-memory |
| Preset catalog | `src/data/presetCatalog.ts` (+ builders / background / demo idea modules) | **14** looks: 7 featured ambient + 7 legacy |
| Preset lib | `src/lib/preset/*` | Build (`buildPreset`), validate, hydrate, apply modes (effects-only / style / full / patch), `?preset=` share URLs, preserve-text preference (`localStorage`) |
| Mood client | `src/lib/mood/*` | Keyword map always; optional `fetch('/api/mood')` then keyword fallback on any failure |
| Semantic sliders | `src/lib/semantic/mapSemanticSliders.ts` | Intensity / Motion / Grit → background-layer `PresetPatch` |
| Decal pipeline | `src/utils/decalTexture.ts`, `UploadButton.tsx` | Overlay processing → `setDecalTexture` |
| R3F canvas host | `src/components/SynthCanvasView.tsx`, `src/webgl/SynthCanvas.tsx` | Orthographic camera, one `planeGeometry(2,2)`, `preserveDrawingBuffer: true`, pointer drag for overlay/text |
| SynthMaterial | `src/webgl/materials/SynthMaterial.tsx` | `useFrame`: store → uniforms; rasterizes preview text to `CanvasTexture`s; respects `window.__SYNTH_EXPORT_TIME__` |
| GLSL fragment compositor | `src/webgl/shaders/fragment.glsl` (+ `vertex.glsl`) | Contain-letterbox hero UVs; `layerWarp` then `layerShade` per prefix; alpha-composite `L0` / `L1` / `T0–T3` in **one** pass |
| Export | `src/lib/export/*`, `src/lib/preset/buildPreset.ts`, `ExportActions.tsx` | JSON from Zustand; WebM via `MediaRecorder` + export-time hijack; PNG from canvas |

## Notes (distinctive effort, not collapsed)

- **Presets are coefficients, not frames** — JSON is built from the store; the GPU path is how you *preview* and capture media.
- **Apply modes** — effects-only can keep preview text; full import may embed assets (`hydrate` / `assets`).
- **Export clock** — `exportLoopWebm` sets `__SYNTH_EXPORT_TIME__` so layer `u_*_t` follow a deterministic timeline, then clears it.
- Lab UI chrome (`ControlsDrawer` / `StackPanel`) sits on the shells; omitted as separate C3 boxes to avoid UI-widget noise.

Diagram: [`studio-spa.mmd`](studio-spa.mmd). Parent: [`../2-containers.md`](../2-containers.md).
