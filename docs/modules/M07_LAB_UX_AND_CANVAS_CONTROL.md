# M07 — Lab UX & Canvas Control

**Status:** research card  
**Date:** 2026-09-01  
**Depends on:** `VISION.md`, `02_CONSTITUTION.md`, `M00`–`M06`, `I0`–`I5` changelogs, `Lab.tsx`, `renderer.ts`, recipe `transform` / `TextSource`, talk schema/context  
**Purpose:** Close Prism **v1 usability** — Lab as a **composition surface** (not a form), talk smarter **over the same M00–M06 controls**, text/overlay under **direct canvas control** (select → drag → resize → edit). Stage-*clarity*, not Stage/Canva product.

---

## 0. Question

What minimal Lab UX makes Prism feel like **editing a composition**, not filling a settings panel — while keeping Tier A caps, PathPatch truth, and closed talk?

1. **Canvas model:** which objects are selectable; drag vs resize vs pan/fit; hit-test / handles without a scene graph product?
2. **Inspector:** content, size, presets, opacity/blend — parallel to canvas, never a second truth?
3. **Chrome:** canvas-first layout; packs/sliders/talk as thin rail — polish, not redesign system?
4. **Talk upgrade:** multi-intent in one turn over packs + regional + text/transform; better prompt + context; still fail closed?
5. **Allowlist:** any PathPatch / schema deltas required, or mostly wire UI to existing `/transform/*` + text fields?
6. **v1 closed:** falsifiers → I6 → **pause** (craft already closed in M06/I5).

Constitutional locks bind this card: recipe truth; talk≡canvas≡inspector; one engine; 1 main + 1 overlay + 1 text (M00); no free GLSL; no Canva/Jobs/Stage martech (`VISION`; `02` §1–3, §11).

---

## 1. Why UX now

I0–I5 shipped the **machine + craft**: compositor caps, packs (8), semantic + regional axes, blur, minimal type hints, talk tools, export. Lab still reads as a **left-rail form** (`Lab.tsx`: file inputs → text field → position buttons → talk → packs → sliders → export) with a modest preview. Composition exists in the recipe (`transform`, `TextSource`) but not in the hands.

M06 locked craft and deferred “thin UI polish.” M07 is that polish — **usability constitution**, not a second craft pass. After I6: **pause**. Thesis stays: parametric GPU DSL + optional talk + one person mask — **showable compositions**, not a design suite.

---

## 2. Research map

### 2.1 Canvas editors (steal pattern, keep Prism caps)

| Source | Pattern | Prism lens |
|--------|---------|------------|
| **Photopea / Figma-lite** | Select → drag → corner scale → inspector mirrors transform | **FEASIBLE** for ≤2 movable objects; no layer stack UI |
| **VSCO / mobile grade** | Preset-first; canvas is the product; controls docked | Pack axes stay primary; canvas grows presence |
| **Select + handles** | Screen-space hit targets; write recipe units on pointerup | Map CSS pointer → `transform.x/y/scale*` |

**Won’t chase:** multi-select, rotate gizmos as identity, smart guides, infinite artboards.

### 2.2 Talk UX (closed schema, multi-intent)

| Lesson | Lock |
|--------|------|
| One turn may combine pack + axes + regional + type (M03/M06) | Keep; **improve context** so tools fire correctly |
| Structured JSON > free PathPatch (M03 T2) | No free pointers; **semantic** text/transform tools only |
| Context = current absolutes (RQ3) | **Extend** with selection, text content, transforms, overlay |
| Generative stays refuse (`02` §3) | Still `refuse`; no vision bytes |

### 2.3 Stage lessons (anti-pattern for product scope)

`01` DROP / `02` §11: Stage trap = Jobs API, campaigns, brand kits, multi text slots.

| Steal (interaction only) | Refuse (product) |
|--------------------------|------------------|
| On-canvas text; drag; size handles | Unlimited layers / layer panel |
| Inspector ≡ recipe | Campaigns, Jobs API, Autofill |
| One text object clarity | Multi-text, brand-kit governance |
| Live preview primacy | Second renderer / production pipeline |

Borrow **direct-manipulation clarity**; do not restore Stage under new names.

---

## 3. Canvas interaction model

### 3.1 Object roles (LOCKED)

| Object | Selectable | Drag position | Resize (scale) | Notes |
|--------|------------|---------------|----------------|-------|
| `image(main)` | No (or view-only) | **No** free drag | **No** free scale | **Pan/fit** of the view only (existing wrap/contain); crop scrubbers stay optional later |
| `image(overlay)` | Yes | Yes → `transform.x/y` | Yes → `scaleX/scaleY` (uniform preferred) | Opacity/blend in inspector |
| `text` | Yes | Yes | Yes (scale and/or `fontSize`) | Content edit on-canvas or inspector; create if missing |

**Cap unchanged:** ≤1 overlay, ≤1 text (M00 C3). No z-stack UI beyond existing `z` defaults.

### 3.2 Selection + handles

