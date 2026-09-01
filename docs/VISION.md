# Prism — border vision (draft)

**Status:** v1 shipped on `rewrite/v1-styling` — see [`STATUS.md`](STATUS.md).

A personal **lab + sometimes-used tool** for still-image **parametric** looks (image-as-matrix math on the GPU). Built for Aryan. Frequency: sometimes — ADA is the daily system.

Blank-slate redesign on `rewrite/v1-styling`.
Portfolio/factory code remains on `main`. Never force-rewrite `main`.

**North star:** upload a photo → live grade → sliders + optional talk → export PNG + a serializable recipe (including a quiet WebGL hero on sites I already have).

**Two doors, one engine:** lab | recipe/hero export.

- **Lab** — live preview; sliders and talk (“more grain / duskier / that pack”) change the **recipe**, not the pixels.
- **Export** — PNG + recipe JSON; the same recipe can sit behind HTML as a hero. Heroes are a *use*, not a site-builder product.

Constraints for later engine brainstorm (soft):

- LLM is a small router: intent → validated JSON patch on a closed schema. GPU does the math. No pixels in the prompt. Talk and sliders write the same recipe.
- Not an Instagram editor, a frontend agency, or “AI builds whole websites.”
- Parametric appearance only — not Canva, martech, campaign packs, a Jobs API for imaginary modules, Photoshop, generative inpaint, background replace, or beauty retouch.
- Not a sound-visualiser (time/VJ) and not ADA (embodied agent). Siblings; don’t duplicate.
- No neural shading or training models as v1.
- Don’t ship something I wouldn’t open myself. GitHub alone is not the reason to build.
- Process: this file → `00` field (done) → `01` engine → `02` constitution → module cards → code. Old shader/recipe ideas may return only after `01` names organs — not here.

**Feeds:** `01_ENGINE.md`

Done when this file can be read in under a minute and would stop someone from rebuilding Stage or Photoroom.
