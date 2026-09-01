# I6 — Changelog (living receipt)

**Branch:** `rewrite/v1-styling`  
**Slice:** M07 Lab UX & canvas control

| Date | Slice | Status | Paths | Notes |
|------|-------|--------|-------|-------|
| 2026-09-01 | S0 | DONE | `I6_M07_IMPLEMENT_PLAN.md`, this file | Plan + living receipt |
| 2026-09-01 | S1–S2 | DONE | `src/canvas/*`, `CanvasOverlay.tsx` | Hit-test; drag/resize → PathPatch |
| 2026-09-01 | S3–S4 | DONE | `Lab.tsx`, `styles.css` | Inspector + Add text; canvas-first rail |
| 2026-09-01 | S5 | DONE | `src/talk/*` | Context + setTextContent + nudge/setTransform |
| 2026-09-01 | S6 | DONE | tests + build | `npm test` + `npm run build` green |

## OPEN defaults

| Item | Default | Why |
|------|---------|-----|
| Hit order | text then overlay | M07 §3.2 |
| Resize | Uniform scaleX=scaleY | Prefer aspect lock |
| Nudge Δ | ~0.08 NDC xy; ~0.1 scale (`null` → default) | "up a bit" / "bigger" |
| Transform clamp | xy ∈ [-1.5,1.5]; scale ∈ [0.15,4] | Keep on-stage |
| Selection chrome | DOM only over canvas | F8 export clean |
| Main | Pan/fit view only | No free main recipe drag |
| Lab layout | Stage left / thin right rail (≥860px) | F1 composition surface |

## Falsifiers

| # | Result |
|---|--------|
| F1 | Canvas-dominant chrome — **code** (manual glance) |
| F2 | Drag → PathPatch recipe ≡ preview — **unit** (`patchObjectTransform`) + manual |
| F3 | Resize allowlisted only — architecture (`/transform/scale*`) |
| F4 | Talk “move title up” via nudge→setTransform — **unit** |
| F5 | One text only — cap unchanged |
| F6 | Overlay inspector opacity/blend/scale — code |
| F7 | Multi-intent talk normalize — **unit** |
| F8 | Handles not in PNG — DOM overlay (manual export smoke) |

## Honest limits

- No rotate gizmo / smart guides / multi-text / layer panel
- No craft pack reopen (M06 closed)
- Approximate text hit AABB (font metrics estimate, not full raster)
- CI does not run WebGL; canvas interaction smoke is operator
- Ready to **pause** v1

## Operator

```bash
npm test && npm run build && npm run dev
# Add text → drag/resize → inspector edit → talk “move title up / set title to X” → export PNG (no handles)
```