```text
Pointer down on canvas
  → hit-test text quad, then overlay quad (screen-space AABB from transform)
  → set selection = text | overlay | null
  → drag moves selection (live PathPatch or local draft → commit on up)
  → corner handle (or edge) scales; keep aspect unless inspector unlocks
Empty click → clear selection
Escape → clear selection
```

Handles are **DOM/CSS overlays** over the WebGL canvas (not a second GL picker pass) unless I6 measures a need. Selection chrome must not dirty export FBO (M04).

### 3.3 Coordinate law

Recipe `transform` stays **NDC-ish offsets + scale** as today (`renderer.transformUniforms`; textHints in `transformForTextPosition`). Pointer math: CSS box → normalized recipe units; commit via allowlisted PathPatch. Rotation gizmo = **out of I6** (field already exists; scrubber-only if needed).

### 3.4 Presets vs free transform

M06 locked **3 positions + 2 type presets** — not a layout builder. M07 **keeps** presets as one-click snaps and **adds** free drag/resize on the **same** text object. Presets overwrite transform/style fields via existing `applyTextLayout`; free transforms do not invent a second schema.

---

## 4. Inspector / add-text

Minimal inspector (rail section, context-sensitive):

| When selected | Fields | Write path |
|---------------|--------|------------|
| **Text** | content, fontSize (or scale), position preset buttons, type preset, opacity | PathPatch `/objects/text/...` + `applyTextLayout` for presets |
| **Overlay** | opacity, blend ∈ {normal, multiply, screen, overlay}, scale scrubber | PathPatch `/objects/overlay/...` |
| **None** | Pack axes / regional / talk as today | Unchanged helpers |

**Add text if missing:** “Add text” (or first content commit) creates the single text object (`ensureTextObject` / identity text) — same as poster `textHints` create path. No second text.

**On-canvas edit (optional I6):** double-click text → content field focused or lightweight overlay input; still one `TextSource.content` string. Prefer inspector-first if time-box slips; decision is **IN** for content edit somewhere direct.

---

## 5. Lab layout (chrome)

**Goal:** first glance = **composition**, not dashboard form.

| Lock | Choice |
|------|--------|
| Hierarchy | **Canvas dominant** (larger preview; center/right stage) |
| Controls | Packs + axes + regional + talk + export in a **side and/or bottom rail** |
| Upload / mask | Compact chrome (chips / collapse), not the visual center |
| Visual system | Thin polish of existing tokens (`styles.css`) — **not** a design-system reboot |
| Mobile | Stack: canvas first, rail below; keep one composition column |

Anti-goals: card grid of tools, marketing hero, Stage-like multi-panel production UI.

M06 pack-first loop stays:

```text
Upload → pack → axes (± regional) → text/overlay on canvas → talk → export
```

---

## 6. Talk upgrade (schema / prompt / context)

### 6.1 Same axes law

Talk remains a **router** over shipped controls: `applyPack`, global/regional sliders, `setTextHint`, `regenerateMask`, `refuse`. **No** free GLSL, **no** “do anything,” **no** parallel mood JSON.

### 6.2 Context extensions (LOCKED)

Extend `RecipeContext` (still no Blobs / AssetRefs):

```text
recipeContext += {
  hasOverlay?: boolean
  hasText?: boolean
  textContent?: string          // truncated
  textTransform?: { x,y,scaleX,scaleY }   // optional compact
  overlayTransform?: { x,y,scaleX,scaleY }
  selection?: "text" | "overlay" | "none"  // Lab selection hint
}
```

Sliders / pack / hasMask / regional remain as M03–M06.

### 6.3 Schema tool deltas (semantic only)

| Tool | Maps to | Notes |
|------|---------|-------|
| Existing tools | unchanged helpers | Multi-intent one turn **encouraged** in system prompt |
| `set_text_content` | PathPatch content (+ ensure text object) | Closed string; not copywriting Autofill |
| `nudge_transform` or `set_transform` | allowlisted `transform.*` on text \| overlay | Prefer small deltas for “up a bit”; absolute for “center” |
| Keep `setTextHint` | position + typePreset snaps | Coexists with free transform |

**Still forbidden in schema:** free PathPatch strings, effect ids, asset upload, export, invent overlay pixels.

### 6.4 Prompt polish

System prompt upgrades (I6): (1) prefer multi-tool turns when user stacks intents (“warm film, mute bg, title bottom”); (2) use `selection` + transforms for spatial language; (3) text content edits only via `set_text_content`; (4) refuse generative harder with examples; (5) never invent tools outside schema enums.

Normalize → same `applyTalk` / PathPatch / `validateRecipe` as canvas and inspector (**talk≡canvas≡inspector**).

---

## 7. PathPatch allowlist deltas

**Mostly already shipped** (`pathPatch.ts`):

- `/objects/{id}/transform/(x|y|scaleX|scaleY|rotation)`
- `/objects/{id}/text/(content|fontSize|…)`
- `/objects/{id}/(opacity|blend|…)`

| Delta | Decision |
|-------|----------|
| New pointer prefixes | **None required** for I6 canvas/inspector |
| Talk | Semantic tools only → host builds PathPatch (M01 R9) |
| Main transform via talk/UI | **Disallow** free main drag; pan/fit is view state, not recipe churn (unless a later falsifier forces crop UX) |
| `visible` / `z` | Leave allowlisted but **no Lab chrome** for layer juggling |

