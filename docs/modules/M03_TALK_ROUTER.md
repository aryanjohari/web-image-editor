# M03 — Talk Router

**Status:** research card  
**Date:** 2026-08-23  
**Depends on:** `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`, `02_CONSTITUTION.md`, `M00_COMPOSITOR.md`, `M01_RECIPE_SCHEMA.md`, `M02_PACKS_AND_SLIDERS.md`, `M04_EXPORT.md`, `I0_CHANGELOG.md`, `I1_CHANGELOG.md`, `I2_CHANGELOG.md`  
**Purpose:** Decide how Prism’s optional **talk** turn — powered by **Google Gemini** as the Tier A provider — maps a short mood/refinement sentence → structured `{ packId? | PathPatch ops }` → the same `validateRecipe` / compositor path as M02 — with offline/fail → sliders still work, no pixels in prompts, no generative edits.

---

## 0. Question

How should optional natural-language control, via **Google Gemini structured JSON**, become **recipe truth** so that:

1. a short mood/refinement sentence maps to catalog `applyPack` and/or allowlisted PathPatch (same axes as M02 sliders),
2. post-normalize apply is **identical** to Lab pack/slider writers (`applyPack` / `applySemanticSlider` → `validateRecipe`),
3. offline / Gemini down / invalid model JSON **fail closed** without breaking the lab (`00` RQ3 mitigation),
4. no image bytes, free GLSL, or generative stories enter the write path,
5. talk does **not** own PNG/hash (M04 already shipped those artifacts),
6. Tier A stays **text-only** router (vision tag-once = PARK / Tier B research)?

Constitutional tension: AI is subordinate (`02` §6; `00` D3) — talk ≡ sliders (`01` §9; `02` §4.3); recipe is truth; refuse inventing a parallel “mood JSON” look language. Provider choice is locked to **Gemini**; the Lab write path stays M01/M02.

---

## 1. Why talk now

I0–I2 shipped upload → composite → packs → sliders → grade → PNG / recipe / hash / hero ([`I0`](../reviews/I0_CHANGELOG.md), [`I1`](../reviews/I1_CHANGELOG.md), [`I2`](../reviews/I2_CHANGELOG.md)). Export is the **artifact** door (M04); talk is the optional **control** door over the **same** closed look language.

Tier A’s lovable loop (`00` §8; `02` §5.1) already includes “optional single LLM turn.” RQ3 (`00` §5) is now testable: prior recipe in context + “less grain / warmer” → correct delta direction, dual-path with sliders if the router fails. M03 must **reuse** M01 PathPatch + M02 `applyPack` / slider helpers — not invent a second write path or reopen M00/M02/M04.

---

## 2. Research map

### A. Structured output / tools (Gemini primary)

