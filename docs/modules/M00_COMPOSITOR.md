# M00 — Compositor

**Status:** research card / design note  
**Date:** 2026-08-20  
**Depends on:** `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`, `02_CONSTITUTION.md`  
**Purpose:** Decide what a renderable object is in Prism, how object/layer data should live in the recipe, and which GPU architecture keeps Tier A small while leaving a truthful growth path toward richer stacked compositions and hero reuse.

---

## 0. Question of this module

How should Prism compose still-image looks when its present runtime is intentionally small, but its recipe must already be future-safe?

The exact tension is constitutional:

- Tier A must stay stable and understandable.
- Tier A now needs to cover **one main image**, **one overlay**, and **one text layer**.
- The schema must still be object-based from day one so Prism does not have to invent a second document model when it later supports multiple images, multiple text objects, or mask-driven regional work.

This card decides the compositor organ only: object semantics, recipe representation, GPU combine model, Tier A caps, and the render architecture choice between fixed-slot single-pass, ping-pong multi-pass, post-processing graph, or hybrid.

---

## 1. Why compositor matters in Prism

Prism’s product claim is not “AI edits photos.” Its real claim is narrower and more technical: a recipe can deterministically produce the same live preview, export PNG, and quiet hero background. That promise lives or dies in the compositor.

If the compositor is too fixed, hero backgrounds stay fast but the recipe becomes a disguised set of hardcoded uniforms. If the compositor is too graph-heavy, Tier A turns into an editor framework before it proves the core loop. Because Prism exports both pixels and recipe truth, the compositor is the place where object order, alpha handling, blend math, transforms, masks, and render targets stop being UI ideas and become machine law.

---

## 2. What a layer/object means here

Prism should distinguish **object** from **layer**:

- An **object** is the recipe-level entity: an image object, text object, or later a shape/fill/mask object. It is what the user means when they add or edit something in the scene.
- A **layer** is the compositor’s renderable unit after normalization: a textured quad with transform, opacity, blend behavior, and an optional local effect chain.

That distinction keeps the recipe future-safe. A text object may later rasterize to a texture atlas; a mask object may later compile to a weight texture; a fill object may be shader-generated. They are all objects in the document model even if the compositor ultimately flattens them into renderable layers.

For Prism v1, the useful shared object contract is:

- `id`, `kind`, `z`, `visible`
- `opacity`
- `blend`
- `transform` (`x`, `y`, `scaleX`, `scaleY`, `rotation`)
- `crop` / `fit`
- `maskRef?`
- `effects[]`

Tier A should support only these active object kinds:

1. `image` with role `main`  
2. `image` with role `overlay`  
3. `text`

Important constitutional reading: this does **not** reopen “many live image layers” in Tier A. It keeps the single primary photo law while allowing one bounded overlay object and one bounded text object as compositor participants, not a general document editor.

---

## 3. Research map

### Compositing math

