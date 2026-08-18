# Prism — Constitution (`02_CONSTITUTION`)

**Status:** governing doctrine (phase 0.1)  
**Date:** 2026-08-18  
**Branch:** `rewrite/v1-styling`  
**Depends on:** `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`  
**Feeds:** module cards, implementation plans, code review criteria

---

## 0. Purpose of this document

This document defines the law Prism must obey between engine design and implementation.

`01_ENGINE.md` names the organs. This constitution defines the rules those organs must live under. It exists to preserve identity, prevent scope drift, and give future work a principled way to say "no."

This is not a product pitch, not an engine anatomy doc, not a module card set, and not permission to reopen settled decisions unless a section here marks them as genuinely open.

---

## 1. Identity

Prism is a **still-image parametric styling engine** with a small lab interface.

Its job is simple:

1. A user uploads a still photo.
2. Prism applies a live, deterministic visual look.
3. Sliders and optional talk both modify the same recipe.
4. Prism exports a truthful PNG and a serializable recipe.
5. The same recipe may also power a quiet hero on an existing site.

Prism is for **appearance control of existing pixels**. It is not for open-ended pixel invention.

Prism is not:

- a Canva clone
- a Photoroom clone
- a Photoshop replacement
- a martech template system
- a background-replacement product
- a beauty-retouch product
- a site builder
- a VJ or time-domain visual instrument
- ADA in image form

Prism occupies the **spatial still-image** lane. It is a sibling to other systems, not a merger of them.

---

## 2. Constitutional truths

The following rules are foundational. Future modules, code, prompts, and reviews MUST preserve them.

1. **One engine.**  
   Lab preview, PNG export, and hero embed are three uses of the same renderer, not three separate systems.

2. **Recipe is the source of truth.**  
   UI state, slider state, talk state, export state, and share state MUST converge on the recipe. Pixels are outputs, not truth.

3. **Parametric appearance only.**  
   Prism operates by bounded transforms on existing image content. If a feature requires invented pixels, it is outside the constitutional lane.

4. **Deterministic GPU math over AI pixel invention.**  
   The renderer performs the look. AI may help choose parameters; it does not author image content.

5. **Fail closed over silent drift.**  
   Invalid patches, unknown ops, schema mismatches, and version drift MUST be rejected loudly, not coerced quietly.

6. **Lab first; hero is reuse.**  
   The lab is the primary proving ground. Hero output is a reuse path of the same recipe and renderer, not a second product lane.

7. **A pack is named craft, not hidden magic.**  
   Packs are composed values over a known registry. They do not justify secret second logic, private render paths, or vague AI taste blobs.

8. **Tier A is the protection zone.**  
   The first shippable loop must remain small, coherent, and truthful. Later ambition MUST NOT consume Tier A before Tier A proves itself.

9. **Prism is a constrained tool, not an infinite editor.**  
   Constraint is part of the product. Refusing off-lane requests is not failure; it is constitutional compliance.

---

## 3. Hard boundaries

Prism MUST NOT become any of the following:

- **No Canva.** No template marketplace, brand-governance suite, autofill system, campaign factory, or enterprise martech surface.
- **No Photoroom clone.** No background replacement, AI relighting product lane, virtual model lane, or object-removal lane.
- **No generative inpaint / outpaint / object invention.** No "put me on a beach," no remove-an-ex, no plausible fill for missing content.
- **No campaign-pack / Jobs API / hidden SaaS backdoor.** Prism does not exist to rebuild Stage, Background Studio, or a production marketing pipeline.
- **No beauty-retouch lane.** No skin smoothing pipeline, face/body reshaping, age filters, or portrait-correction specialization.
- **No second renderer for heroes.** Hero reuse MUST ride the same recipe law and render law as the lab.
- **No infinite Photoshop.** No open layer studio, no healing brush, no content-aware workflows, no sprawling document editor.
- **No sound-visualiser duplication.** No audio-reactive, VJ, or time-domain identity shift.
- **No "AI made the art" fiction.** Prism must not imply that recipe selection is equivalent to pixel synthesis or authored composition.

When a proposal fits one of these categories, the default answer is **no** unless the constitution itself is changed under high scrutiny.

---

## 4. Positive obligations

Prism is constrained, but it still has active duties.

1. **Live preview must feel direct.**  
   The system SHOULD feel like immediate manipulation of a real image, not a slow request/response gimmick.

2. **Exported PNG and recipe must both be truthful outputs.**  
   The PNG is the rendered result. The recipe is the reproducible instruction set. Neither may be a lossy fiction of the other.

3. **Sliders and talk must operate on the same schema.**  
   Natural language is not a parallel editing universe.

4. **Design choices must preserve serializability and replayability.**  
   A look worth making in Prism is a look worth reloading, sharing, diffing, and re-rendering.

