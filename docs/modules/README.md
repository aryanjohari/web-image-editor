# Prism modules (M00–M07)

Research cards gate implementation — each module has a decision log and operator summary. Implementation receipts live in [`docs/reviews/`](../reviews/) (I0–I6).

| Module | Purpose | Receipt |
|--------|---------|---------|
| [M00 — Compositor](M00_COMPOSITOR.md) | WebGL2 renderer; 1 main + 1 overlay + 1 text; recipe → uniforms | [I0](../reviews/I0_CHANGELOG.md) |
| [M01 — Recipe schema](M01_RECIPE_SCHEMA.md) | Typed recipe, PathPatch, validate, fail closed | [I0](../reviews/I0_CHANGELOG.md) |
| [M02 — Packs & sliders](M02_PACKS_AND_SLIDERS.md) | Named craft packs; semantic sliders over closed effect registry | [I1](../reviews/I1_CHANGELOG.md) |
| [M03 — Talk router](M03_TALK_ROUTER.md) | Gemini structured JSON → same pack/slider helpers | [I3](../reviews/I3_CHANGELOG.md) |
| [M04 — Export](M04_EXPORT.md) | PNG FBO readback; recipe JSON; `#r=` hash; hero-lite `/hero` | [I2](../reviews/I2_CHANGELOG.md) |
| [M05 — Masks & regional grade](M05_MASKS_AND_REGIONAL_GRADE.md) | MediaPipe person mask; subject/background grade split | [I4](../reviews/I4_CHANGELOG.md) |
| [M06 — Look library & poster craft](M06_LOOK_LIBRARY_AND_POSTER_CRAFT.md) | 8 packs; blur ping-pong; minimal text layout | [I5](../reviews/I5_CHANGELOG.md) |
| [M07 — Lab UX & canvas control](M07_LAB_UX_AND_CANVAS_CONTROL.md) | Canvas overlay; drag/resize text; inspector; talk nudges | [I6](../reviews/I6_CHANGELOG.md) |

North star: [`VISION.md`](../VISION.md) · Constitution: [`02_CONSTITUTION.md`](../02_CONSTITUTION.md) · v1 status: [`STATUS.md`](../STATUS.md).
