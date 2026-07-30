# C3 — studio-spa

Internals of the Background Studio SPA (browser). Shared Zustand + one WebGL canvas across routes.

## Components

| Label | Evidence | Role |
|-------|----------|------|
| Route shells | `src/shells/*`, `src/App.tsx` | `/` living demo, `/lab` studio, `/story` case study |
| Zustand scene store | `src/store/useSynthStore.ts`, `layerEffects.ts`, `textLayers.ts` | Textures, layer effect maps, UI tabs — in-memory |
| Preset lib | `src/lib/preset/*` | Build, validate, hydrate, apply (v1/v2), share `?preset=` |
| Mood client | `src/lib/mood/*` | Keyword map always; optional `POST /api/mood` then fallback |
| Semantic sliders | `src/lib/semantic/mapSemanticSliders.ts` | Intensity / Motion / Grit → `PresetPatch` |
| SynthMaterial | `src/webgl/materials/SynthMaterial.tsx` | Each frame: store → uniforms |
| GLSL compositor | `src/webgl/shaders/fragment.glsl` | Warp → sample → shade → alpha-composite (`L0` / `L1` / `T0–T3`) |
| Export | `src/lib/export/*`, `src/lib/preset/buildPreset.ts` | Preset JSON; WebM/PNG from canvas |

## Notes

- Canvas wiring: `SynthCanvas.tsx` + `SynthCanvasView.tsx` (one full-screen quad).
- Catalog of 14 looks: `src/data/presetCatalog.ts`.
- Diagram: [`studio-spa.mmd`](studio-spa.mmd). Parent: [`../2-containers.md`](../2-containers.md).
