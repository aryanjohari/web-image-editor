# I6 — M07 Implement Plan

**Date:** 2026-09-01  
**Branch:** `rewrite/v1-styling`  
**Status:** DONE  
**Binding:** `docs/modules/M07_LAB_UX_AND_CANVAS_CONTROL.md` (U1–U10, F1–F8)

---

## Scope

**In:** Selection + hit-test (text then overlay); DOM handles; drag → `transform.x/y`; uniform resize → `scaleX/scaleY` via PathPatch; inspector (text content/fontSize/presets; overlay opacity/blend/scale) + Add text; canvas-first Lab chrome; talk `RecipeContext` extensions + `set_text_content` / `nudge_transform` / `set_transform`; units + falsifiers F1–F8.

**Out:** Multi-text / layer panel; Stage/Canva/Jobs; rotate gizmo; craft pack reopen; free PathPatch from LLM; selection chrome in PNG export; design-system reboot.

---

## Architecture

```text
docs/reviews/
  I6_M07_IMPLEMENT_PLAN.md
  I6_CHANGELOG.md

src/canvas/
  hitTest.ts              ← NDC AABB; text then overlay
  pointerToTransform.ts   ← CSS ↔ NDC; drag / uniform scale
  index.ts

src/app/
  Lab.tsx                 ← canvas-first chrome; selection; inspector
  CanvasOverlay.tsx       ← handles + pointer → PathPatch
  styles.css              ← stage-dominant rail

src/talk/
  types / context / schema / normalize / applyTalk
                          ← context + set_text_content + transform tools
```

### Coordinate law

CSS box → NDC (`x = 2*(px/w)-1`, `y = 1-2*(py/h)`). Object AABB from `containScale(texW,texH,view) * transform.scale` + `transform.x/y`. Commit only allowlisted PathPatch (`/objects/{id}/transform/*`, text/opacity/blend). Handles = DOM over canvas; never in export FBO (F8).

### Talk tools (semantic only)

| Tool | Maps to |
|------|---------|
| Existing pack/slider/regional/setTextHint/regen | unchanged |
| `setTextContent` | ensure text + PathPatch content |
| `nudgeTransform` → normalize → `setTransform` | text \| overlay `x,y,scale*` |
| `setTransform` | absolute allowlisted fields |

---

## Slice checklist

| # | Slice | Done when |
|---|-------|-----------|
| S0 | Plan + changelog stub | Receipts |
| S1 | Selection + hit-test + handles | Select text/overlay; Esc clears |
| S2 | Drag/resize → PathPatch | Recipe + preview; export clean |
| S3 | Inspector + Add text | Content/size/presets/opacity/blend |
| S4 | Canvas-first chrome | F1: composition, not form |
| S5 | Talk context + tools + prompt | Multi-intent + spatial; units |
| S6 | Falsifiers F1–F8 + receipt | `npm test` + `npm run build` |

All slices **DONE** (F1/F8 visual = operator PENDING in changelog).

---

## Caps / locks

- 1 main + 1 overlay + 1 text (M00)
- No free main drag as recipe
- talk≡canvas≡inspector via PathPatch
- No craft pack changes
- After I6: **pause** v1
