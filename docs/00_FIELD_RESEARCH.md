# Prism — Field Research & Design Notes

**Status:** living research notes (phase 0)  
**Date:** 2026-08-18  
**Branch:** `rewrite/v1-styling`  
**North star:** Upload a still photo → optional vision/masks → a small LLM routes natural-language intent to typed style-pack + recipe patches → GPU applies parametric transforms live → export still, poster, or serializable recipe.  
**Feeds:** `VISION.md`, `01_ENGINE.md`, future `02_CONSTITUTION.md`

### Project intent (lab framing)

Portfolio + lab project in the **spatial / still-image** lane (sibling to sound-visualiser’s time-domain WebGL and ADA’s embodied agent stack). Research precedes architecture precedes code. Success is measured by falsifiable RQs and a shippable Tier A loop—not demo theater or a Canva clone.

### Lens legend

| Lens | Meaning |
|------|---------|
| **HYPE** | Market narrative / demo magic—useful taste signal, not engineering truth |
| **EVIDENCE** | Papers, benchmarks, widely shipped product patterns |
| **FEASIBLE** | Realistic for solo dev: browser WebGL/WebGPU + server-side vision/LLM APIs, no render farm |
| **POLICY** | Locked intent for this rewrite (proposals until decision log) |

---

## 0. Problem statement (no legacy code)

**User job under study:** A creator uploads a **still photograph** and steers its **look** conversationally—“more editorial, less grain,” “Y2K poster with me in color and muted background,” “match this brand palette”—without entering a full generative inpainting product or a pro colorist suite.

**Core hypothesis (to test, not assume):** A **typed appearance DSL** (style packs + parametric GPU recipe) plus a **minimal LLM router** can satisfy a meaningful slice of “make it look like X” intent faster and more controllably than raw diffusion editing—especially when the user wants **reproducible recipes** and **live slider feedback**.

**Explicit boundary:** We study **parametric appearance control** on fixed pixels, not open-ended pixel synthesis. Generative tools are mapped as **competitors** and **won’t-chase** territory unless Tier C research justifies a narrow exception.

---

## 1. Field map (taxonomy)

