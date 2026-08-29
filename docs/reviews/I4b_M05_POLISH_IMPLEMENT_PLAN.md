# I4b — M05 polish implement plan (pack regional + talk regional)

**Branch:** `rewrite/v1-styling`  
**Binding:** `docs/modules/M05_MASKS_AND_REGIONAL_GRADE.md` §6, `docs/reviews/I4_CHANGELOG.md`  
**Goal:** Close I4 **PARK** gaps — pack `regionalDefaults`, talk regional tools, recipe context, Lab `regenerate_mask`.

---

## Slices

| # | Slice | Status | Notes |
|---|-------|--------|-------|
| S1 | Pack `regionalDefaults` + `applyPack` seed | DONE | Optional on pack JSON; intensity lerp same as `mainEffects`; only when `maskRef` present |
| S2 | Talk types + Gemini schema + prompt | DONE | Closed enums; no free PathPatch |
| S3 | `normalize` + `applyTalk` regional | DONE | `set_regional_slider`, `apply_regional_preset`; F5 unit-tested |
| S4 | `buildRecipeContext` regional | DONE | `hasMask` + 4 regional amounts |
| S5 | Lab `regenerate_mask` from talk | DONE | Reuses `onRegenerateMask` after apply |
| S6 | Receipt + tests | DONE | This plan + `I4_CHANGELOG.md` |

---

## Pack `regionalDefaults` (locked)

```json
"regionalDefaults": {
  "subject": [{ "id": "saturation", "params": { "amount": 0.1 } }],
  "background": [
    { "id": "saturation", "params": { "amount": -0.7 } },
    { "id": "fade", "params": { "amount": 0.3 } }
  ]
}
```

- Recipe shape: `regional.subject.effects[]` / `regional.background.effects[]`
- **Intensity:** `scaleEffectsByIntensity` — same lerp as global `mainEffects`
- **No mask:** `applyPack` writes global `effects[]` only; regional untouched
- **Pack with mask:** global + regional seeded; `packId`/`packVersion` set

**Shipped example:** `warm-film.json` only (optional on other packs).

---

## Talk regional tools (locked)

| Tool | Normalize → Apply |
|------|-------------------|
| `set_regional_slider` / `delta_regional_slider` | → `set_regional_slider` → `applyRegionalSlider` |
| `applyRegionalPreset` | `muted_background` \| `subject_pop` → `applyRegionalPreset` |
| `regenerateMask: true` | Pass-through flag; Lab runs client worker |

**Presets:**

| presetId | Sliders set |
|----------|-------------|
| `muted_background` | `bg_mute: -0.85`, `bg_fade: 0.35` |
| `subject_pop` | `subject_pop: 0.4`, `subject_chroma: 0.15` |

**Errors:** Regional tools without `hasMask` → `NO_MASK`. Global talk unchanged.

---

## Manual checks

With portrait + mask ready:

1. “mute the background” → `bg_mute` down / `muted_background` preset
2. “make me pop more” → `subject_pop` up
3. “regenerate the mask” → mask regen runs (talk flag → Regenerate path)
4. Apply `warm-film` pack with mask → regional stacks seeded
5. Talk regional with **no** mask → `NO_MASK`; global sliders still work

---

## Out of scope (unchanged)

- SAM2 / server BiRefNet / remove.bg
- Vision tags in `meta`
- New regional sliders beyond 4
- M06 poster/layout
