# Embedding a Stage live background

Phase 5 helper for dropping a **StageRecipe** (or catalog coefficients via the v2 adaptor) behind HTML.

This ships as an **in-repo** module (`src/lib/stage/embed/`), not a published npm player. Sites outside this stack still port shaders using [`../preset/PORTING.md`](../preset/PORTING.md).

## Quick layout

```html
<div id="stage-bg" aria-hidden="true"
  style="position:fixed;inset:0;z-index:0;pointer-events:none"></div>
<main style="position:relative;z-index:1">
  <!-- headlines, nav, CTAs -->
</main>
```

Rules:

| Concern | Guidance |
|---------|----------|
| **z-index** | Canvas/background at `0` (or below content). Content above. |
| **pointer-events** | Background must be `pointer-events: none` so clicks hit the DOM. |
| **reduced motion** | Honour `prefers-reduced-motion: reduce` — freeze time scales / show a static still. |

## In this repo

```tsx
import { StageEmbedBackground } from "@/lib/stage/embed";
import { synthPresetV2ToStageRecipe } from "@/lib/stage";

const recipe = synthPresetV2ToStageRecipe(catalogPreset);
// or JSON.parse(exportedStageRecipeJson)

<StageEmbedBackground recipe={recipe}>
  <main style={{ position: "relative", zIndex: 1 }}>…</main>
</StageEmbedBackground>
```

Demo route: **`/embed-demo`**.

Pure helpers (testable, no React):

- `getEmbedLayerStyle()` — fixed/absolute full-bleed + `pointer-events: none`
- `prefersReducedMotion()` / `shouldFreezeEmbedMotion()` — a11y pause signal

## From a campaign pack

1. Export **Download campaign pack** from `/lab` (or download StageRecipe JSON).
2. Use `stage-recipe.json` as the recipe document.
3. Apply via `applyStageRecipeJson` (inside this app) or port uniforms per PORTING.

Pack note `web_hero_live.txt` points at the same idea: live embed = recipe JSON, not a PNG.

## Honesty

- Runtime GPU still speaks **SynthPreset v2** through adaptors.
- Textures / assets in the recipe must be loadable (same-origin or data URLs).
- A full headless npm WebGL player is **out of scope** for Phase 5.