| Domain | Representative work | What they optimize for | Relevance to Prism |
|--------|---------------------|------------------------|-------------------|
| **A. Classical / matrix image processing** | Gonzalez & Woods foundations; 3D LUTs ([DOI 10.1609/aaai.v39i9.33059](https://doi.org/10.1609/aaai.v39i9.33059)); PassXMP Hald workflow | Deterministic color transforms, compression, invertibility | **Primary engine lane** — honest limits of parametric ops |
| **B. Real-time GPU compositors** | Lumen, FILTR, kampos, VideoFlow, Utilora WebGPU Filter Studio, three-fluid-fx | Live shader stacks, recipe JSON, export parity | **Primary UX/engine pattern** |
| **C. Designer preset ecosystems** | VSCO Film X / Pro Presets; Lightroom XMP; Capture One styles | Craft encoding, film emulation, brand looks | **Style-pack mental model** — not clone |
| **D. Segmentation / masks** | SAM 2 (WebGPU), MediaPipe SelfieSegmenter, rembg/BiRefNet | Subject/background split, regional grades | **Tier B enabler** — quality vs cost |
| **E. LLM + structured DSL routing** | OpenAI structured outputs; InstructPipe ([DOI 10.1145/3706598.3713905](https://doi.org/10.1145/3706598.3713905)); CoSTA* ([DOI 10.48550/arxiv.2503.10613](https://doi.org/10.48550/arxiv.2503.10613)); GenArtist ([DOI 10.52202/079017-4077](https://doi.org/10.52202/079017-4077)) | Intent → validated tool calls / patches | **Router lane** — small scope |
| **F. Generative editing** | Photoroom foundation diffusion; Adobe Firefly; diffusion editing survey ([DOI 10.1109/TPAMI.2025.3541625](https://doi.org/10.1109/TPAMI.2025.3541625)) | Inpaint, replace, expand, retouch | **Competitor / refuse** |
| **G. Creative coding / multimodal adjacent** | TouchDesigner TOP/CHOP; p5 spectrograms; sound-visualiser philosophy | Live vs still, time vs space | **Positioning** — don’t duplicate VJ |
| **H. Research vs industry shape** | SLANG.D ([DOI 10.1145/3618353](https://doi.org/10.1145/3618353)); neural shading course ([DOI 10.1145/3721241.3733999](https://doi.org/10.1145/3721241.3733999)); EditEval benchmark ([DOI 10.1109/TPAMI.2025.3541625](https://doi.org/10.1109/TPAMI.2025.3541625)) | Differentiable rendering, eval rigor | **CV / paper credibility** — mostly Tier C |

---

## 2. What “effective” means here

Operational metrics—not vibes:

| Metric | Definition | Tier A target (provisional) | Notes |
|--------|------------|----------------------------|-------|
| **Routing accuracy** | User intent → correct style pack + patch fields (human eval) | ≥80% on curated prompt set (n≈30) | **EVIDENCE:** structured outputs improve schema fidelity (Cohere, OpenAI docs) |
| **Patch validity rate** | JSON patch passes schema + GPU compile | ≥99% with constrained decoding + validator | **FEASIBLE** |
| **Intent match (global)** | Blind A/B vs reference look description | Not measured yet | Subjective; needs rubric |
| **Intent match (regional)** | Masked region grade vs global-only baseline | **RQ1 falsifier** — see §5 | Requires Tier B |
| **Mask IoU / edge quality** | vs human trimap or API gold (subset) | Person: “IG-good” not beauty-app | **EVIDENCE:** quality varies wildly by model (rembg vs BiRefNet vs API) |
| **Preview latency** | Upload → first interactive frame | <500 ms GPU path (1080p) | **FEASIBLE** for parametric stack |
| **Router latency** | Prompt → validated patch | <2 s (single LLM call) | **FEASIBLE** with small schema |
| **Look fidelity** | ΔE / SSIM vs offline reference export | Not measured yet | Same recipe → same PNG (determinism) |
| **Recipe portability** | URL/hash/share deserializes identically | 100% round-trip | **EVIDENCE:** Shaddy, Lumen preset export patterns |

---

## 3. Architecture patterns (2024–2026)

### Pattern 1: LLM → validated JSON patch → GPU renderer  
**EVIDENCE + FEASIBLE**

Natural language → structured patch over a **fixed schema** (pack id, op stack, uniforms, mask refs) → deterministic validator → WebGL/WebGPU compositor. Mirrors FIBO Scene Director’s “LLM translates to JSON, renderer is deterministic” ([fibo-scene-director](https://github.com/msaluck/fibo-scene-director)), VideoFlow’s resolution-agnostic effect stacks ([VideoFlow blog](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)), and production structured-output APIs ([OpenAI GPT-4o](https://developers.openai.com/api/docs/models/gpt-4o), [Cohere strict tools](https://docs.cohere.com/docs/structured-outputs)).

**Claim:** Works for **semantic routing** and **parameter selection**, not pixel invention.  
**Demo vs ship:** Schema design and validator matter more than model size.

### Pattern 2: Vision encode once → compact features → router  
**EVIDENCE + FEASIBLE**

VLM tags image once (dominant colors, scene type, subject count, mood) → features cached → router chooses pack/patches without re-sending full image each turn. GPT-4o vision + `response_format` Pydantic models is **EVIDENCE** ([OpenAI cookbook: vision + function calling](https://developers.openai.com/cookbook/examples/multimodal/using_gpt4_vision_with_function_calling/)).

**Claim:** Reduces cost/latency for multi-turn “less grain” refinement.  
**Risk:** Tag drift; needs versioned feature snapshot in recipe.

### Pattern 3: Learned image → coefficients (no LLM at inference)  
**EVIDENCE, limited FEASIBLE**

Neural networks predict **grading parameters** or **3D LUTs** from reference/style image ([NCST](https://doi.org/10.48550/arxiv.2411.00335); [ICCV 2025 LUT generation](https://doi.org/10.1109/iccv51701.2025.01779)). Ultra-fast at inference; training/data burden high.

**Claim:** Strong for “match this reference still” once pack vocabulary exists.  
**Solo dev:** Defer to Tier C unless a narrow LUT-head is scoped.

### Pattern 4: Differentiable / neural shading in-loop  
**EVIDENCE, not FEASIBLE for v1**

SLANG.D ([DOI 10.1145/3618353](https://doi.org/10.1145/3618353)), neural shading SIGGRAPH 2025 course ([DOI 10.1145/3721241.3733999](https://doi.org/10.1145/3721241.3733999); [NVIDIA slides](https://static.graphicsprogrammingconference.com/public/2025/slides/neural-shading/Allan-neural-shading-for-real-time-graphics.pdf)) — MLPs inside shaders, cooperative vectors on RTX.

**Claim:** Research-rich; **browser solo dev** lacks tensor-core path. Shaddy explicitly **cut** photo→shader gradient descent mid-build ([Shaddy Devpost](https://devpost.com/software/shaddy)).

### Pattern 5: Full generative inpaint / replace (competitor)  
**EVIDENCE + HYPE**

Photoroom foundation diffusion ([Photoroom engineering blog](https://www.photoroom.com/inside-photoroom/photoroom-foundation-diffusion-model)); diffusion editing survey ([DOI 10.1109/TPAMI.2025.3541625](https://doi.org/10.1109/TPAMI.2025.3541625)).

**Claim:** Wins on “change the background to a forest” where **new pixels** are required.  
**POLICY:** Out of Tier A/B unless explicitly scoped as research comparison arm.

### Pattern 6: Agentic multi-tool path planning  
**EVIDENCE, partial FEASIBLE**

CoSTA* combines LLM subtask trees + A* over tool graph with VLM verification ([DOI 10.48550/arxiv.2503.10613](https://doi.org/10.48550/arxiv.2503.10613)); GenArtist MLLM agent with tool library ([DOI 10.52202/079017-4077](https://doi.org/10.52202/079017-4077)).

**Claim:** Beats single-shot diffusion on **multi-turn** edits—in papers.  
**Solo dev:** ReAct-lite (propose → patch → validate → apply) is **FEASIBLE**; full CoSTA* is not.

---

## 4. Market & OSS landscape

| Tool | Category | Strength | Gap (for Prism) | Lens |
|------|----------|----------|-----------------|------|
| **Lumen** | Modular WebGL2 filter studio | Stackable shader modules, presets, mask groups ([legenki.com/lumen](https://legenki.com/lumen/)) | No NL router; no style-pack semantics | EVIDENCE / FEASIBLE |
| **FILTR (Antlii WIP)** | Ping-pong GPU pipeline | Mask groups, module stack ([antlii.work/WIP-Tool](https://antlii.work/WIP-Tool)) | Still WIP; no conversational layer | EVIDENCE |
| **FLUID (KrackedDevs)** | Generative fluid + photo melt | Local GPU, living patterns ([fluid.krackeddevs.com](https://fluid.krackeddevs.com/)) | Art toy, not editorial/CI styling | HYPE / FEASIBLE |
| **Shaddy** | Shader composer | URL-encoded recipe JSON, 140+ blocks ([Devpost](https://devpost.com/software/shaddy)) | Deferred photo→shader training | EVIDENCE |
| **kampos** | Tiny WebGL compositor | ~4KB, effect DSL ([GitHub wix-incubator/kampos](https://github.com/wix-incubator/kampos)) | Dev library, not product | EVIDENCE |
| **Utilora WebGPU Filter Studio** | Multi-pass tone/blur/grain | Real-time WGSL chain ([utilora.app](https://utilora.app/tools/image-tools/webgpu-filter-studio)) | Fixed pipeline, no NL | FEASIBLE |
| **EzRen** | PixiJS editing engine | Layers, GPU filters, export ([GitHub MateoRNV/ez-ren](https://github.com/MateoRNV/ez-ren)) | General editor frame, not style DSL | EVIDENCE |
| **VSCO Film X / Pro** | Mobile preset ecosystem | Spectral film models, decomposed Pro controls ([VSCO eng](https://eng.vsco.co/vsco-film-x-&-the-imaging-lab/)) | Closed; mobile-first | EVIDENCE |
| **Lightroom / XMP** | Parametric RAW + presets | Sliders, masks, Hald→LUT export tools ([PassXMP](https://github.com/maxthomason/PassXMP)) | Desktop pro workflow | EVIDENCE |
| **Photoroom / remove.bg class** | Generative + cutout API | Batch, inpaint, relight API ([Photoroom docs](https://docs.photoroom.com/getting-started/api-reference-openapi)) | Pixel synthesis, not recipe truth | EVIDENCE / HYPE |
| **Canva Autofill** | Enterprise template fill | Brand template + async job API ([Canva Connect](https://www.canva.dev/docs/connect/api-reference/autofills/)) | Layout/templates, not parametric grade | EVIDENCE / POLICY refuse clone |
| **SAM 2 / WebSAM** | Interactive segmentation | Client-side WebGPU, OPFS cache ([WebSAM](https://github.com/Xevion/WebSAM)) | Heavy models; mobile weak | EVIDENCE / FEASIBLE |
| **rembg / BiRefNet** | Server or local matting | OSS matting; model choice dominates quality ([rembg](https://github.com/danielgatis/rembg)) | Not styling; ops burden | EVIDENCE |
| **MediaPipe SelfieSegmenter** | Lightweight person mask | ~250KB landscape model, browser WASM ([Google AI Edge](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter)) | Person-only; edge softness | FEASIBLE |
| **InstructPipe** | LLM → visual ML pipeline | Node selector + code writer + interpreter ([DOI 10.1145/3706598.3713905](https://doi.org/10.1145/3706598.3713905)) | Prototype; not photo product | EVIDENCE |
| **OpenAI / Cohere structured output** | LLM tooling | Schema-guaranteed JSON / strict tools | Generic; needs domain schema | EVIDENCE / FEASIBLE |
| **TouchDesigner** | Node AV tool | TOP/CHOP live compositing ([interactiveimmersive.io](https://interactiveimmersive.io/blog/touchdesigner-operators-tricks/touchdesigner-tops-vs-chops/)) | Desktop; live/VJ bias | EVIDENCE (adjacent) |

---

## 5. Research questions (explicit)

**RQ1:** Does **pack routing + regional masks** beat **global filters alone** on intent match for prompts that specify subject vs background (e.g., “B&W background, keep me in color”)?  
- **Falsifier:** Blind rating shows no significant preference for regional pipeline at equal latency.  
- **Requires:** Tier B masks + split grade ops.

**RQ2:** Can a **small fixed schema** (≤20 patch fields, ≤12 shader ops) cover ≥70% of a curated “editorial / retro / film / CI poster” prompt suite without invoking generative inpaint?  
- **Falsifier:** >30% of prompts need pixel synthesis (object add/remove, background invent) to satisfy raters.  
- **Requires:** Tier A pack library + human eval rubric.

**RQ3:** Is **LLM-as-router** sufficient for refinement turns (“less grain,” “warmer shadows”) if the prior recipe is in context—or do users need direct manipulation?  
- **Falsifier:** >40% of refinement turns mis-parse relative delta (wrong op or direction).  
- **Mitigation:** Dual path—NL + semantic sliders bound to same schema.

**RQ4:** What is the **minimum mask quality** pipeline (MediaPipe client vs SAM2 WebGPU vs server BiRefNet) that unlocks RQ1 without beauty-app engineering cost?  
- **Falsifier:** Client-only masks fail IG-good edge quality on hair/glass subset; regional grade looks worse than global.  
- **Measure:** Edge halos, subject leak on standardized portrait set (not invented scores).

**RQ5 (research-shaped):** Are **serializable recipes** (JSON + pack version) a differentiated deliverable vs generative editors for portfolio narrative?  
- **Falsifier:** Users never export/share recipes; only PNG matters.  
- **Measure:** Export click-through, recipe re-load rate in lab sessions.

---

## 6. Tier A / B / C (FEASIBLE on solo dev)

| Tier | Scope | Depends on | Ship signal |
|------|-------|------------|-------------|
| **A — Smallest lovable loop** | Upload still → pick/apply **style pack** → GPU live preview → **semantic sliders** + optional single LLM turn → export PNG + **recipe JSON** | WebGL2/WebGPU compositor, 3–5 packs, JSON schema + validator, one vision-free or one-shot VLM tag optional | Demoable in browser without masks |
| **B — Regions & refinement** | Person/subject mask (MediaPipe or SAM2 tiny) → **split grade** (subject/bg) → multi-turn LLM patches with recipe diff → poster layout slot (type + crop) | Tier A + mask pipeline + patch versioning | RQ1/RQ4 testable |
| **C — Deferred / lab-only** | Reference→LUT neural head; server BiRefNet; differentiable fit (Shaddy-style); inpaint comparison arm; video export | GPU server budget, training data, eval harness | Paper-grade or explicit benchmark blog post |

**User story feasibility tags:**

| Story | Tier | Required tech |
|-------|------|---------------|
| “Make it cinematic / more grain” | A | Global grade ops + router or sliders |
| “Y2K poster vibe” | A | Pack + typography layout template |
| “Me in color, muted background” | B | Person mask + dual grade |
| “Change background to beach” | **Won’t chase** (F) | Generative inpaint / outpainting |
| “Remove ex from photo” | **Won’t chase** (F) | Inpaint object removal |
| “Match our brand CI colors” | A→B | Palette tokens in schema + optional VLM tag |
| “Fix skin / beauty retouch” | **Won’t chase** | Portrait ML retouch pipelines |

---

## 7. Explicit non-goals & won’t chase

- **Canva / martech clone** — template marketplace, brand governance at enterprise scale ([Canva Autofill](https://www.canva.dev/docs/connect/autofill-guide/) is API-for-templates, not our lane). **POLICY**
- **Full Photoshop** — layers, healing brush, content-aware fill. **POLICY**
- **Generative inpainting / outpainting / background invention** — Photoroom/Adobe lane ([Photoroom FDM blog](https://www.photoroom.com/inside-photoroom/photoroom-foundation-diffusion-model)). **POLICY**
- **Face beauty retouch, body reshaping, age filters** — separate ethical/product category. **POLICY**
- **Real-time VJ / audio-reactive** — sound-visualiser territory. **POLICY**
- **Training custom diffusion or foundation models** — compute + data moat. **POLICY**
- **Neural shading in browser** — SIGGRAPH 2025 interesting, not shippable solo. **POLICY**
- **Claiming SOTA mask accuracy** without measured benchmark on our set. **POLICY**

---

## 8. Recommended first vertical slice (after research)

**If RQ2 preliminary prompt audit holds:** Build **Tier A** as **“Recipe Studio”** — one WebGL2 ping-pong compositor (tone → color grade → grain/vignette → optional LUT), **three style packs** (e.g., editorial B&W, warm film, high-contrast poster), a **strict JSON recipe schema** with URL/hash share, and **one LLM router call** that maps a short mood sentence to `{ packId, patch }` with server-side validation and client-side fallback to manual sliders. Optional: lightweight VLM **tagging pass** (colors, scene) stored in recipe metadata—not used to rewrite pixels. This proves the hypothesis core: **conversational control of a deterministic GPU DSL** without masks or generative APIs. Masks and multi-turn refinement enter only after Tier A export/recipe round-trip is stable.

---

## 9. Decision log (initial proposals — not locked)

| # | Topic | Proposal | Evidence | Open? |
|---|-------|----------|----------|-------|
| D1 | GPU API | **WebGL2 first**, WebGPU optional later | Lumen/FILTR/kampos ecosystem; WebGPU filter parity ([Utilora](https://utilora.app/tools/image-tools/webgpu-filter-studio)) | Yes — iOS Safari |
| D2 | Recipe format | Ordered **op stack** + uniforms + `packVersion` | VideoFlow, Shaddy URL recipes | Yes — op registry naming |
| D3 | LLM role | **Router only** — never pixel author | GenArtist/CoSTA* tool patterns; structured output APIs | Yes — model choice |
| D4 | Vision scope | **Tag once** (colors, subject count); no mask in Tier A | GPT-4o structured vision | Yes — cache format |
| D5 | Masks Tier B | **MediaPipe SelfieSegmenter** default; SAM2 tiny optional | [MediaPipe docs](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter); [WebSAM](https://github.com/Xevion/WebSAM) | Yes — server fallback |
| D6 | Style packs | **Decomposed controls** (color / contrast / tone / grain) like VSCO Pro | [VSCO Pro preset blog](https://vsco.co/vsco/journal/invite-vsco-creator-session-8) | Yes — pack count |
| D7 | Generative | **No inpaint in v1** | Photoroom FDM; diffusion survey | No — unless RQ2 falsified |
| D8 | Export | PNG + JSON recipe required; PDF poster Tier B | Determinism pattern from FIBO Scene Director | Yes — poster schema |
| D9 | Eval | Curated **30-prompt** set + blind intent match before Tier B | EditEval LMM score idea ([survey §VIII](https://doi.org/10.1109/TPAMI.2025.3541625)) | Yes — rubric design |

---

## 10. Module research card gate (for future slices)

**POLICY (proposal):** No major code module (compositor pass, mask adapter, router schema, export pipeline) ships without a **one-page research card**: problem, RQ link, alternatives rejected, FEASIBLE tier, falsifier, and ≥2 primary citations. Mirrors ADA-style §8 gate—keeps the rewrite from collapsing into “LLM photo editor” improvisation.

---

## 11. Domain deep dives (A–H)

### A. Image as matrix / classical processing

**Frame:** An image is \(I \in \mathbb{R}^{H \times W \times 3}\); pipelines apply linear color transforms, per-channel curves, convolutions (blur/sharpen), and compositing with alpha masks. **3D LUTs** encode arbitrary global color mappings as sampled lattices ([Efficient Neural Network Encoding for 3D LUTs](https://doi.org/10.1609/aaai.v39i9.33059)); **Hald CLUT** workflow captures Lightroom-style transforms empirically ([PassXMP](https://github.com/maxthomason/PassXMP)).

**Transform domain:** FFT/wavelets matter for frequency-selective ops (sharpen, denoise); most **Instagram-grade looks** are spatial-domain grade + grain + vignette. **Low-rank / factorization** appears in LUT compression and neural LUT banks—not needed for Tier A.

**Key answer — parametric vs pixel rewrite:**

| Achievable parametrically | Requires generative / inpaint |
|---------------------------|-------------------------------|
| Global and regional color grade | Object add/remove |
| Curve/tone (fade, S-curve) | Semantic background replace |
| Film grain, halftone, vignette | Face reshaping, inpaint holes |
| Split tone, LUT apply | Outpainting new canvas area |
| Mask-weighted composite of **same** pixels | “Put me on a beach” new scene |
| Typography/crop/layout on still | Text inpainting inside complex scenes |

**Lens:** **EVIDENCE** for LUT limits (spatial ops don’t export to 3D LUT — PassXMP sanitizer zeros clarity/grain). **FEASIBLE** for Tier A stack.

---

### B. Real-time graphics / shaders / parametric looks

**Product pattern:** **Recipe JSON + GPU** is **credible beyond dev-only** when preview and export share the same shader graph ([VideoFlow browser + server renderers](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)); Lumen/FILTR treat modular stacks as the product ([Lumen](https://legenki.com/lumen/), [FILTR](https://antlii.work/WIP-Tool)).

**Implementation pattern:** Ping-pong FBOs, ordered passes, uniforms driven by UI/JSON; optional **EffectComposer**-style passes ([three-fluid-fx](https://github.com/artcodev/three-fluid-fx) — fluid as **distortion overlay**, adjacent not core).

**Differentiable / neural shading:** SLANG.D enables differentiable real-time renderers ([DOI 10.1145/3618353](https://doi.org/10.1145/3618353)); neural shading SIGGRAPH 2025 targets **RTX cooperative vectors** ([DOI 10.1145/3721241.3733999](https://doi.org/10.1145/3721241.3733999); [course repo](https://github.com/shader-slang/neural-shading-s25)). **Promise:** learn shaders from examples. **Production:** research/exploration phase; Shaddy **deferred** photo→shader gradient descent.

**Key answer:** Recipe JSON + GPU is a **legitimate product pattern** for **deterministic looks**; it is **not** the pattern for semantic pixel invention.

**Lens:** **EVIDENCE** (shipped stacks); **HYPE** (neural shading as “instant style from photo”).

---

### C. Photo editing aesthetics / style packs

**Designer workflow:** Pros combine **global grade** (curves, wheels, LUT), **local masks**, **grain/halftone**, **crop/type** for CI posters. Film emulation adds **character** (exposure behavior) and **warmth** (scanner balance) — VSCO Film X built a **spectral model** from wet-lab measurements ([VSCO Imaging Lab](https://eng.vsco.co/vsco-film-x-&-the-imaging-lab/)). Pro Presets **decompose** a baked look into Color / Contrast / Tone sliders ([VSCO journal](https://vsco.co/vsco/journal/invite-vsco-creator-session-8)).

**Preset mental model for Prism:** A **style pack** = base recipe + named semantic axes (not 500 Lightroom sliders). LUT captures **global color**; grain/vignette/halftone are **separate ops** (LUT alone blurs or misses spatial effects — **EVIDENCE** from PassXMP / VSCO grain guidance).

**Key answer:** Style packs **can encode substantial designer craft without generative AI** for looks that are **global + regional grade + texture + layout**—not for inventing new scene content.

**Lens:** **EVIDENCE** (VSCO, Lightroom/XMP ecosystem); **HYPE** (“AI preset” marketing).

---

### D. Computer vision / masks (minimal viable)

| Pipeline | Pros | Cons | Lane |
|----------|------|------|------|
| **MediaPipe SelfieSegmenter** | Small (~250KB landscape), browser WASM, person class | Soft edges, person-only; CPU path slow ([issue #5377](https://github.com/google-ai-edge/mediapipe/issues/5377)) | **FEASIBLE Tier B default** |
| **SAM 2 WebGPU (WebSAM, sam-web)** | Interactive, high quality; encode once ~345–700ms ([sam-web README](https://github.com/karlorz/sam-web)) | 145–878MB models; iOS fragile | **FEASIBLE** desktop/lab |
| **rembg + BiRefNet** | OSS; quality jump over U2Net ([BiRefNet comparison blog](https://pixelapi.hashnode.dev/birefnet-vs-rembg-vs-u2net-which-background-removal-model-actually-works-in-production-1-1-1-1-1)) | CPU 10–15s; GPU ops burden | Server-side Tier B+ |
| **Commercial APIs** (Photoroom, remove.bg) | Consistent hair/edge at scale | Cost, privacy, vendor lock | Compare arm only |

**IG-good-enough vs beauty-app:** Instagram carousels tolerate **1–2px halos** and soft hair; beauty apps need frequency separation and temporal stability (video). **Still-only Tier B** targets IG-good on **person + simple product**, not glass lace wigs.

**Key answer:** **Client MediaPipe** for Tier B person split; **SAM2** if interactive refinement needed; **server BiRefNet** only if RQ4 falsifies client quality.

**Lens:** **EVIDENCE** (benchmarks vary—treat blog percentages as directional, not gospel); **FEASIBLE** client path exists.

---

### E. AI / LLM in the loop (small scope)

**Structured output / function calling:** Production APIs guarantee schema adherence ([Cohere strict_tools](https://docs.cohere.com/docs/structured-outputs)); **Controller vs Formatter** pattern—tool-calling brain + cheap structured formatter ([Agenta guide](https://agenta.ai/blog/the-guide-to-structured-outputs-and-function-calling-with-llms)).

**LLM as router vs pixel generator:**

| Router | Pixel generator |
|--------|-----------------|
| Emits `{ pack, patch, maskPolicy }` | Diffusion/inpaint rewrites pixels |
| Deterministic replay | Stochastic |
| Validates against closed op set | Open-world semantics |
| **FEASIBLE Tier A** | Competitor Tier F |

**Agent patterns:** InstructPipe — LLM writes **pseudocode pipeline**, human edits graph ([DOI 10.1145/3706598.3713905](https://doi.org/10.1145/3706598.3713905)). CoSTA* — cost-sensitive tool path with VLM verify ([DOI 10.48550/arxiv.2503.10613](https://doi.org/10.48550/arxiv.2503.10613)). GenArtist — MLLM selects tools + self-correction subtrees ([DOI 10.52202/079017-4077](https://doi.org/10.52202/079017-4077)).

**Minimum LLM responsibility:** Map **intent → pack + bounded numeric deltas** on known semantic axes (“less grain” → `grain.amount -= Δ`). Vision model optionally **tags** scene; it should **not** output raw pixel directives. Refinement = **recipe patch merge** with validator, not re-prompting entire image.

**Key answer:** Minimum LLM job is **classification + constrained patch generation**; pixel work stays on GPU.

**Lens:** **EVIDENCE** (papers + APIs); **HYPE** (“agentic Photoshop”).

---

### F. Generative editing (competitor lane)

**Capabilities:** Background removal + **generative replace**, AI expand/uncrop, object erase/fill, relight, virtual model ([Photoroom API OpenAPI](https://docs.photoroom.com/getting-started/api-reference-openapi)). Built on **inpainting-first** foundation models ([Photoroom FDM blog](https://www.photoroom.com/inside-photoroom/photoroom-foundation-diffusion-model)).

**Survey landscape:** Diffusion editing spans semantic, stylistic, structural edits; inpainting/outpainting is its own major class ([Diffusion Model-Based Image Editing: A Survey](https://doi.org/10.1109/TPAMI.2025.3541625)).

**What we must refuse to compete on:** Any user story whose satisfaction **requires inventing pixels** (new background scene, remove person, generative fill, expand canvas with plausible content). Optional **Tier C compare demo** only—to quantify RQ2 falsifier.

**Lens:** **EVIDENCE** (shipped at scale); **POLICY** non-goal.

---

### G. Multimodal / creative coding adjacent

**sound-visualiser philosophy:** Time-domain signal → live WebGL; spectrogram is **image-like** but **axis semantics are time×frequency**, not spatial scene ([Apple spectrogram doc](https://developer.apple.com/documentation/accelerate/visualizing-sound-as-an-audio-spectrogram); [p5 music viz](https://therewasaguy.github.io/p5-music-viz/)). Stylizing a spectrogram is **texture on a 2D plot**, not portrait CI styling—adjacent, don’t duplicate.

**TouchDesigner / VJ:** TOPs for GPU images, CHOPs for audio/control ([TOPs vs CHOPs](https://interactiveimmersive.io/blog/touchdesigner-operators-tricks/touchdesigner-tops-vs-chops/)). Pros hybrid **render loops + live FX** ([DJ visuals guide](https://interactiveimmersive.io/blog/deployment/creating-dj-visuals-with-touchdesigner/)). **Live vs still split:** VJ optimizes **temporal continuity + audio sync**; Prism optimizes **single-frame intent + export recipe**.

**Lens:** **EVIDENCE** for positioning; **POLICY** no VJ features.

---

### H. Academic & industry positioning

**Research-shaped (fits lab):** Explicit RQs, falsifiers, ablations (global vs regional; router vs manual), open recipe schema, reproducible eval set. Contributes **systems + HCI** narrative: constrained LLM control of visual DSL ([InstructPipe](https://doi.org/10.1145/3706598.3713905)). Differentiable rendering/neural shading = **related work**, not v1 implementation.

**Industry-shaped (what employers also value):** End-to-end **typed API** (recipe validate → GPU → export), observability on router failures, cost/latency budgets, comparison to Photoroom-class APIs on **cutout-only** baseline.

**Would NOT qualify as a paper:** “We wired GPT-4 to Instagram filters” without eval, schema, or ablation. **Would strengthen AI-engineering CV:** Documented **validator + fallback**, mask tier tradeoff study, open recipe spec, benchmark blog with honest failures.

**Lens:** **POLICY** — research cards required; **EVIDENCE** from EditEval / LMM-as-judge trend ([survey](https://doi.org/10.1109/TPAMI.2025.3541625)).

---

## 12. References (selected)

### Classical / color / LUTs
- Conde et al., *Efficient Neural Network Encoding for 3D Color Lookup Tables* — [DOI 10.1609/aaai.v39i9.33059](https://doi.org/10.1609/aaai.v39i9.33059)
- Thomason, *PassXMP* — [GitHub](https://github.com/maxthomason/PassXMP) *(software; no DOI)*
- NCST: *Neural-based Color Style Transfer for Video Retouching* — [DOI 10.48550/arxiv.2411.00335](https://doi.org/10.48550/arxiv.2411.00335)
- Seunghyun et al., *Video Color Grading via Look-Up Table Generation* — [DOI 10.1109/iccv51701.2025.01779](https://doi.org/10.1109/iccv51701.2025.01779)

### GPU compositors & recipes
- VideoFlow, *Cinematic GLSL Effect Stacking* — [blog](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)
- Lumen — [legenki.com/lumen](https://legenki.com/lumen/)
- FILTR (WIP) — [antlii.work/WIP-Tool](https://antlii.work/WIP-Tool)
- Shaddy — [Devpost](https://devpost.com/software/shaddy)
- kampos — [GitHub wix-incubator/kampos](https://github.com/wix-incubator/kampos)
- three-fluid-fx — [GitHub artcodev/three-fluid-fx](https://github.com/artcodev/three-fluid-fx)
- Utilora WebGPU Filter Studio — [utilora.app](https://utilora.app/tools/image-tools/webgpu-filter-studio)

### Presets / designer workflow
- VSCO, *Film X & The Imaging Lab* — [eng.vsco.co](https://eng.vsco.co/vsco-film-x-&-the-imaging-lab/)
- VSCO, *Pro Presets deep dive* — [journal](https://vsco.co/vsco/journal/invite-vsco-creator-session-8)

### Segmentation
- Meta SAM 2 — [WebSAM](https://github.com/Xevion/WebSAM), [sam-web](https://github.com/karlorz/sam-web), [webgpu-sam2](https://github.com/lucasgelfond/webgpu-sam2)
- Google MediaPipe Image Segmenter — [web JS guide](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter/web_js)
- rembg — [GitHub danielgatis/rembg](https://github.com/danielgatis/rembg)

### LLM / agents / structured output
- OpenAI, *GPT-4o* + structured outputs — [docs](https://developers.openai.com/api/docs/models/gpt-4o) *(product docs; no DOI)*
- OpenAI Cookbook, *GPT-4 Vision with Function Calling* — [cookbook](https://developers.openai.com/cookbook/examples/multimodal/using_gpt4_vision_with_function_calling/) *(tutorial; no DOI)*
- Zhou et al., *InstructPipe: Generating Visual Blocks Pipelines with Human Instructions and LLMs* — [DOI 10.1145/3706598.3713905](https://doi.org/10.1145/3706598.3713905) (CHI 2025); [DOI 10.48550/arxiv.2312.09672](https://doi.org/10.48550/arxiv.2312.09672) (arXiv preprint)
- Gupta et al., *CoSTA*: Cost-Sensitive Toolpath Agent for Multi-turn Image Editing — [DOI 10.48550/arxiv.2503.10613](https://doi.org/10.48550/arxiv.2503.10613)
- Wang et al., *GenArtist: Multimodal LLM as an Agent for Unified Image Generation and Editing* — [DOI 10.52202/079017-4077](https://doi.org/10.52202/079017-4077) (NeurIPS 2024); [DOI 10.48550/arxiv.2407.05600](https://doi.org/10.48550/arxiv.2407.05600) (arXiv preprint)
- Cohere, *Structured Outputs* — [docs](https://docs.cohere.com/docs/structured-outputs) *(product docs; no DOI)*

### Generative editing (competitors)
- Photoroom, *Foundation Diffusion Model* — [engineering blog](https://www.photoroom.com/inside-photoroom/photoroom-foundation-diffusion-model) *(blog; no DOI)*
- Photoroom API — [OpenAPI](https://docs.photoroom.com/getting-started/api-reference-openapi) *(product docs; no DOI)*
- Huang et al., *Diffusion Model-Based Image Editing: A Survey* — [DOI 10.1109/TPAMI.2025.3541625](https://doi.org/10.1109/TPAMI.2025.3541625) (IEEE TPAMI 2025); [DOI 10.48550/arxiv.2402.17525](https://doi.org/10.48550/arxiv.2402.17525) (arXiv preprint)
- Wu et al., *ClickDiffusion: Harnessing LLMs for Interactive Precise Image Editing* — [DOI 10.48550/arxiv.2404.04376](https://doi.org/10.48550/arxiv.2404.04376)

### Differentiable / neural rendering
- Li et al., *SLANG.D: Fast, Modular and Differentiable Shader Programming* — [DOI 10.1145/3618353](https://doi.org/10.1145/3618353)
- Duca et al., *An Introduction to Neural Shading* (SIGGRAPH 2025 course) — [DOI 10.1145/3721241.3733999](https://doi.org/10.1145/3721241.3733999); [slides](https://static.graphicsprogrammingconference.com/public/2025/slides/neural-shading/Allan-neural-shading-for-real-time-graphics.pdf)

### Creative coding / adjacent
- TouchDesigner TOPs vs CHOPs — [interactiveimmersive.io](https://interactiveimmersive.io/blog/touchdesigner-operators-tricks/touchdesigner-tops-vs-chops/)
- Apple, *Visualizing sound as an audio spectrogram* — [Developer Documentation](https://developer.apple.com/documentation/accelerate/visualizing-sound-as-an-audio-spectrogram)
- *Seeing Beyond Sound: Visualization and Abstraction in Audio Data Representation* — [DOI 10.48550/arxiv.2511.20658](https://doi.org/10.48550/arxiv.2511.20658)

### Enterprise / templates (boundary)
- Canva Connect, *Autofill API* — [docs](https://www.canva.dev/docs/connect/api-reference/autofills/)

---

## Executive summary

**Domain:** Parametric still-photo styling — conversational control of a typed GPU appearance DSL (style packs + recipe patches), optionally masked regions, explicitly **not** generative inpainting.

**Primary RQ:** Does pack routing plus a validated parametric recipe satisfy most “make it look like X” intent without pixel synthesis—and do regional masks beat global filters for subject/background splits (RQ1/RQ2)?

**Tier A v1:** Upload → 3 style packs → WebGL2 compositor → one-shot LLM router to JSON patch (validated) + semantic sliders → export PNG + shareable recipe JSON.

**Biggest risk / won’t work:** Users ask for **generative** edits (new backgrounds, object removal); parametric ops cannot satisfy without breaking the non-inpaint **POLICY**. Secondary risk: LLM refinement mis-parses deltas (“less grain”).

**Differentiator vs market:** **Deterministic, serializable recipes** and live parametric craft (VSCO/Lightroom-like axes) with **minimal** LLM as router—not another Photoroom/Canva; occupies **spatial still** lane vs sound-visualiser (time) and ADA (agent).