| Source | Pattern | Lens | Lesson |
|--------|---------|------|--------|
| **Gemini structured outputs** | JSON Schema–constrained response: `responseMimeType: "application/json"` + schema (`responseSchema` / `responseJsonSchema` on `generateContent`; Interactions: `response_format.mime_type` + `schema`) ([docs](https://ai.google.dev/gemini-api/docs/structured-output); [blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/)) | **FEASIBLE** | Enum pack ids + slider ids in schema; refuse free prose. Prefer **single structured JSON** over multi-turn tools for Prism’s closed `{ apply_pack \| set_slider \| refuse }` shape |
| **Gemini: structured vs function calling** | Structured = format the final answer; function calling = ask host to act mid-turn ([docs](https://ai.google.dev/gemini-api/docs/structured-output#structured-outputs-versus-function-calling)) | **FEASIBLE** | **Primary = structured JSON schema.** Function declarations are a cousin, not needed for one-shot Lab normalize |
| **OpenAI structured outputs** | JSON Schema–constrained response ([docs](https://platform.openai.com/docs/guides/structured-outputs)) | **EVIDENCE** (pattern cousin) | Same industry pattern; **not** Prism’s Tier A provider |
| **Cohere strict tools** | Schema-guaranteed tool args ([docs](https://docs.cohere.com/docs/structured-outputs)) | **EVIDENCE** (pattern cousin) | Closed tools idea; **not** Prism’s provider |
| **Controller + formatter** | Tool-calling brain + cheap structured formatter ([Agenta](https://agenta.ai/blog/the-guide-to-structured-outputs-and-function-calling-with-llms); `00` §E) | **FEASIBLE** | Optional server split; client only consumes validated JSON |
| **Reject:** client `VITE_` Gemini key | Secrets in bundle | **HYPE / unsafe** | Server-side `GEMINI_API_KEY` only (`00` FEASIBLE = server APIs) |

### B. LLM → visual DSL (cite, don’t copy)

| Source | Pattern | Lens | Lesson |
|--------|---------|------|--------|
| **FIBO Scene Director** | LLM → validated JSON; renderer deterministic ([GitHub](https://github.com/msaluck/fibo-scene-director)) | **EVIDENCE** | Talk emits structure; GPU never sees prose (`00` Pattern 1) |
| **InstructPipe** | LLM → visual pipeline / nodes + human edit ([DOI 10.1145/3706598.3713905](https://doi.org/10.1145/3706598.3713905)) | **EVIDENCE** | Tool/patch, not pixels; human+validator in loop |
| **CoSTA\*** | Cost-sensitive tool path + VLM verify ([arXiv 2503.10613](https://doi.org/10.48550/arxiv.2503.10613)) | **EVIDENCE** / not solo MVP | Lesson = tool graph; full agent planner = won’t-chase |
| **GenArtist** | MLLM selects tools + self-correction ([NeurIPS](https://doi.org/10.52202/079017-4077)) | **EVIDENCE** | Router selects from closed library (`00` D3) |
| **Reject:** free chat → GLSL / open effect invent | Open-world “shader author” | **HYPE** | Closed registry (`01` E6; `02` AI law) |

### C. Relative refinement + pack routing

| Source | Pattern | Lens | Lesson |
|--------|---------|------|--------|
| **`00` RQ3 / §E** | Prior recipe in context; “less grain” → `grain.amount -= Δ` | **FEASIBLE** | Refinement needs **current** slider amounts, not blobs |
| **`00` Pattern 1 + §8** | One call → `{ packId, patch }` + slider fallback | **FEASIBLE** | Mood → one of 3 packs + optional intensity/patches |
| **M02 catalog** | `editorial-bw` \| `warm-film` \| `poster-punch` (`src/packs/catalog.ts`) | **shipped** | Enum only these ids; unknown → refuse |
| **M02 P6 / M01 R9** | Sliders → PathPatch → `validateRecipe` | **shipped** | Talk must hit same helpers after normalize |

### D. Security / cost / refuse generative

| Source | Pattern | Lens | Lesson |
|--------|---------|------|--------|
| **VISION / `01` §9** | No pixels in prompt; LLM once per turn | **POLICY** | Recipe summary only |
| **`00` D7 / Pattern 5** | No inpaint in v1; Photoroom lane is competitor | **POLICY** | Refuse “put me on a beach” |
| **Latency budget** | `<2 s` prompt → validated patch (`00` §2) | **FEASIBLE** target | Timeout / Gemini down → fail closed to sliders |
| **Gemini multimodal** | Image/video/audio input exists ([vision docs](https://ai.google.dev/gemini-api/docs/vision)) | **PARK** for Tier A | Capability confirmed; Prism Tier A = **text-only**; tag-once = Tier B |
| **Reject:** send full photo every turn | Cost + privacy + not required for grade router | **HYPE** for Tier A | Vision tag-once = PARK (§4 / D4) |

---

## 3. API / turn shape

**Transport (document; I3 implements):** server route (e.g. `POST /api/talk`) calls **Google Gemini** with a **server-held** `GEMINI_API_KEY`. Browser sends JSON only — never Blobs, never canvas data-URLs, never a client Gemini key.

### Provider (LOCKED — Tier A)

| Lock | Choice |
|------|--------|
| **Provider** | **Google Gemini** via [Gemini Developer API](https://ai.google.dev/gemini-api/docs) / [Google AI Studio](https://aistudio.google.com/apikey) (not Vertex for MVP) |
| **Default model** | `gemini-2.5-flash` — Flash-class latency/cost ([model card](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash)). **Provisional:** Google model ids churn; pin at I3 implement time |
| **Upgrade path** | `gemini-2.5-pro` (or current Pro sibling) if RQ3 accuracy fails Flash |
| **Schema mode** | **Structured JSON** — `responseMimeType: "application/json"` + schema (`responseSchema` or `responseJsonSchema` on `@google/genai` `models.generateContent`). Map enums for pack/slider ids. **Not** multi-turn function calling as primary |
| **SDK** | **`@google/genai`** (GA successor to legacy `@google/generative-ai`; [migrate](https://ai.google.dev/gemini-api/docs/migrate)) |
| **Env** | Server-only `GEMINI_API_KEY` (SDK also accepts `GOOGLE_API_KEY`; prefer `GEMINI_API_KEY` in docs). **No** `VITE_` / browser exposure |
| **Auth surface** | API key from AI Studio; key never leaves the talk route |

Lab-facing request/response shapes below are **unchanged** at the Lab boundary — Gemini is an implementation detail behind normalize.

### Request (minimum)

```text
TalkRequest {
  text: string                 // short mood / refinement sentence
  recipeContext: {
    packId: string | null
    packVersion: string | null
    sliders: {                 // current absolute amounts (M02 ids)
      exposure, contrast, warmth, chroma,
      fade, grain, vignette, duotone?: number
    }
    // optional: main effect id list for ensureEffect awareness
    mainEffectIds?: string[]
  }
  // intentionally omitted: image bytes, AssetRefs payloads, full objects[] dump
}
```

### Response (model → normalize → apply)

```text
TalkResponse {
  applyPack?: { packId: PackId; intensity?: number }   // intensity 0..1; default 1
  patches?: Array<                                       // semantic, pre-PathPatch
    | { op: "set_slider"; sliderId: SemanticSliderId; value: number }      // absolute
    | { op: "delta_slider"; sliderId: SemanticSliderId; delta: number }    // relative
  >
  say?: string             // ≤1 short line; UI toast only; never recipe truth
  refuse?: { code: string; reason: string }  // generative / OOS intent
}
```

### Error codes (client-visible)

| Code | Meaning | Lab behavior |
|------|---------|--------------|
| `OFFLINE` / `TIMEOUT` / `HTTP_*` | Network / Gemini down | Keep recipe; show error; sliders work |
| `SCHEMA` | Model JSON fails schema / parse | Same |
| `UNKNOWN_PACK` | packId ∉ catalog | Same |
| `UNKNOWN_SLIDER` | sliderId ∉ M02 set | Same |
| `ALLOWLIST` / `OOR` / `VALIDATE` | PathPatch / validate fail | Same (M01 R10) |
| `REFUSE_GENERATIVE` | Inpaint / beach / remove person | Same; copy explains parametric-only |

---

## 4. Closed tool / schema contract

Allowlisted **semantic tools** expressed as **one Gemini JSON Schema** (structured output — §2.A), not as an open chat essay or free PathPatch strings:

| Semantic tool | Schema fields | Maps to shipped API |
|---------------|---------------|---------------------|
| `apply_pack` | `applyPack.packId` ∈ {`editorial-bw`,`warm-film`,`poster-punch`} (`enum`); optional `intensity` ∈ [0,1] | `applyPack(recipe, packId, { intensity })` |
| `set_slider` | `patches[]` item `op: "set_slider"`; `sliderId` ∈ M02 set (`enum`); `value` number | → absolute after clamp → `applySemanticSlider` |
| `delta_slider` | `patches[]` item `op: "delta_slider"`; `sliderId`; `delta` number | current + delta → clamp → `applySemanticSlider` |
| `refuse` | `refuse.code` + `refuse.reason` | no recipe write |

**Why schema over function calling:** Gemini docs treat structured outputs as “format the final answer” and function calling as “ask the host to act mid-turn.” Prism needs one closed `TalkResponse` per Send → normalize → apply. Function-call mode is optional later if multi-step tool loops appear; **not** Tier A primary.

**Schema notes (Gemini, as of research):**

- String `enum` supported for pack/slider ids ([structured output](https://ai.google.dev/gemini-api/docs/structured-output)).
- `anyOf` available for union-like patch ops if needed ([JSON Schema enhancements](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/)).
- `application/json` **without** a schema is only a weak hint and can still yield malformed JSON — always send schema ([Cloud control-generated-output](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/control-generated-output)).
- Syntactically valid JSON can still be semantically wrong → **post-normalize allowlist** + fail closed (`SCHEMA` / `UNKNOWN_*`).
- Very large / deeply nested schemas may be rejected — keep TalkResponse flat.

**No schema fields for:** free PathPatch strings from the model, new Effect.ids, GLSL, asset upload, export, hash, text rewrite as “look,” overlay invent.

### Absolute vs relative (LOCKED)

| Policy | Choice |
|--------|--------|
| **Primary for refinement language** | **Relative delta** (`delta_slider`): “less grain,” “warmer,” “more contrast” |
| **Absolute** | `set_slider` when user states a level (“grain at 0.2”) or after pack when model sets axes |
| **Normalize before validate** | Server or client **normalizer** (not Gemini): `next = clamp(current + delta, slider.min, slider.max)` using `SEMANTIC_SLIDERS` / `DUOTONE_SLIDER` ranges (`src/packs/sliders.ts`) — **same pre-emit clamp as Lab sliders** |
| **Validator** | Still **rejects OOR** if anything slips through (M01 R10); no silent clamp inside `validateRecipe` |
| **Default Δ magnitude** | Small fixed steps if model omits size (recommend: ~0.1 of slider span; document in I3) — wrong direction still fails RQ3 |

### One turn composition (LOCKED)

A single turn **MAY** both `apply_pack` and slider patches. Order:

```text
1) if apply_pack → applyPack(...)
2) then each set/delta → ensureEffect + applySemanticSlider / PathPatch
3) single commit to Lab state (or atomic: all-or-nothing; prefer all-or-nothing on any step fail)
```

### `packId` provenance (LOCKED — align M02)

Talk slider patches **do not clear** `packId` / `packVersion` (M02 §6 user overrides; Lightroom-like). Only `apply_pack` or identity `resetLook` changes pack provenance. Do **not** PathPatch `/packId` alone as a fake pack apply — must call `applyPack` merge (keeps AssetRefs; M01 R11).

### Vision (LOCKED Tier A)

**Text-only router.** Gemini multimodal / image understanding exists ([vision](https://ai.google.dev/gemini-api/docs/vision)) but stays **PARK / Tier B** — not required for I3; if ever added, tags go to `meta` only, never rewrite pixels, never every turn.

---

## 5. Apply pipeline

```text
user text + recipeContext (no Blobs)
  → POST /api/talk (server GEMINI_API_KEY)
  → Gemini structured JSON (responseMimeType + schema enums)
  → normalize:
       unknown pack/slider → error
       delta → absolute clamped value
       refuse generative → REFUSE_*; no write
  → apply on copy:
       applyPack? → src/packs/applyPack.ts
       patches? → ensureEffect + applyPathPatch / applySemanticSlider
  → validateRecipe (already inside those helpers)
  → on OK: commit Lab recipe (same as slider/pack)
  → on FAIL: discard; surface code; prior recipe unchanged
```

**Identity rule:** After normalize, a talk turn that sets `grain` to `0.2` must produce the **same** recipe field mutation as dragging the Grain slider to `0.2` (`01` acceptance §10.3; M01 falsifier #3).

---

## 6. Lab UX stub

Minimal proving chrome for I3 (not a chat product):

- One text field + **Send** (disabled while in-flight).
- Last error / refuse reason under the field (reuse error banner pattern).
- Optional one-line `say` as ephemeral toast — **not** an agent transcript.
- Pack picker + semantic sliders **remain visible** (dual path; `00` RQ3 mitigation).
- No multi-agent timeline, no prompt library marketplace, no redesign of Lab layout beyond the stub.

Talk does not grow export/share buttons (M04 owns those).

---

## 7. Security / egress / offline

| Concern | Lock |
|---------|------|
| **API key** | Server-only `GEMINI_API_KEY`; **no** `VITE_` / client-exposed secrets |
| **Egress body** | Text + compact `recipeContext` only; default **no** image bytes |
| **Timeout** | Hard client timeout (e.g. 8–15 s); treat as `TIMEOUT` |
| **Rate** | Soft limit per session/IP on the route (sketch; solo-dev FEASIBLE) |
| **Offline / 5xx / Gemini down** | Fail closed; Lab packs/sliders/export unchanged |
| **Invalid / empty JSON** | Treat as `SCHEMA`; no partial write |
| **Prompt injection** | Schema enums + post-normalize allowlist; model cannot widen tools |
| **Cost** | One Gemini call per Send; no vision by default |

---

## 8. Falsifiers

| # | Falsifier | Meaning |
|---|-----------|---------|
| F1 | RQ3: **>40%** refinement turns wrong op or wrong **direction** | Router insufficient; dual-path must stay (`00` §5) |
| F2 | Talk accepts illegal path / unknown Effect.id | Allowlist / closed registry breach |
| F3 | Talk OOR accepted while slider OOR rejected (or different error class) | Validator identity broken (M01 #3) |
| F4 | Talk-only “look language” that never maps to PathPatch/`applyPack` | Parallel schema; constitution fail |
| F5 | Generative story accepted (“beach,” remove person) as success write | `00` D7 / won’t-chase breach |
| F6 | Offline / Gemini fail bricks Lab (packs/sliders dead) | RQ3 mitigation fail (`01` talk failure → sliders) |
| F7 | Talk clears `packId` on slider-like patch | Diverges M02 provenance rule |
| F8 | Client bundle contains Gemini / LLM secret | Security breach |

---

## 9. Won’t chase

- Canva-style prompt→template / Autofill Jobs API  
- Inpaint, outpaint, object remove, beauty retouch, “AI made the art”  
- Multi-agent planners (full CoSTA\* / GenArtist product)  
- Fine-tuned local LLM as MVP requirement  
- Vision required every turn; sending full photos by default  
- Free chat → GLSL; parallel mood JSON schema; **client-side Gemini key**  
- **OpenAI-first** or Cohere as Tier A provider  
- **Multi-provider adapter framework** as MVP  
- Vertex AI as default (Gemini Developer API / AI Studio key is enough)  
- Legacy `@google/generative-ai` as the I3 default (prefer `@google/genai`)  
- Reopening M00 hybrid, M01 storage/PathPatch model, M02 pack trio, M04 export  
- New effect ids or slider axes beyond M02  
- Implementing `docs/reviews/I3_*` or app code in this docs task  

---

## 10. Decision log

| # | Topic | Decision | Why | Cite |
|---|-------|----------|-----|------|
| T1 | LLM role | Router only → pack + bounded patches | Never pixel author | `00` D3; `02` §6; VISION |
| T2 | Write path | Normalize → `applyPack` / `applySemanticSlider` / PathPatch → `validateRecipe` | talk ≡ sliders | `01` §9; M01 R9; M02 P6 |
| T3 | Delta policy | **Relative primary**; clamp to slider range **before** validate; emit absolute | RQ3; match Lab clamp | `00` §E; `sliders.ts` |
| T4 | Combo turn | **May** `apply_pack` then slider patches; all-or-nothing | `00` §8 `{ packId, patch }` | `00` §8 |
| T5 | packId on patch | **Do not clear** on talk slider patches | Align M02 overrides | M02 §6 |
| T6 | Pack apply | Must use `applyPack` merge; no fake `/packId` only | Keep AssetRefs | M01 R11; `applyPack.ts` |
| T7 | Context | `packId`, `packVersion`, slider amounts (+ optional mainEffectIds); **no** Blobs | Cost/privacy; RQ3 | `01` §9; VISION |
| T8 | Unknown/OOR | Fail closed; keep prior recipe; shared error classes | Constitution | M01 R10; `02` fail closed |
| T9 | Vision | Tier A **text-only**; Gemini multimodal PARK | D4 optional research | `00` D4 / Pattern 2; [vision](https://ai.google.dev/gemini-api/docs/vision) |
| T10 | Secrets | Server `GEMINI_API_KEY` only; no `VITE_` | Solo FEASIBLE + safety | `00` FEASIBLE; [API keys](https://ai.google.dev/gemini-api/docs/api-key) |
| T11 | Artifacts | Talk does not own PNG/hash/hero | M04 shipped | M04; I2 |
| T12 | UX | One chat box + last error; dual-path sliders | Not agent product | `00` RQ3 mitigation |
| T13 | Catalog | Enum 3 pack ids only | M02 P2/P3 | `catalog.ts` |
| T14 | Generative | Explicit `refuse`; no write | POLICY | `00` D7; `01` §10.9 |
| T15 | Provider | **Google Gemini** (Developer API / AI Studio); not OpenAI/Cohere Tier A | Lock provider; pattern cousins stay EVIDENCE | This card §2.A; [Gemini API](https://ai.google.dev/gemini-api/docs) |
| T16 | Schema mode | **Structured JSON** (`responseMimeType: application/json` + `responseSchema` / `responseJsonSchema`); function calling not primary | Closed TalkResponse in one shot | [structured output](https://ai.google.dev/gemini-api/docs/structured-output) |
| T17 | Default model | `gemini-2.5-flash` (provisional); upgrade `gemini-2.5-pro` | Latency/cost; RQ3 escape hatch | [2.5 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash) |
| T18 | SDK / env | `@google/genai` + server `GEMINI_API_KEY`; no Vertex MVP; no client key | Current GA SDK; migrate away from `@google/generative-ai` | [migrate](https://ai.google.dev/gemini-api/docs/migrate); [js-genai](https://github.com/googleapis/js-genai) |

---

## 11. References

- Gemini structured outputs — [ai.google.dev/gemini-api/docs/structured-output](https://ai.google.dev/gemini-api/docs/structured-output)  
- Gemini structured outputs (JSON Schema / property order) — [Google blog](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/)  
- Gemini `generateContent` / JSON mode fields — [API reference](https://ai.google.dev/api/generate-content)  
- Gemini function calling (cousin; not Tier A primary) — [docs](https://ai.google.dev/gemini-api/docs/function-calling)  
- Gemini 2.5 Flash model card — [gemini-2.5-flash](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash)  
- Gemini API keys / AI Studio — [api-key](https://ai.google.dev/gemini-api/docs/api-key)  
- Migrate to `@google/genai` — [migrate](https://ai.google.dev/gemini-api/docs/migrate); [googleapis/js-genai](https://github.com/googleapis/js-genai)  
- Gemini image understanding (PARK / Tier B) — [vision](https://ai.google.dev/gemini-api/docs/vision)  
- OpenAI structured outputs — [platform docs](https://platform.openai.com/docs/guides/structured-outputs) *(pattern cousin; not provider)*  
- Cohere strict tools — [structured outputs](https://docs.cohere.com/docs/structured-outputs) *(pattern cousin; not provider)*  
- Controller + formatter — [Agenta guide](https://agenta.ai/blog/the-guide-to-structured-outputs-and-function-calling-with-llms)  
- FIBO Scene Director — [GitHub](https://github.com/msaluck/fibo-scene-director)  
- InstructPipe — [DOI 10.1145/3706598.3713905](https://doi.org/10.1145/3706598.3713905)  
- CoSTA\* — [arXiv 2503.10613](https://doi.org/10.48550/arxiv.2503.10613)  
- GenArtist — [DOI 10.52202/079017-4077](https://doi.org/10.52202/079017-4077)  
- In-repo: `VISION.md`, `00_FIELD_RESEARCH.md` (§E, RQ3, Pattern 1–2, D3/D4, §8), `01_ENGINE.md` §9, `02_CONSTITUTION.md` §6, `M00`–`M02`, `M04`, I0–I2 changelogs, `src/recipe/pathPatch.ts`, `src/packs/{sliders,applyPack,catalog}.ts`

---

## Operator summary

- **Tier A talk provider = Google Gemini** (`gemini-2.5-flash` provisional; `@google/genai`; server `GEMINI_API_KEY`).  
- **Talk writes recipe only** via the same `applyPack` + PathPatch / `applySemanticSlider` path as Lab; never pixels, never free GLSL.  
- **Structured JSON schema** (`application/json` + enums) — not OpenAI-first, not multi-provider MVP, not client keys.  
- **Relative deltas** (“less grain”) are primary; normalizer clamps to M02 slider ranges **before** validate; validator still rejects OOR.  
- **One turn may pack + patch**; slider-like talk **does not** clear `packId` (M02 provenance).  
- **Context = pack + slider amounts** (no photo bytes); unknown pack/path/generative / Gemini down / invalid JSON → fail closed; offline → sliders still work.  
- **Tier A = text-only** router; Gemini vision PARK; M04 keeps export/share.

## I3 implement pointer

**I3 slice (plan file later):** (1) server `POST /api/talk` → `@google/genai` `generateContent` with `responseMimeType: "application/json"` + schema enums (packs/sliders) + server `GEMINI_API_KEY` / model `gemini-2.5-flash`, (2) normalizer (delta→absolute clamp; refuse generative; Gemini/SCHEMA fail → fail closed), (3) Lab chat stub → reuse `applyPack` / `applySemanticSlider`, (4) dual-path offline test + falsifiers F1–F8. No new effect axes; no export ownership; no multi-provider framework.