5. **The engine must stay small enough to understand.**  
   Complexity must earn its place through coverage, not intrigue.

6. **The product must be honest about what it can and cannot do.**  
   If a user asks for a generative edit, Prism should refuse or redirect, not fake compliance with low-truth approximations.

7. **Packs must expose meaningful semantic control.**  
   A pack is not a dead preset. It should decompose into bounded, legible axes that remain within recipe law.

8. **Preview/export parity must be treated as a discipline, not a marketing sentence.**  
   If parity is unproven, it remains unproven.

---

## 5. Tier law

### 5.1 Tier A is protected

Tier A is the smallest lovable loop and the constitutional baseline for Prism.

Tier A MUST include:

- upload of a still image
- live GPU preview
- a small closed recipe schema
- a small closed op registry
- 3-5 style packs at most
- semantic sliders
- optional single-turn LLM routing to validated patch JSON
- PNG export
- recipe JSON export/share
- the same recipe being usable for a quiet hero

Tier A MUST NOT include:

- masks as a requirement
- poster/layout system as a requirement
- multi-turn agent orchestration as a requirement
- generative APIs
- background replacement
- object removal
- second live image-editing product lanes
- pack marketplaces
- enterprise template logic
- broad layer-management ambitions

Tier A runtime law from `01_ENGINE.md` remains locked:

- one live image layer ships in Tier A
- recipe schema may stay open to `layers[]`, but runtime ships one live photo layer
- raw WebGL2 is the current implementation floor
- preview is display-sized; export is source-sized

### 5.2 Later tiers are allowed, not owed

Tier B may add regional control, masks, and limited poster/layout reuse only if Tier A recipe truth remains intact.

Tier C is research territory. It may study narrow comparisons or deferred experiments, but it does not retroactively define what Prism "really was."

The burden of proof rises by tier. Later-tier possibility MUST NOT be used to smuggle complexity into Tier A.

---

## 6. AI law

AI in Prism is constitutionally subordinate to the recipe and renderer.

The LLM MAY:

- classify intent
- choose a pack
- emit bounded parameter deltas
- emit validated patch JSON on a closed schema
- use prior recipe context to refine an existing look

The LLM MUST NOT:

- author pixels
- invent new operations
- emit free-form shader code
- become a second source of truth
- bypass validation
- hide uncertainty behind plausible prose

AI outputs MUST be:

- human-visible
- schema-bounded
- version-aware
- rejectable

If AI fails, Prism MUST degrade to sliders and manual control, not collapse the editing model.

AI is a **router**, never the renderer, never the recipe authority, and never the product identity.

---

## 7. Engine law

This section is the constitutional reading of `01_ENGINE.md`. It governs interpretation without duplicating internals.

1. **Raw WebGL2 is the current constitutional floor.**  
   Future ports may happen later, but v1 law is grounded in the current WebGL2 engine path.

2. **One live image layer in Tier A is law.**  
   Schema openness does not grant immediate runtime expansion.

3. **The op registry is closed.**  
   Prism may expand by deliberate admission of new ops, not by turning the recipe into open text or arbitrary code.

4. **The initial op set must stay minimal.**  
   Packs should extract range from composition of a few strong ops before new ops are added.

5. **Hybrid pass architecture is law.**  
   Prism uses the honest render strategy required by the math, not a maximal pass rack and not fake single-pass shortcuts when prior-result sampling is needed.

6. **Display-sized preview and source-sized export are law.**  
   Preview and export may differ in render target size, not in recipe semantics.

7. **Invalid patches must be rejected loudly.**  
   Prism must prefer refusal to silent reinterpretation.

8. **Images are not embedded in the recipe.**  
   The recipe describes the look, not the asset payload.

9. **Hero is constitutional reuse, not engine fork.**  
   If a hero requires a separate shader tree or product model, it violates one-engine law.

---

## 8. Admission test for new features or modules

A proposed addition is valid only if it can survive all of the following questions.

1. **Does it preserve recipe truth?**  
   If the feature cannot be faithfully represented, serialized, and replayed through the recipe, it does not belong.

2. **Does it stay parametric?**  
   If it needs invented pixels or semantic image synthesis, it is outside Prism.

3. **Does it fit one engine?**  
   If it demands a second renderer, second export truth, or special-case hero path, it fails.

4. **Does it belong in Tier A, or is it later-tier work?**  
   If it enlarges Tier A without protecting the smallest lovable loop, it should be deferred.

5. **Does it respect the closed registry?**  
   If it requires vague "AI style magic" rather than named ops and bounded parameters, it fails.

6. **Does it increase expressive coverage honestly?**  
   New ops should earn their keep by covering real prompt/pack needs that existing ops cannot represent cleanly.