Porter and Duff’s compositing algebra remains the correct foundation for stacked image objects, especially `source-over`, `in`, `out`, and `atop` when masks or clipped overlays eventually arrive ([Porter & Duff 1984](https://doi.org/10.1145/800031.808606); [W3C Compositing and Blending Level 1](https://www.w3.org/TR/compositing-1/)). The common case for Prism is still `source-over`.

Premultiplied alpha is the safer working representation for GPU compositing because it avoids fringe artifacts at filtered edges and gives simpler Porter-Duff equations in intermediate buffers ([W3C](https://www.w3.org/TR/compositing-1/); [WebGL alpha notes](https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html); [Ciechanowski](https://ciechanow.ski/alpha-compositing/)). For Prism, this matters the moment overlay PNGs and text glyph textures enter the stack.

Blend modes must be treated separately from coverage compositing. W3C formalizes this split: blend math changes overlapping color interaction, then Porter-Duff determines coverage composition ([W3C](https://www.w3.org/TR/compositing-1/)). For Prism, the relevant early set is small: `normal`, `multiply`, `screen`, `overlay`. These cover most editorial overlays and poster-ish looks without dragging in the full Photoshop matrix.

Per-object opacity and 2D transforms are first-class compositor data, not pack metadata. They affect scene assembly, z-order, and export truth. Masking matters, but Tier A should treat masks as **referenced weight textures**, not as a user-facing layer type yet; FILTR’s mask-group model is the cleaner precedent here than inventing a fake “mask image layer” abstraction too early ([FILTR](https://antlii.work/WIP-Tool)).

### GPU architecture patterns

The field splits four ways:

1. **Single-pass fixed-slot shader**  
   Fastest path when the stack is tiny and mostly pointwise. The legacy Prism `main` code and many hero effects fall into this pattern. Shaddy shows the extreme version: compile an ordered card list into one fragment shader and redraw a fullscreen quad ([Shaddy](https://devpost.com/software/shaddy)).

2. **Ping-pong framebuffer compositor**  
   The honest choice when passes depend on prior results or neighborhood sampling. three.js `EffectComposer` is the canonical didactic example: two render targets swap as each pass reads prior output and writes next output ([three.js manual](https://threejs.org/manual/en/post-processing.html)). FILTR explicitly adopts the same two-FBO ping-pong design.

3. **Effect graph / post-processing framework**  
   Flexible and legible, but usually heavier than Prism Tier A needs. `EffectComposer` is excellent for scene post-processing; it is less compelling as the core of a still-image lab whose main work is 2D quad compositing, not a 3D renderer plus dozens of passes.

4. **Hybrid**  
   Keep a fast single-shader path for the bounded common case, but let the runtime promote a layer or the frame to ping-pong when the math requires it. `kampos` points in this direction: lightweight effect arrays for common cases, optional FBO use for more complex effects ([kampos](https://github.com/wix-incubator/kampos); [Wix engineering](https://www.wix.engineering/post/introducing-kampos-a-tiny-and-fast-effects-compositor)). VideoFlow shows the value of ordered per-layer `effects[]` even when the execution model becomes sequential ([VideoFlow](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)).

### Real-world tools

- **Lumen** argues for a dirty-flagged, modular still-image stack rather than an always-running animation toy ([Lumen](https://legenki.com/lumen/)).
- **FILTR** is the clearest argument for ping-pong when the stack is truly pass-oriented and maskable.
- **kampos** is evidence that a tiny WebGL compositor with ordered effect arrays can stay understandable if the abstraction stays close to textured quads and GLSL snippets.
- **VideoFlow** is useful for the JSON lesson: `effects[]` order is part of the authored look, and the same stack should survive different output resolutions.
- **Shaddy** proves the ergonomic and performance upside of “compile many pointwise ops into one shader,” but its own write-up also exposes the costs: recompilation burden, mobile pressure, and extra FBO cost once you want many intermediates or visualized steps.

---

## 4. Architecture options

### Option A — Single-pass fixed-slot shader

**Model:** hardcode `mainImage`, `overlay`, and `text` slots into one fragment program; each slot has uniforms for transform, opacity, blend, and a small local effect set.

**Pros**

- Best hero-mode overhead.
- Few draw calls and no intermediate framebuffers in the simplest case.
- Easier export parity because there is one kernel to reason about.

**Cons**

- Recipe truth starts lying once objects exceed the baked slots.
- Adding later image or text objects means reopening shader structure, uniform packing, and validation.
- Per-object effect growth becomes awkward fast; pointwise effects are tolerable, neighborhood effects are not.

**Verdict:** too rigid as the primary architecture. Good as a fast path, weak as the whole compositor.

### Option B — Ordered ping-pong pass stack

**Model:** every object effect and every composite step is an ordered pass; source and destination FBOs swap throughout the frame.

**Pros**

- Honest for blur, sharpen, displacement-from-prior-result, bloom, and any “read previous output” math.
- Natural fit for unbounded `objects[]` and later masks.
- Debuggable because each pass is explicit.

**Cons**

- Too much overhead for quiet hero backgrounds and simple lab grades.
- More framebuffer churn, more texture binds, and more pass bookkeeping.
- Easy for a solo-dev v1 to turn into infrastructure before aesthetic coverage is proven.

**Verdict:** correct as an escalation path, too heavy as the default Tier A loop.

### Option C — EffectComposer / graph-first runtime

**Model:** Prism becomes a mini node graph or general pass framework from the start.

**Pros**

- Maximum flexibility and inspectability.
- Easy future fit for many effects and object kinds.

**Cons**

- Over-build for a still-photo product whose near-term scene grammar is tiny.
- Pushes Prism toward editor-platform shape rather than constrained engine shape.
- Higher implementation and debugging tax than the product needs in v1.

**Verdict:** reject for v1 core. Useful as reference material, not as the organ to ship.

### Option D — Hybrid: object-based schema + bounded Tier A fast path + promoted multi-pass when needed

**Model:** keep `objects[]` unbounded in the recipe, normalize supported objects into render layers, and render them through:

- a **Tier A fast path** for main image + overlay + text using a small number of textured-quad draws and shader variants
- a **promotion path** to ping-pong FBO passes when a layer or stack introduces neighborhood or prior-result dependencies

**Pros**

- Preserves hero speed and small-engine clarity.
- Keeps the schema truthful from day one.
- Lets future poster stacks grow without inventing a second recipe language.
- Matches the actual math: do not pay multi-pass cost unless required.

**Cons**

- More branching in the renderer than pure fixed-slot or pure graph.
- Requires a clear rule for when a recipe remains Tier A-compatible versus merely schema-valid.
- Demands disciplined validator behavior so unsupported active objects are not silently dropped.

**Verdict:** best fit for Prism.

---

## 5. Recommended direction

Prism should adopt **Option D: hybrid compositor architecture**.

The decisive move is:

- **Schema:** object-based and future-safe now
- **Runtime:** intentionally capped now
- **Execution:** fast path first, multi-pass only when the math requires it

Concretely:

1. The recipe owns an ordered `objects[]` list with shared transform/composite fields.
2. Tier A runtime validates that only one `main` image, one `overlay` image, and one `text` object are active.
3. The renderer draws these in z-order as textured quads with premultiplied-alpha compositing and a small closed blend-mode set.
4. Object-local pointwise effects may compile into the object shader variant; neighborhood effects are deferred or promote that object/frame to ping-pong later tiers.

This resolves the central tension honestly. Prism does **not** pretend the current runtime is already a poster engine. But it also does **not** trap itself in a fixed-slot schema that will force a painful recipe migration the first time a second image or second text object becomes real.

---

## 6. Tier A runtime proposal

### Exactly what renders now

Tier A compositor support:

1. **Main image object**  
   One uploaded photo; full-canvas base source.

2. **Overlay image object**  
   One optional RGBA image/decal/texture above the main image; independent transform, crop/fit, opacity, and blend.

3. **Text object**  
   One optional text layer, rasterized to a texture before compositing; independent transform, opacity, and blend.

### Caps

- Max active `image(role=main)`: **1**
- Max active `image(role=overlay)`: **1**
- Max active `text`: **1**
- Max active masks: **0 required** in Tier A
- Max active neighborhood passes: **0** in Tier A default path
- Blend modes: `normal`, `multiply`, `screen`, `overlay`

### Why

This cap set gives Prism enough scene structure for both doors:

- **Hero speed:** main image plus a light overlay or text is enough for quiet branded backgrounds.
- **Poster flexibility:** one overlay plus one text object allows real composition experiments without pretending to be Canva.

It also keeps the constitutional protection zone intact. The runtime is still tiny enough to understand, benchmark, and export truthfully.

---

## 7. Schema-growth proposal

The recipe should already be object-based:

```text
Recipe {
  schemaVersion
  packVersion
  canvas?
  objects: Object[]
}

Object {
  id
  kind: "image" | "text" | later
  role?: "main" | "overlay" | later
  z
  visible
  opacity
  blend
  transform { x, y, scaleX, scaleY, rotation }
  crop? { x, y, width, height, fit }
  maskRef?
  effects: Effect[]
  source: ...
}
```

### How this supports later growth

- Multiple image layers later means more `image` objects, not a new schema.
- Multiple text layers later means more `text` objects, not a special text subsystem bolted on top.
- More first-class entities later can arrive as new `kind`s: `fill`, `shape`, `mask`, `group`, `adjustment`.

### What is parsed now vs ignored now

Prism should **parse** the whole object list structurally now, but it should not silently render unsupported active objects.

Recommended rule:

- **Parsed and renderable now:** `image(main)`, `image(overlay)`, `text`
- **Parsed but non-renderable now:** future-safe fields like richer typography properties, future mask metadata, unused object metadata
- **Rejected loudly now:** active unsupported object kinds, unsupported active object counts, or active effects that require a render mode Prism has not admitted yet

This preserves future schema continuity without violating the fail-closed law from `02_CONSTITUTION.md`.

---

## 8. Data path / render loop

### CPU document path

1. Load recipe JSON.
2. Normalize `objects[]` into a sorted render list.
3. Validate Tier A caps and active effect admissibility.
4. Rasterize text object to an atlas/bitmap texture when text changes.
5. Upload or reuse image/overlay/text textures.

### GPU path

For Tier A fast path:

1. Bind target framebuffer: preview canvas or export FBO.
2. Clear once.
3. Draw main image quad with its local pointwise effects.
4. Draw overlay quad with premultiplied-alpha `source-over` plus selected blend mode.
5. Draw text quad the same way.
6. Present or read back.

For later promoted path:

1. If an active effect requires prior-result sampling or neighborhood filtering, allocate/reuse ping-pong FBOs.
2. Run the affected layer/frame through ordered passes.
3. Composite final object outputs in z-order into the target.

### Why this shape is feasible in solo-dev WebGL2 v1

- **Texture uploads:** three active Tier A textures is trivial compared with a general editor. The real cost is upload-on-change, so text should re-rasterize only when content/style changes, not every frame.
- **Framebuffer count:** Tier A can stay at zero extra preview FBOs in the simplest case and one export FBO for PNG truth. Later pass promotion can start with just two ping-pong targets.
- **Render target resolution:** preview should stay display-sized, export source-sized, exactly as `01_ENGINE.md` already locks.
- **Draw-call vs pass-count tradeoff:** three quad draws are cheap; many full-frame passes are not. Hero mode benefits more from minimizing pass count than from over-abstracting the document model.

For solo-dev WebGL2 v1, this is the feasible line: a small quad compositor with optional ping-pong escalation, not a full graph runtime and not a fake “everything in one shader forever” bet.

---

## 9. Open questions / falsifiers

These questions should be answered by implementation or small prototypes, not vibes.

1. **Does one overlay + one text object materially increase expressive coverage without destabilizing Tier A?**  
   Falsifier: most successful looks still use only the main image, making extra object machinery premature.

2. **Can text-as-texture stay sharp enough across preview and export without introducing a second typography engine?**  
   Falsifier: export parity or scaling quality is poor enough that DOM/canvas text and GPU text diverge visibly.

3. **When do local effects force pass promotion in practice?**  
   Falsifier: even “small” overlay/text looks immediately demand blur/bloom/shadow chains, making the fast path too narrow.

4. **Is Tier A better represented as object shaders plus z-composite, or should even the overlay/text path be flattened into one compiled fragment program?**  
   Falsifier: program switching and multiple quad draws are measurably worse than a bounded compiled uber-shader on target devices.

5. **Do masks remain texture references, or does Prism later need mask objects/groups?**  
   Falsifier: regional editing and poster composition both want reusable mask entities rather than one-off weight textures.

---

## 10. Won’t chase

- Full Photoshop-style layer studio
- Arbitrary node graph editor as v1 product surface
- Mask layers as a public Tier A document primitive
- Per-object blur/shadow/bloom racks in Tier A
- Nested groups, clipping groups, or adjustment layers in Tier A
- Generative compositing, inpaint, background replacement, or invented pixels
- Rebuilding Stage/Canva poster tooling under “overlay system” language

---

## 11. Decision log

| # | Topic | Decision | Why |
|---|-------|----------|-----|
| C1 | Recipe model | Use ordered `objects[]`, not fixed slot fields | Future-safe for multiple image/text objects without schema migration |
| C2 | Object vs layer | Objects are recipe entities; layers are normalized render units | Keeps text, masks, and future kinds first-class without overloading compositor internals |
| C3 | Tier A active objects | Support exactly 1 main image + 1 overlay + 1 text | Covers hero and simple poster compositions while keeping Tier A bounded |
| C4 | Alpha policy | Use premultiplied alpha in working buffers | Correct Porter-Duff math and safer filtered edges |
| C5 | Blend policy | Tier A blend set = `normal`, `multiply`, `screen`, `overlay` | Good editorial coverage without full Photoshop surface |
| C6 | Mask policy | Masks are referenced textures later, not Tier A layer kinds | Cleaner growth path and less document-model sprawl |
| C7 | Architecture | Hybrid fast path + optional ping-pong promotion | Matches hero-speed needs and future stack honesty |
| C8 | Validation | Parse all objects structurally; reject unsupported active ones loudly | Future-safe schema without silent look drift |
| C9 | Text handling | Treat text as an object, rasterized to texture before composite | Keeps one compositor while avoiding a second render truth |
| C10 | Growth path | Add later image/text objects by relaxing caps, not by changing schema | Keeps the current module’s decision falsifiable and extensible |

---

## 12. References

- Porter, T., Duff, T. *Compositing Digital Images* (1984) — [DOI 10.1145/800031.808606](https://doi.org/10.1145/800031.808606)
- W3C, *Compositing and Blending Level 1* — [spec](https://www.w3.org/TR/compositing-1/)
- Bartosz Ciechanowski, *Alpha Compositing* — [essay](https://ciechanow.ski/alpha-compositing/)
- WebGL Fundamentals, *WebGL and Alpha* — [guide](https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html)
- three.js manual, *Post Processing / EffectComposer* — [manual](https://threejs.org/manual/en/post-processing.html)
- FILTR (Antlii WIP) — [project notes](https://antlii.work/WIP-Tool)
- Lumen — [project](https://legenki.com/lumen/)
- kampos — [GitHub](https://github.com/wix-incubator/kampos)
- Wix Engineering, *Introducing Kampos - A Tiny and Fast Effects Compositor* — [article](https://www.wix.engineering/post/introducing-kampos-a-tiny-and-fast-effects-compositor)
- VideoFlow, *Cinematic GLSL Effect Stacking* — [article](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)
- Shaddy — [Devpost](https://devpost.com/software/shaddy)
- In-repo context: `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`, `02_CONSTITUTION.md`
