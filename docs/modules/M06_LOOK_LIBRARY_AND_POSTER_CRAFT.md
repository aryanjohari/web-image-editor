# M06 — Look Library & Poster Craft

**Status:** research card  
**Date:** 2026-09-01  
**Depends on:** `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`, `02_CONSTITUTION.md`, `M00`–`M05`, `I0`–`I4b` changelogs, shipped packs (`src/packs/*.json`), `sliders.ts`, `regionalSliders.ts`, `effectsRegistry.ts`  
**Purpose:** Close Prism **v1** as a craft product people would *show* — reverse-engineer trending still/poster/album language into a **closed pack + effect + slider** system — so I5 implements craft and a thin UI polish can stop. Not Canva, not Photoroom, not infinite presets.

---

## 0. Question

What **named looks** make Prism screenshot-worthy, what **ops** they require, and how the lab becomes **pack → few knobs → optional regional/text** — without freeform effect shopping?

1. **Trend map:** which 2024–2026 still/cover languages are real (cited) vs generative hype?
2. **Style inventory:** reverse-engineer keepable styles into packs/params/falsifiers.
3. **Op gap:** ≤3–5 new ops max; refuse niche-only / generative.
4. **Catalog:** closed size (expand current 3); families; axes; regionalDefaults.
5. **Lab loop:** pack-first UX law; talk over same axes; add/remove effects?
6. **Poster/layout:** minimal type in v1, or PARK?
7. **v1 closed:** falsifiable demo checklist → I5 → UI polish → **pause**.

Constitutional locks bind this card: recipe truth; PathPatch; talk≡sliders; one engine; no inpaint; masks = weight textures (M05); one person mask; closed registry; packs = composed values; no campaign/Canva/Jobs API (`VISION`; `02` §1–2; `00` §7).

---

## 1. Why craft now (close v1)

Tier A–B shipped the **machine**: compositor, 3 packs, semantic sliders, talk router, export, person regional grade ([`I0`](../reviews/I0_CHANGELOG.md)–[`I4b`](../reviews/I4b_M05_POLISH_IMPLEMENT_PLAN.md)). Output craft lags infrastructure — warm film + B&W + poster punch alone feels thin next to what people actually screenshot (`00` RQ2: editorial / retro / film / CI poster coverage).

M06 is the **v1 craft constitution**. After it: implement craft (**I5**) → light UI pass → **pause project** (user intent). Thesis stays: parametric GPU DSL + optional talk + one person mask — **showable looks**, not more sliders for their own sake.

---

## 2. Research map — trends (A)

Map of **what people use**, not vibes. Lens: **FEASIBLE** = parametric grade / mask / light type in Prism lane; **HYPE** = generative lighting invention, fill, or out-of-lane.

### A.1 Instagram / TikTok still treatments