Validator caps (1+1+1) unchanged.

---

## 8. Falsifiers

| # | Falsifier | Meaning |
|---|-----------|---------|
| F1 | Lab still feels like a form after I6 (canvas not dominant) | Chrome failed — enlarge stage / thin rail |
| F2 | Drag text moves pixels but recipe/export diverge | Truth breach — must PathPatch + same draw |
| F3 | Resize uses a non-allowlisted or dual state | Parallel model — reject |
| F4 | Talk “move title up” cannot affect transform without free pointers | Context/tool gap — add semantic transform tool |
| F5 | Users need 2+ text objects for poster demos | Cap pressure — refuse multi-text; improve one-text UX |
| F6 | Overlay drag ships without opacity/blend parity in inspector | Incomplete object model |
| F7 | Talk multi-intent (pack+regional+text) regularly refuses or half-applies | Prompt/schema/normalize bug |
| F8 | Selection chrome appears in PNG export | Export contamination (M04) |

---

## 9. Won’t chase

- Stage / Background Studio / Jobs API / campaign packs / brand kits  
- Canva, Photoroom, generative fill / inpaint / bg replace  
- Unlimited layers, layer panel, multi-text, multi-overlay  
- Freeform GLSL / user ops / effect marketplace  
- Reopening 8-pack craft catalog (M06/I5 closed)  
- Full Figma: constraints, auto-layout, components, multi-page  
- Rotate gimbal / pen tool / masking brush as Lab identity  
- Vision-in-the-loop talk (image bytes to Gemini)  
- Design-system / marketing-site redesign as substitute for canvas control  

---

## 10. Decision log

| # | Topic | Decision | Why |
|---|-------|----------|-----|
| U1 | Timing | M07 now → **I6** → **pause** | Craft shipped; usability closes v1 |
| U2 | Object caps | Keep **1 main + 1 overlay + 1 text** | M00; constraint is product |
| U3 | Canvas targets | Text + overlay drag/resize; main = pan/fit only | Composition without photo-layer studio |
| U4 | Text | Presets **and** free transform; add if missing; edit content | M06 type + direct control |
| U5 | Overlay | Optional drag/resize; opacity/blend inspector | Same transform law as text |
| U6 | Chrome | Canvas-first; thin side/bottom rail | Form → composition surface |
| U7 | Talk | Smarter prompt + richer context + semantic text/transform tools | Same closed axes; no free PathPatch |
| U8 | Recipe | All moves = PathPatch / helpers → `validateRecipe` | talk≡canvas≡inspector |
| U9 | Allowlist | No new prefixes required | Wire UI to existing transform/text paths |
| U10 | Stage | Steal handles/clarity only | Refuse martech / infinite editor |

---

## 11. References

**In-repo:** `VISION.md`, `02_CONSTITUTION.md`, `01_ENGINE.md` (Stage DROP), `00_FIELD_RESEARCH.md`; M00–M06; `Lab.tsx`, `renderer.ts`, `pathPatch.ts`, `src/talk/*`, `applyPack.ts` / `textPresets.ts`; I5 changelog.

**External (interaction only):** Figma-lite / Photopea select+handles; [VSCO Pro](https://www.vsco.co/features/photo-filters/pro-presets); [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output).

---

## Operator summary

- **v1 usability close:** this card → **I6** canvas + thin chrome + smarter closed talk → **pause**.  
- **Canvas:** text/overlay drag + scale; main pan/fit; caps 1+1+1.  
- **Inspector ≡ canvas ≡ talk** via PathPatch; talk gets richer context + semantic text/transform tools.  
- **Not Stage/Canva:** steal handles; refuse jobs/campaigns/unlimited layers.

---

## I6 implement pointer

Ordered slices (plan file later — **not** this card):

1. Selection + hit-test; DOM handles; Lab selection state.  
2. Drag/resize → PathPatch `transform` (text + overlay); export clean.  
3. Inspector (content, size, presets, opacity/blend) + Add text.  
4. Chrome: canvas-dominant; compact upload/mask; rail packs/axes/talk/export.  
5. Talk: extend `RecipeContext`; `set_text_content` + transform nudge/set; prompt + normalize tests.  
6. Falsifiers F1–F8 + talk≡canvas unit checks.

**No craft pack reopen. No multi-text. No Jobs API.**

---

## Decisions M07 must lock (checklist)

| Lock | Value |
|------|-------|
| Object caps | **1 main + 1 overlay + 1 text** |
| Canvas | Text/overlay drag + resize; main pan/fit only |
| Text | Presets + free transform + content edit; add if missing |
| Overlay | Drag/resize; opacity/blend inspector |
| UI chrome | Canvas-first; thin rail polish |
| Talk | Closed schema + better context/prompt; semantic text/transform only |
| Recipe | PathPatch / `validateRecipe` everywhere |
| v1 closed means | I6 falsifiers pass → **pause** |