7. **Does it keep sliders and talk aligned?**  
   If only one control path can use it, scrutiny increases immediately.

8. **Does it create a hidden second product?**  
   If the module quietly introduces a template engine, campaign system, beauty app, or generative editor, it fails even if technically elegant.

9. **Can Prism refuse misuse clearly after this addition?**  
   If the feature blurs refusal boundaries and makes off-mission requests harder to reject, it is probably a bad fit.

Passing one or two questions is not enough. Constitutional admission requires a coherent yes across the set.

---

## 9. Refusal test

Kill a feature quickly if any of the following is true:

- it requires invented pixels
- it requires a second renderer or separate truth model
- it turns the recipe into vague UI state
- it exists mainly to rebuild Stage, Background Studio, or campaign automation
- it expands Tier A before Tier A is proven
- it adds ops without clear expressive necessity
- it creates a beauty-retouch, Canva, Photoshop, or Photoroom lane
- it makes AI harder to validate or easier to trust blindly

If a proposal fails this checklist, Prism should refuse it without apology.

---

## 10. Decision rights

Not all changes require the same scrutiny.

### Low scrutiny

- pack values
- default slider ranges
- prompt wording
- UI naming that does not alter recipe meaning
- non-semantic implementation cleanup

### Medium scrutiny

- new ops within the same parametric lane
- validator rule refinements
- pack decomposition changes
- additional Tier B mask pathways
- share/export contract details that preserve recipe truth

### High scrutiny

- second renderer of any kind
- generative editing of any kind
- product-lane shifts toward templates, martech, or document editing
- broad layer expansion in Tier A
- AI authority increases
- recipe contract weakening
- changes that compromise preview/export truth
- any reopening of the parametric-only boundary

The higher the scrutiny, the stronger the burden to show constitutional fit rather than local convenience.

---

## 11. Failure modes to guard against

Prism is especially vulnerable to the following forms of drift:

1. **Rebuilding Stage under new names.**  
   Campaign logic, Jobs API logic, template operations, and enterprise production surfaces can re-enter disguised as "just one more module."

2. **Becoming an AI gimmick.**  
   If the language layer becomes the product story, Prism loses its real identity as a deterministic appearance engine.

3. **Turning the recipe into vague UI state.**  
   Hidden derived fields, untracked view state, or export-only adjustments erode replayability.

4. **Adding ops faster than they earn their keep.**  
   Registry sprawl creates a fake sense of power while weakening packs, validation, and learnability.

5. **Pretending preview/export parity without proof.**  
   Similar-looking output is not constitutional truth if the paths diverge materially.

6. **Letting later-tier dreams govern current code.**  
   Designing everything for hypothetical layers, masks, posters, or future ports can bury the living core before it exists.

7. **Confusing hero reuse with a web-product platform.**  
   Hero is a reuse path for the same renderer, not a justification for a site-builder surface.

8. **Using "research" to launder scope.**  
   Comparative experiments are acceptable; sneaking off-mission features into the mainline is not.

---

## 12. Open constitutional questions

Only a few constitutional questions remain genuinely open at this stage.

1. **How much device compatibility is required before v1 is considered honest?**  
   `01_ENGINE.md` leaves the exact iOS/WebGL2 floor open.

2. **Which patch transport is best while preserving fail-closed behavior?**  
   The constitution requires validated patching, but the exact transport form is still open.

3. **When do masks graduate from deferred Tier B work to required capability?**  
   This depends on whether regional control proves materially better than global-only looks.

4. **How far should display-referred grading remain the default before a stronger color-management story is necessary?**  
   The current v1 floor is clear; the long-term color model is not yet settled.

These are real open questions because they affect implementation policy without changing Prism's identity. They do not reopen the hard boundary against generative editing or the one-engine rule.

---

## 13. Appendix: short doctrine summary

Prism is a constrained still-image styling engine.

It takes a real photo, applies deterministic parametric look math, and exports both image and recipe truth. The recipe is law. The GPU does the rendering. AI may route intent to bounded patches, but AI is never the pixel author and never the source of truth.

Prism has one engine, not three. Lab, export, and hero are reuse paths of the same machine. Tier A is protected: one live image layer, small closed op set, small pack set, live preview, optional talk, recipe export, PNG export. No generative editing, no beauty retouch, no campaign factory, no Canva, no Photoroom, no infinite Photoshop.

When in doubt, ask:

1. Does it preserve recipe truth?
2. Does it stay parametric?
3. Does it fit one engine?
4. Does it protect Tier A?
5. Does it avoid creating a second hidden product?

If not, Prism should refuse it.

---

Operator next: review the constitutional truths, hard boundaries, tier law, and admission test before module cards or implementation.