| Cluster | Visual recipe (plain) | Evidence | Prism lens |
|---------|----------------------|----------|------------|
| **Lofi Dusk / Y2K grain night** | Warm skin, deep muted bg, heavy grain, soft flash feel, shallow bg | [Analytics Insight](https://www.analyticsinsight.net/news/lofi-dusk-instagram-trend-how-to-create-viral-ai-portraits); [Mathrubhumi](https://english.mathrubhumi.com/technology/how-to-create-lofi-dusk-filter-using-chatgpt-prompts-nj5afyk1); Instagram’s own AI filter wave | **FEASIBLE** grade+grain+vignette+regional mute; rim/bloom/halation = **HYPE** (invented light) |
| **Brat / direct flash / disposable** | Harsh contrast, blown highlights, deep shadows, punchy chroma, party grit | [Aesthetics of Photography](https://aestheticsofphotography.com/the-brat-aesthetic-and-flash-photography-revival-how-gen-z-is-bringing-back-on-camera-flash/); [SLR Lounge editorial raw flash](https://www.slrlounge.com/mastering-editorial-raw-flash/); [ZillaBooth paparazzi](https://www.zillabooth.com/direct-flash-is-back-how-to-nail-the-paparazzi-aesthetic-with-your-iphone/) | **FEASIBLE** exposure/contrast/sat/grain (simulate *look*, not fire a flash) |
| **Muted bg / subject pop portraits** | Keep subject chroma; crush/desat background | `00` RQ1; M05 regional; muted-color editorial language ([Colorcinch muted](https://www.cartoonize.net/muted-colors-filter/)) | **FEASIBLE** — already Tier B path |
| **Clean editorial** | Soft contrast, mild desat, crushed shadows, magazine calm | Editorial brand/portrait language ([Ceyla editorial](https://ceyla.ai/ai-editorial-photos) describes the *look goals*; Prism refuses the generative path) | **FEASIBLE** subtle global grade |
| **Y2K chrome / gloss** | Saturated cools, high contrast, “chrome” surfaces | Album Y2K revival ([VC Maker 2025](https://visualcovermaker.com/blog/album-cover-design-trends-2025)) | **FEASIBLE** cool temp + chroma punch; true chrome/holographic materials = **HYPE** |

### A.2 Album covers / single art

| Cluster | Recipe | Evidence | Lens |
|---------|--------|----------|------|
| **Duotone / two-color map** | Luma → two brand colors | [Duotone design guide](https://www.grayscaleimage.org/posts/duotone-design-guide) (Spotify-era persistence); shipped `poster-punch` | **FEASIBLE** (`duotone`) |
| **Typography-led / bold minimal** | Oversized type, limited palette, negative space | [Premade Pixels bold type](https://www.premadepixels.com/the-future-of-album-cover-art); [VC Maker minimalist typography](https://visualcovermaker.com/blog/album-cover-design-trends-2025) | **FEASIBLE** with **minimal text** (schema already ≤1 text — M01) |
| **Halftone / screen-print grit** | Dot screen + limited color | Envato music-poster bitmap tutorials ([Tuts+](https://design.tutsplus.com/tutorials/how-to-create-a-music-poster-using-the-bitmap-mode-in-photoshop--cms-31520)); `01` §6.3 `halftone` = L | **PARK op** — approximate with grain+duotone for v1 |
| **Collage / painted maximalism** | Layered invented imagery | [Creative Review best sleeves 2025](https://www.creativereview.co.uk/the-best-album-art-and-design-of-the-year-2025/) | **HYPE / out of lane** (pixel invention) |

### A.3 Music promo / poster / flyer

| Cluster | Recipe | Evidence | Lens |
|---------|--------|----------|------|
| **High-contrast + spot color** | B&W or crush + one punch hue; bold type | [Behance Design Trends 2025](https://www.behance.net/gallery/209674381/Design-Trends-2025); [Envato 2025 styles](https://elements.envato.com/learn/trending-graphic-design) (mono wash + type) | **FEASIBLE** contrast/duotone + text |
| **Chromatic “feel”** | RGB fringe / glitch promo | Common in MV stills moodboards | **PARK** true aberration; optional cheap UV R/B shift later if ≥2 packs need it |
| **Motion poster** | Looping motion | Behance 2025 motion posters | **Won’t chase** (time/VJ — `VISION`) |

### A.4 Designer tools — how presets decompose

| Source | Pattern | Lesson for Prism |
|--------|---------|------------------|
| **VSCO Pro** | Preset first → Strength / Contrast / Color / Tone ([VSCO Pro](https://www.vsco.co/features/photo-filters/pro-presets); [Full Spectrum](https://vsco.co/vsco/journal/full-spectrum)) | **Pack-first**, 4–8 semantic axes — not one slider per uniform |
| **VSCO Film X** | Character/warmth + **separate** grain ([Imaging Lab](https://eng.vsco.co/vsco-film-x-&-the-imaging-lab/); `00` D6) | Film = grade + texture ops; LUT alone fails (`01` §2.2) |
| **Lightroom presets** | Parametric XMP stacks; AI masks separate | Pack = params; mask = weight ref (M05) |
| **Capture One Styles** | Styles as stacked adjustments; layer/opacity control ([FilterGrade Styles vs Presets](https://filtergrade.com/lightroom-presets-vs-capture-one-styles-which-is-right-for-your-workflow/)) | Prefer **few axes + regional stacks**, not pro layer UI |

**Won’t chase from research:** Lofi Dusk AI prompts that invent rim light/bloom; glassmorphism generators; collage-max sleeves; 200+ VSCO preset catalogs as product identity.

---

## 3. Style inventory — reverse-engineer (B)

### 3.1 Keep / ship table

```text
Style id        | Visual intent                         | Mask? | Blur? | Global params                    | Regional params          | Text?     | Tier
----------------|---------------------------------------|-------|-------|----------------------------------|--------------------------|-----------|------------------
warm-film       | Scanner warmth, soft blacks, grain    | opt   | no    | temp+, fade, grain, vignette     | mute bg optional         | no        | B-ready now
dusk-grain      | Moody dusk / lofi grade (no bloom)    | yes   | yes   | warmth, fade, grain+, vignette   | bg_mute, bg_blur         | no        | needs blur
flash-raw       | Brat / disposable flash punch         | opt   | no    | exposure+, contrast+, chroma+, grain | subject_pop optional  | no        | B-ready now
cool-chrome     | Cool Y2K punch (not literal chrome)   | no    | no    | temp−, chroma+, contrast+, fade− | —                        | no        | B-ready now
editorial-bw    | Print B&W, fade, paper grain          | opt   | no    | sat≈−1, contrast, fade, grain    | —                        | opt light | B-ready now
clean-editorial | Magazine calm, mild mute              | opt   | no    | contrast soft, chroma−, fade soft| bg_mute light            | no        | B-ready now
muted-split     | Me in color, bg crushed               | yes   | yes   | mild global                      | bg_mute, bg_fade, bg_blur, subject_chroma | no | needs blur
poster-punch    | High-key CI poster + duotone          | no    | no    | contrast, chroma, vignette, duotone | —                     | yes min   | B-ready + text
```

**Falsifiers (per style):** looks thin if (a) screenshot ≠ named intent in blind 5-sec glance, (b) pack is only one slider away from another pack, (c) needs generative rim/fill to “work.”

### 3.2 Reject / PARK styles

| Style | Why |
|-------|-----|
| Generative Lofi Dusk (full prompt) | Invented rim/bloom/bokeh lights — Photoroom/diffusion lane |
| True chrome / holographic foil | Material synthesis |
| Halftone screen-print hero | Needs new op; approximate via grain+duotone in v1 |
| Multi-panel collage covers | Layout builder + pixel invent |
| Beauty skin / frequency sep | `00` won’t chase |

---

## 4. Op gap + new ops (C)

### 4.1 Current registry (shipped)

`exposure`, `contrast`, `saturation`, `temperature`, `fade`, `duotone`, `grain` (+ optional `seed`), `vignette` — plus overlay/text composite (`effectsRegistry.ts`; M02; M04). Regional = same ops on subject/bg stacks (M05).

### 4.2 Gaps for the closed look set

| Gap | Styles that need it | Decision |
|-----|---------------------|----------|
| Soft **background blur** (neighborhood) | `muted-split`, `dusk-grain` (≥2) | **SHIP `blur`** — ping-pong (`01` §5.3 / E2); primarily regional bg |
| Stronger **grain character** | `flash-raw`, `dusk-grain`, disposable cluster | **SHIP `grain.size`** param (0..1) — **not** a new op id |
| Halftone dots | poster/flyer niche | **PARK** — grain+duotone covers screenshot bar |
| Chromatic fringe | one promo niche | **PARK** until ≥2 packs demand |
| Bloom / halation / rim light | Lofi Dusk HYPE | **REFUSE** — lighting invention |
| LUT3D / CDL / curves | pro colorist depth | **PARK** (L-tier `01` §6.1) |
| Multi-mask / object remove | — | **REFUSE** |

### 4.3 New ops budget (v1 close)

| # | Change | Justify |
|---|--------|---------|
| 1 | **`blur`** `{ amount: 0..1 }` on main / regional | ≥2 packs; unlocks portrait-split craft |
| 2 | **`grain.size`** optional param | Disposable + dusk without new op id |
| — | Cap: **no third new op id** in I5 unless a pack falsifier fires | Prefer pack craft over registry sprawl |

**Blur placement (policy):** after pointwise grade, **before** overlay/text; when mask present, blur **background branch** (or blur full then `mix` with sharp subject) via ping-pong RT pair. Global blur alone is allowed but packs should prefer regional. Export must use same path + same `grain.seed` determinism (M04 X7).

---

## 5. Pack catalog v1 (D)

### 5.1 Size law

- **Catalog cap: 8 packs** (expand from 3). Hard rule: **no infinite packs**, no marketplace, no “user uploaded LUT pack.”
- Adding a 9th requires amending this card (or a one-page M06b) with style id + falsifier + axes — not drive-by JSON.
- Families for Lab grouping only (not separate products): **Film · Editorial · Poster · Portrait-split**.

### 5.2 Exact pack list (locked)

| id | Family | One-line intent | Needs mask | Needs blur | Text hint |
|----|--------|-----------------|------------|------------|-----------|
| `warm-film` | Film | Scanner warmth, soft blacks, edge falloff, grain | optional | no | no |
| `dusk-grain` | Film | Moody dusk grade: warm lift, heavy grain, muted deep bg | preferred | **yes** | no |
| `flash-raw` | Portrait | Brat / disposable flash punch — contrast, chroma, grit | optional | no | no |
| `cool-chrome` | Film | Cool Y2K punch (parametric, not foil) | no | no | no |
| `editorial-bw` | Editorial | Desaturated print with fade + paper grain | optional | no | optional |
| `clean-editorial` | Editorial | Quiet magazine: soft contrast, mild mute | optional | no | no |
| `muted-split` | Portrait-split | Subject chroma alive; background muted + soft | **required for intent** | **yes** | no |
| `poster-punch` | Poster | High-key contrast, chroma, vignette, duotone accent | no | no | **yes** |

Keep shipping the three existing JSON files; add five. Bump `packVersion` when defaults change (M01 R13 / M02 §2.D).

### 5.3 Pack JSON sketch (contract extension)

```text
Pack {
  id, version, label, summary?
  family: "film" | "editorial" | "poster" | "portrait-split"
  axes: SemanticSliderId[]          // 4–8; Lab shows these first
  mainEffects: Effect[]
  regionalDefaults?: { subject: Effect[]; background: Effect[] }  // apply when maskRef (shipped)
  overlay?: { opacity?, blend? }
  textHints?: {                     // NEW — optional; no invented copy required
    position: "top-band" | "bottom-left" | "center"
    typePreset: "sans-bold" | "condensed"
    // content stays user-authored; pack may set placeholder only in Lab demo recipes
  }
}
```

**Pack-first UX law:** apply pack → reveal **that pack’s `axes`** (4–8) + regional axes if mask ready — **not** one slider per uniform, **not** free add/remove of GLSL effects. “Add slider” = reveal a semantic axis already tied to the pack/registry, via `ensureEffect` — never freeform op shopping.

### 5.4 Example sketches (I5 fill numbers)

**`muted-split`:** mild global contrast; `regionalDefaults.background`: sat −0.85, fade 0.35, blur 0.45; `subject`: sat +0.1, contrast +0.2. Axes: `chroma`, `contrast`, `bg_mute`, `bg_fade`, `bg_blur`, `subject_chroma`.

**`flash-raw`:** exposure +0.35, contrast +0.55, sat +0.25, fade 0, grain 0.4 (`size` 0.55), vignette 0.25. Axes: `exposure`, `contrast`, `chroma`, `grain`.

**`dusk-grain`:** temp +0.25, contrast +0.2, sat −0.15, fade 0.28, grain 0.55, vignette 0.5; regional bg mute + blur. Axes: `warmth`, `fade`, `grain`, `vignette`, `bg_mute`, `bg_blur`.

**`poster-punch`:** keep current duotone stack; `textHints: { position: "bottom-left", typePreset: "sans-bold" }`.

---

## 6. Slider / control model (E)

### 6.1 Global semantic set (final)

| Keep | Notes |
|------|-------|
| `exposure`, `contrast`, `warmth`, `chroma`, `fade`, `grain`, `vignette` | M02 shipped |
| `duotone` | When effect present / pack axes include it |
| **`blur`** | **ADD** — maps to `blur.amount`; pack-driven `ensureEffect` |
| **`grain_size`** | **ADD** — maps to `grain.size` (optional param); show when pack axes list it |

No other global knobs in v1 close.

### 6.2 Regional semantic set (final)

| Keep / add | Notes |
|------------|-------|
| `bg_mute`, `bg_fade`, `subject_pop`, `subject_chroma` | M05 shipped |
| **`bg_blur`** | **ADD** — background `blur.amount` when mask ready |

Still **not** 2× full banks.

### 6.3 Free add/remove effects?

**No.** Closed registry + pack-driven `ensureEffect`. Users do not compose arbitrary op stacks in Lab. Talk may only hit closed tools → same helpers (M03/M05).

---

## 7. Poster / layout decision (F)

**IN v1 — minimal type only.** Album/poster language is type-led at thumbnail size ([VC Maker](https://visualcovermaker.com/blog/album-cover-design-trends-2025); [Premade Pixels](https://www.premadepixels.com/the-future-of-album-cover-art)); M01 already admits ≤1 `kind=text`. Closing poster craft *without* type leaves `poster-punch` as “grade only,” which screenshots as a filter, not a cover.

**Lock:**

| Allowed | Forbidden |
|---------|-----------|
| 3 positions: `top-band`, `bottom-left`, `center` | Free canvas layout builder |
| 2 type presets: `sans-bold`, `condensed` (fixed font stacks in rasterizer) | Font marketplace / brand kits |
| User edits **content** string; pack may suggest position/preset via `textHints` | Autofill copy, Canva templates, multi-text |
| Existing text object + M04 export scale | Second text object; text-as-mask |

If I5 time-box slips: ship **pack craft + blur first**; textHints can land as last I5 slice — but decision is **IN**, not PARK. Full layout system stays post-v1.

---

## 8. Lab loop + talk

### 8.1 Intended v1 loop

```text
Upload → (optional) auto person mask
  → Pick pack (primary)
  → Tune pack axes (4–8 global) + regional if mask
  → Optional text (poster family / textHints)
  → Talk as router over same axes / packs
  → Export PNG + recipe
```

### 8.2 Talk extensions (closed tools only if needed)

Existing: `apply_pack`, `set_slider`, `delta_slider`, regional tools, `refuse` (M03/M05).

**Add only if I5 needs them:**

| Tool | Maps to |
|------|---------|
| `set_text_hint` | `{ position?, typePreset? }` → PathPatch on text object fields (allowlisted) |
| `set_slider` for `blur` / `grain_size` / `bg_blur` | Same normalize → slider helpers |

No free PathPatch strings; no “add effect by name” from LLM.

---

## 9. Export implications

| Topic | Lock |
|-------|------|
| **Grain** | Deterministic UV hash + optional `seed` (M04); `size` must be in recipe so PNG≡preview |
| **Blur** | Same ping-pong path in export RT; no CPU alternate grade |
| **Text** | Re-rasterize at export scale (M04); textHints only affect layout fields already in recipe |
| **Hash** | Recipe carries pack id/version + effects + regional + text; no mask/grain pixels in URL |
| **Missing mask** | `muted-split` / dusk with regionalDefaults: fail closed if `maskRef` required by applied regional (existing M05 honesty) |

---

## 10. Falsifiers

| # | Falsifier | Meaning |
|---|-----------|---------|
| F1 | Blind glance: pack name ≠ screenshot look | Craft failed — retune pack numbers |
| F2 | Warm-film ≈ dusk-grain ≈ flash-raw after default apply | Catalog not distinct — cut or retarget |
| F3 | `blur` ships but no pack uses it in defaults | Op waste — remove or wire packs |
| F4 | Users need free effect add/remove to hit looks | Pack-first law broken — redesign packs, don’t open marketplace |
| F5 | Poster screenshots need Canva-class layout | Scope creep — refuse; keep 3 positions |
| F6 | Talk sets blur on different path than `blur` slider | talk≡sliders breach |
| F7 | Export PNG soft-bg differs from Lab | Ping-pong/export parity breach |
| F8 | Demo requires generative rim light to look “Lofi Dusk” | HYPE leak — keep dusk **parametric** naming honest |

---

## 11. Won’t chase

- Infinite / 30+ packs; LUT dumps as product identity; effect marketplace  
- Generative Lofi Dusk / Seen Girl / inpaint / bg replace / beauty  
- True chrome foil, glassmorphism, collage-max covers  
- Halftone / chromatic as v1 identity (PARK)  
- Bloom, rim light, invented bokeh lights  
- Freeform GLSL / user-authored ops  
- Canva Autofill, brand kits, Jobs API, Stage martech (`00` §7; `VISION`)  
- Multi-person masks; reopening M00 hybrid  
- UI visual redesign as craft substitute (polish **after** I5 only)

---

## 12. Decision log

| # | Topic | Decision | Why |
|---|-------|----------|-----|
| L1 | Craft timing | M06 now → I5 → UI polish → **pause** | Machine shipped; craft is the v1 close |
| L2 | Catalog size | **Exactly 8 packs**; cap enforced | Screenshot set, not Instagram clone |
| L3 | Pack list | §5.2 ids locked | Named, falsifiable looks |
| L4 | Families | Film / Editorial / Poster / Portrait-split | Lab grouping only |
| L5 | New op ids | **`blur` only**; extend `grain.size` | ≥2 styles; refuse niche ops |
| L6 | PARK ops | halftone, chromatic, LUT3D, bloom | Out of budget / HYPE / L-tier |
| L7 | Global sliders | M02 set + `blur` + `grain_size` | Pack-first axes |
| L8 | Regional sliders | M05 four + `bg_blur` | Portrait-split craft |
| L9 | Free effects UI | **Forbidden** | Closed registry + ensureEffect |
| L10 | Poster/layout | **IN** — 3 positions, 2 type presets, `textHints` | Cover language; not a builder |
| L11 | Mask policy | Keep **one** person mask | Research does not force multi-mask |
| L12 | Pack apply | Pack-first; axes drive visible knobs | VSCO Pro pattern |
| L13 | Naming honesty | `dusk-grain` ≠ full AI Lofi Dusk | Avoid HYPE claims |
| L14 | v1 closed | 5 named screenshots in checklist §14 | Demo-or-it-didn’t-ship |

---

## 13. References

**Trends / culture**  
- Lofi Dusk stills — [Analytics Insight](https://www.analyticsinsight.net/news/lofi-dusk-instagram-trend-how-to-create-viral-ai-portraits), [Mathrubhumi](https://english.mathrubhumi.com/technology/how-to-create-lofi-dusk-filter-using-chatgpt-prompts-nj5afyk1)  
- Brat / flash revival — [Aesthetics of Photography](https://aestheticsofphotography.com/the-brat-aesthetic-and-flash-photography-revival-how-gen-z-is-bringing-back-on-camera-flash/), [SLR Lounge](https://www.slrlounge.com/mastering-editorial-raw-flash/)  
- Album / type / Y2K covers — [VC Maker 2025](https://visualcovermaker.com/blog/album-cover-design-trends-2025), [Premade Pixels](https://www.premadepixels.com/the-future-of-album-cover-art), [Creative Review 2025](https://www.creativereview.co.uk/the-best-album-art-and-design-of-the-year-2025/)  
- Duotone — [grayscaleimage.org](https://www.grayscaleimage.org/posts/duotone-design-guide)  
- Poster contrast / mono wash — [Behance Trends 2025](https://www.behance.net/gallery/209674381/Design-Trends-2025), [Envato graphic styles](https://elements.envato.com/learn/trending-graphic-design)  

**Tool craft**  
- VSCO Pro / Film — [Pro Presets](https://www.vsco.co/features/photo-filters/pro-presets), [Full Spectrum](https://vsco.co/vsco/journal/full-spectrum), [Imaging Lab](https://eng.vsco.co/vsco-film-x-&-the-imaging-lab/)  
- Capture One Styles vs LR presets — [FilterGrade](https://filtergrade.com/lightroom-presets-vs-capture-one-styles-which-is-right-for-your-workflow/)  

**In-repo**  
- `VISION.md`, `00_FIELD_RESEARCH.md` (RQ2, D6, §7 won’t-chase), `01_ENGINE.md` (§5–6 ops, ping-pong), `02_CONSTITUTION.md`, M00–M05, I0–I4b, `src/packs/{warm-film,editorial-bw,poster-punch}.json`, `sliders.ts`, `regionalSliders.ts`, `effectsRegistry.ts`, `applyPack.ts`

---

## 14. Operator summary

- **v1 close path:** research (this card) → **I5 craft** → thin UI polish → **pause**.  
- **8 named packs** across Film / Editorial / Poster / Portrait-split; expand from 3; **no infinite catalog**.  
- **New craft:** `blur` (+ `bg_blur`) and `grain.size`; refuse bloom/halftone/chrome foil as identity.  
- **Loop:** pack → 4–8 axes → optional regional/text → talk≡sliders → PNG+recipe.  
- **Layout:** minimal type **IN** (3 positions, 2 presets); not Canva.  
- **Demo checklist (v1 closed):** five Lab screenshots that read at a glance as (1) `warm-film`, (2) `flash-raw`, (3) `muted-split`, (4) `editorial-bw`, (5) `poster-punch` **with text**. Bonus: `dusk-grain`, `cool-chrome`, `clean-editorial`.

---

## 15. I5 implement pointer

Ordered slices (plan file later — **not** this card):

1. **Ops:** `blur` ping-pong path + registry; `grain.size` param; export parity.  
2. **Pack JSON library:** five new packs + retune three; `family`, `textHints`, regionalDefaults.  
3. **Slider axes:** wire `blur`, `grain_size`, `bg_blur`; Lab shows pack `axes` first.  
4. **Minimal layout:** positions + 2 type presets + textHints apply.  
5. **Lab pack-first UX tweaks only as needed** (family grouping, axis filtering) — not a redesign.  
6. **Screenshot checklist** §14 — falsifiers F1–F8 manual subset.

**UI visual redesign = separate thin pass after I5**, not this card’s code.

---

## Decisions M06 must lock (checklist)

| Lock | Value |
|------|-------|
| Exact pack list | §5.2 (8 ids) |
| New effects ship vs PARK | SHIP: `blur`, `grain.size`; PARK: halftone, chromatic, LUT; REFUSE: bloom/inpaint |
| Final semantic sliders | Global §6.1; regional §6.2 |
| Poster/layout | **IN** minimal (§7) |
| Catalog cap | **8**; no infinite packs |
| v1 closed means | 5 look screenshots in §14 demo checklist |
