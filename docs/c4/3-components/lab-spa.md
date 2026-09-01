# C3 — lab-spa

Internals of the Prism Lab SPA (browser). One recipe document drives preview, export, and hero-lite reuse.

## Components

| ID / label | Evidence | Role |
|------------|----------|------|
| Route switch | `src/app/App.tsx` | `/` → Lab; `/hero` → hero-lite (same compositor, no chrome) |
| Lab shell | `src/app/Lab.tsx`, `styles.css` | Pack families, axis-first sliders, regional group, talk field, export buttons, inspector |
| Canvas overlay | `src/app/CanvasOverlay.tsx`, `src/canvas/*` | DOM selection chrome over WebGL canvas; drag/resize → PathPatch on text transform |
| Pack catalog | `src/packs/catalog.ts`, `*.json`, `applyPack.ts` | 8 packs (`warm-film` … `clean-editorial`); intensity lerp; `textHints` for poster |
| Regional sliders | `src/packs/regionalSliders.ts` | `bg_blur`, regional exposure/contrast/etc. when `maskRef` active |
| Export actions | `src/export/png.ts`, `shareHash.ts`, `recipeDownload.ts` | FBO PNG; recipe JSON; `#r=` fflate hash; missing-asset gate |
| Recipe persistence | `Lab.tsx` (`RECIPE_KEY`), `validateRecipe` | `localStorage` draft; boot hydrate from URL hash |
| Asset upload | `Lab.tsx`, `src/assets/idb.ts` | Main + overlay blobs; triggers `segmentPersonMask` on portrait |
| Talk client | `src/talk/*` | `buildRecipeContext` (no blobs); `postTalk` → `normalizeTalkResponse` → `applyTalk` |

## Notes

- **Talk ≡ sliders ≡ canvas** — all paths call `applyPack`, `applySemanticSlider`, `applyRegionalSlider`, or allowlisted PathPatch helpers.
- **Pack-first UX** — Lab shows pack `axes` knobs; no free effect shopping (M06).
- **Export handles stay off-canvas** — selection chrome is DOM-only so PNG export stays clean (M07 F8).
- Hero-lite reuses compositor with bundled `{type:"url"}` assets — no Lab chrome.

Diagram: [`lab-spa.mmd`](lab-spa.mmd). Parent: [`../2-containers.md`](../2-containers.md).
