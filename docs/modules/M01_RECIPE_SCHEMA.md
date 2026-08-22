# M01 — Recipe Schema & Asset Storage

**Status:** research card  
**Date:** 2026-08-23  
**Depends on:** `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`, `02_CONSTITUTION.md`, `M00_COMPOSITOR.md`  
**Purpose:** Lock how Prism **stores**, **validates**, **patches**, **shares**, and **reproduces** looks — the recipe contract and asset sidecar — separate from GPU draw details (M00) and UI/router surfaces (later). This card decides what travels in JSON/hash, what stays local as binary, and how talk and sliders mutate one document under fail-closed law.

---

## 0. Question of this module

How should Prism encode a look so that:

1. the same machine can reload it tomorrow,
2. another person can receive a shareable instruction set without image bytes in the URL,
3. talk and sliders always write the same validated document,
4. M00’s hybrid compositor has a minimal Tier A schema it can render?

The constitutional tension is fixed: **recipe is truth**, **images are not in the recipe** (`02` §7.8), **invalid patches fail closed** (`02` §2.5), and M00 already locked **`objects[]`** as the document model. This card must not reopen pass architecture. It must reconcile remaining `layers[]` wording in `01`/`02` as **doc drift**, not reopen Tier A caps.

---

## 1. Reproduce model (three artifacts)

Prism never stores “the look” as one blob. Three artifacts have different jobs:

| Artifact | Contents | Reproduces look? | Travels how? |
|----------|----------|------------------|--------------|
| **Recipe JSON** | Instruction set: versions, pack id, ordered `objects[]`, effect params, text content, **asset refs** (ids/urls — not pixels) | **Yes, iff assets resolve** | File download, clipboard, **URL hash** |
| **Assets** | Binary Blobs/Files keyed by `assetId` (or fetched by `url`) | Required for photo/overlay textures | Local IndexedDB (lab); bundled/CDN URL (hero deploy) |
| **PNG export** | Rendered snapshot at export RT resolution | **Pixels only** — not editable truth | Download; portfolio embed as image |

**Same-machine tomorrow:** reload recipe JSON + resolve every `AssetRef` from IndexedDB (or re-upload matching files) → validate → M00 draw. Missing asset → **fail loudly** (no blank canvas pretending success).

**Share with someone else:** send recipe (hash or JSON). Recipient supplies textures (re-upload or local library match). Optional companion: send the PNG as a *preview*, knowing it is not the recipe.

**POLICY (locked here):** URL hash carries **recipe only**. No image bytes, no base64 photos in the hash (`01` E9; `00` D2/Shaddy pattern adapted for photo apps).

---

## 2. Research map

### A. Portable recipe patterns (no pixels in JSON)

| Source | What travels | What stays local | Lesson for Prism |
|--------|--------------|------------------|------------------|
| **Shaddy** | LZ-compressed **recipe JSON in URL hash**; fullscreen WebGL2; no backend ([Devpost](https://devpost.com/software/shaddy)) | N/A for generative cards (no user photo store) | Hash = full instruction set; round-trip is the share product |
| **VideoFlow** | Per-layer ordered `effects[]` JSON; **resolution-agnostic** stack ([blog](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)) | Source media / render size | Recipe describes ops, not canvas pixels; preview/export RT may differ |
| **FILTR** | Presets = stack + params; **file references by name**, not blobs; media reconnect on re-import ([FILTR WIP](https://antlii.work/WIP-Tool)) | Media pool files (not embedded; not session-persisted in their model) | Strongest photo-app precedent: refs in preset, bytes elsewhere |
| **Lumen (Legenki)** | Modular stack + presets; media pool on device; Pro preset pack import/export ([Lumen](https://legenki.com/lumen/)) | Uploaded media | Presets are craft values, not pixel archives |
| **kampos** | Ordered `effects[]` on a compositor instance (~4KB DSL) ([GitHub](https://github.com/wix-incubator/kampos); [Wix](https://www.wix.engineering/post/introducing-kampos-a-tiny-and-fast-effects-compositor)) | Source textures bound at runtime | Effect arrays are first-class; texture bind is orthogonal |
| **FIBO Scene Director** | LLM → **validated JSON**; renderer deterministic from structured scene ([msaluck/fibo-scene-director](https://github.com/msaluck/fibo-scene-director)) | Model/seed side; not Prism’s GPU lane | Pattern match for talk: structured patch, not free prose → pixels |

**Answer:** hash/JSON carry **parametric truth + refs**. Pixels stay in an asset store or are fetched by explicit URL for deploy/hero. Embedding photos in share URLs is a won’t-chase (size, perf, privacy).

### B–C. Browser asset storage & reference shapes

| Model | Pros | Cons | Tier A |
|-------|------|------|--------|
| **IndexedDB `assetId → Blob`** | Survives refresh; native Blob (no base64 tax); async ([IDB media practice](https://www.nazarboyko.com/articles/indexeddb-for-serious-frontend-storage); [Scanbot](https://scanbot.io/techblog/storage-wars-web-edition/)) | Quota/eviction (ask `persist()` later); Safari stricter | **Default lab** |
| In-memory `Map` + object URLs | Fast to prototype | Lost on reload; leak if not revoked | Dev-only |
| base64 in recipe/URL | “Self-contained” myth | +~33% size, main-thread cost, hash blowup | **Reject** |
| Content-addressed SHA | Dedup + integrity | Extra hash pipeline; UX for collisions | Optional later |
| Remote blob/CDN | Multi-device share of pixels | Backend/CDN product; auth | Later |

**AssetRef options:** `{ assetId }` (lab), `{ url }` (hero/deploy bundled textures), `{ hash }` (optional later), inline base64 (**reject**).

**Recommend:** dual-ref union — lab uses `assetId`; hero/deploy may use `url`; never both-required; never inline bytes.

### D. Patch / merge protocol

| Format | Fit for Prism | Risk |
|--------|---------------|------|
| Full recipe replace | Simple pack apply / load file | Talk/sliders should not rewrite whole doc every nudge |
| **JSON Merge Patch (RFC 7396)** | Partial object overlays | Liberal merge; `null` = delete; **arrays replace wholesale**; merge itself rarely errors — validation must be post-hoc ([erosb comparison](https://erosb.github.io/post/json-patch-vs-merge-patch/)) |
| **JSON Patch (RFC 6902)** | Precise path ops + atomic fail | Overpowered (`add`/`remove`/`move` on arbitrary pointers); LLM may invent illegal paths |
| **Prism `{ path, value }[]` allowlist** | Same mental model as sliders; closed paths; easy structured-output schema | Custom (document it); must still post-validate full recipe |

**Requirements (constitution):** same validator after merge; invalid → fail closed; talk ≡ sliders field identity (`01` §9).

### E–G. Effects, versions, share/hero

M00 places `effects[]` on each object. `01` §6 is the closed op registry. FIBO-style systems version structured prompts; FILTR broke old presets on format change (explicit refuse) — good fail-closed precedent. PNG ≠ recipe; hero = same recipe + resolved textures; `pointer-events: none`; reduced-motion freezes time ops (`01` hero stub).

---

## 3. Storage options — recommendation

**Tier A default**

1. **Recipe document** — in-memory source of truth; optional `localStorage`/`IDB` key for last recipe JSON (small).
2. **Asset library** — IndexedDB object store: `assetId` → `{ blob, mime, width?, height?, createdAt, name? }`.
3. **Multiple uploads allowed** in the library; **Tier A render** still obeys M00 caps (1 main + 1 overlay + 1 text active).
4. **Object URLs** — ephemeral views of Blobs for `<img>`/decode; revoke on replace/delete.
5. **PNG** — export only; not written back into the recipe.
6. **URL hash** — LZ/base64url of recipe JSON (Shaddy-class); size-budget the recipe, not the photo.

Won’t chase for Tier A: remote asset CDN, content-addressed mandatory hashing, OPFS-only paths, embedding bytes in JSON.

---

## 4. Recipe document shape

Canonical root uses **`objects[]`** (M00 C1). Pseudocode — shape, not TypeScript:

```text
Recipe {
  schemaVersion: string          // document shape rev, e.g. "1"
  engineVersion: string          // compositor/op semantics rev
  packId: string | null
  packVersion: string | null     // pack content rev when a pack is applied
  canvas?: {
    width: number                // logical compose size hint (optional)
    height: number
    background?: string          // later; Tier A may ignore
  }
  meta?: {
    title?: string
    createdAt?: string           // ISO; optional
    notes?: string
  }
  objects: Object[]              // ordered; z also authoritative for draw order
}

Object {
  id: string                     // stable within recipe
  kind: "image" | "text"         // later kinds parsed, rejected if active unsupported
  role?: "main" | "overlay"      // required for kind=image in Tier A
  z: number
  visible: boolean
  opacity: number                // 0..1
  blend: "normal" | "multiply" | "screen" | "overlay"
  transform: { x, y, scaleX, scaleY, rotation }
  crop?: { x, y, width, height, fit?: "contain" | "cover" | "fill" }
  maskRef?: AssetRef             // Tier B stub; Tier A: ignore if absent, reject if active required
  effects: Effect[]
  // kind-specific:
  source?: AssetRef              // image
  text?: TextSource              // text
}

AssetRef =
  | { type: "id", assetId: string }
  | { type: "url", url: string }           // hero/deploy; absolute or app-relative
  // rejected: { type: "inline", data: base64... }

TextSource {
  content: string                // lives IN recipe (operator preference; locked)
  fontFamily: string
  fontWeight: number | string
  fontSize: number               // CSS-px at rasterize; export scale policy = M00/export RT
  letterSpacing?: number
  lineHeight?: number
  color: string                  // CSS color; validated
  align?: "left" | "center" | "right"
}

Effect {
  id: OpId                       // closed registry key
  params: Record<string, number | string | boolean>
}
```

### Field glossary (dense)

| Field | Role |
|-------|------|
| `schemaVersion` | Parse/migrate gate for document shape |
| `engineVersion` | Refuse silent look drift when op math changes |
| `packId` / `packVersion` | Named craft provenance; pack apply writes these |
| `objects[]` | Sole scene list; **not** `layers[]` |
| `AssetRef` | Pointer only; resolution is storage’s job |
| `TextSource` | Typography + string; rasterized to texture at render (M00 C9) |
| `effects[]` | Per-object ordered ops; **no document-level global op list** (E13 confirmed below) |

---

## 5. Tier A validation rules

### Caps (from M00; binding)

Among objects with `visible !== false`:

- ≤1 `kind=image` + `role=main`
- ≤1 `kind=image` + `role=overlay`
- ≤1 `kind=text`
- Blend ∈ {`normal`,`multiply`,`screen`,`overlay`}
- `opacity` ∈ [0, 1]; transforms finite numbers
- `maskRef` must be absent or unused (no active mask requirement)

### Parse-all / reject-active-unsupported (M00 C8)

1. Structurally parse the full `objects[]`.
2. Collect **active** unsupported kinds, over-cap roles, or effects that need non-admitted render modes.
3. **Reject loudly** — do not drop objects silently and draw a partial look.

### Effect admissibility (Tier A ship set from `01` §6.7)

| Object | Admissible `Effect.id` (A) | Notes |
|--------|----------------------------|-------|
| `image(main)` | `exposure`, `contrast`, `saturation`, `temperature`, `fade` \| `duotone`, `grain`, `vignette`; simple `cropScale` via crop/transform preferred | Spatial neighborhood ops (blur) → reject or later promote |
| `image(overlay)` | Prefer none or light: `opacity`-class already on object; optional `duotone`/`fade` if needed | Heavy grade on overlay is later |
| `text` | **None** in Tier A (`effects: []`) | Style via `TextSource` + object opacity/blend/transform |

Unknown `id` → reject. Extra params beyond registry → reject (fail closed; no silent ignore).

### Round-trip JSON rules

- `JSON.parse(JSON.stringify(recipe))` deep-equals recipe
- No `NaN`, `Infinity`, `-Infinity`, `undefined`
- No sparse arrays; no functions
- Asset refs never contain payload bytes

### Missing assets

Validator may pass **schema**; compositor **must not** draw success if a required `AssetRef` fails to resolve. Surface: explicit error state (“asset `…` missing — re-upload”), not empty GL clear.

---

## 6. Patch protocol (talk + sliders + packs)

### Decision

**Transport:** Prism **PathPatch** — an ordered array of `{ path: string, value: JsonValue }` where `path` is a JSON Pointer into an **allowlisted** prefix set.

**Not chosen as primary:** full RFC 6902 (too many ops for LLM/slider identity) or RFC 7396 alone (silent liberal merge; array wholesale replace is a footgun for `objects`/`effects`).

**Apply pipeline (all writers):**

```text
currentRecipe
  → apply PathPatch (or pack merge — see below) onto a copy
  → validateRecipe(candidate)     // same function for talk, sliders, load, pack
  → on OK: commit + dirty compositor
  → on FAIL: discard candidate; surface error; keep prior recipe
```

### Allowlist (illustrative prefixes)

- `/packId`, `/packVersion`
- `/objects/{id|index}/opacity|blend|visible|z|transform/...`
- `/objects/{…}/effects/{index}/params/{key}`
- `/objects/{…}/text/content|fontSize|…`
- `/objects/{…}/source` (AssetRef replace only — not byte writes)

Forbidden: inventing new `Effect.id`, new object kinds, `/schemaVersion` demotion tricks without explicit migrate API.

### Numeric policy

**Reject out-of-range** (constitution fail-closed). Do **not** clamp-and-accept in the validator. UI sliders may clamp *before* emitting a patch so the emitted value is already legal; talk that emits `grain.amount: 9.0` when max is `1` fails with the **same** error class as a hand-authored bad slider path.

### Pack apply

Packs are named base recipes + semantic axes (`01` packs organ; M02 owns catalog content).

- **Apply pack:** merge pack’s object/effect defaults **onto** current recipe (preserve user `assetId`s on main/overlay; replace look params + set `packId`/`packVersion`).
- **Load recipe file / hash:** **replace** document (after validate).
- Talk must not ship a second pack language — only PathPatch + optional `packId` set that triggers the same merge helper.

### Full replace

Allowed for: file open, hash hydrate, “reset to identity,” tests. Not the default for per-slider ticks.

---

## 7. Share / hash / hero asset resolution

| Mode | Recipe | Assets |
|------|--------|--------|
| **Lab share link** | `#r=<compressed recipe>` | Recipient re-uploads or matches library by name/id UX |
| **Recipe JSON download** | File | Same |
| **PNG download** | Not included (optional sidecar JSON as second file) | N/A — pixels only |
| **Hero embed** | Inline JSON or fetched recipe module | Prefer `{ type:"url" }` to bundled static textures **or** same `assetId` store if the host page bootstraps IDB (unusual). Deploy path: **bundled URL**. |
| **Hero UX stubs** | — | `pointer-events: none`; `prefers-reduced-motion` → freeze `u_time` / still (`01`) |

**Reproduce story:** a look is recipe instructions plus resolvable textures; a hash alone never smuggles the photo.

**Export RT policy (document, don’t solve compositor):** PNG is source/native resolution; preview is display-sized (`01` E14). Human “looks the same” is the Tier A check; ΔE/SSIM remain **not measured**. If PNG ≠ preview, treat as export/parity bug — not a schema escape hatch.

---

## 8. Alignment notes (`objects[]` vs `layers[]` drift)

| Doc | Current wording | M01 lock |
|-----|-----------------|----------|
| **M00** | `objects[]`; object vs layer distinction | **Binding** |
| **`01_ENGINE`** | Organ map + §7 still say `layers[]` / “1 live photo layer”; E3 | **Doc drift** — update later to `objects[]` + Tier A caps (1 main + 1 overlay + 1 text). Do not edit `01` in this task beyond awareness. |
| **`02_CONSTITUTION`** | Tier A “one live image layer”; schema open to `layers[]` | **Doc drift** — same future fix; constitutional *intent* (bounded Tier A, recipe truth) preserved by M00/M01 caps |

### E13 reconciliation

`01` E13: *“v1 recipe is per-layer ops only; no document-level global ops yet.”*

**Confirm with amendment of terms:** Tier A keeps **per-object `effects[]` only** — no root-level `ops[]` / global grade list. “Layer” in E13 means the render unit after normalization; recipe entities are **objects**. Document-level globals remain won’t-chase until a falsifier forces them (e.g. true adjustment-layer semantics). Overlay/text grades stay local to those objects.

---

## 9. Open questions / falsifiers

1. **Hash round-trips but look is wrong because assets missing**  
   Falsifier of “share = done”: need explicit UX contract (block render + prompt re-upload). Schema alone cannot fix this.

2. **IndexedDB asset missing / evicted**  
   Compositor must fail loudly, not render blank success. Falsifier: silent clear-color “looks broken” with no error.

3. **Talk patch vs slider path → different validator errors for same intent**  
   Falsifier of dual-path identity (`01` §9 / `02` §4.3). Errors must share codes/paths.

4. **Export PNG ≠ preview at same conceptual grade**  
   Document as export RT / DPR policy (`01` E14); do not invent a second recipe. Falsifier: users trust PNG as recipe truth.

5. **PathPatch allowlist too narrow for pack axes**  
   Falsifier: packs need fields sliders cannot reach → expand allowlist deliberately, don’t bypass validator.

6. **`url` AssetRef vs CORS/tainted canvas on hero**  
   Falsifier: export/readback blocked on cross-origin textures — hero deploy must use same-origin or CORS-clean assets.

7. **Text rasterize scale between preview and export**  
   Owned with M00 C9; schema only stores CSS-px intent. Falsifier: soft/wrong type size on PNG.

---

## 10. Won’t chase

- Base64 / data-URL photos in recipe or hash  
- Multi-device asset sync / accounts / CDN as Tier A requirement  
- Full RFC 6902 surface for the LLM  
- Document-level global op stack  
- OpenAPI file in this card  
- Mask Tier B deep dive (`maskRef?` stub only)  
- Pack catalog content (M02)  
- LLM prompt / router API (M03)  
- Compositor shaders / pass graphs (M00)  
- Canva / Jobs / inpaint / generative pixels  

---

## 11. Decision log

| # | Topic | Decision | Why |
|---|-------|----------|-----|
| R1 | Canonical list | `objects[]` is recipe truth; `layers[]` in `01`/`02` = drift to fix later | M00 C1 binding |
| R2 | Three artifacts | Recipe / assets / PNG have separate jobs | Constitution: recipe truth vs pixel output |
| R3 | Lab asset store | IndexedDB `assetId → Blob` (+ metadata) | Persist across refresh; no base64; solo-dev FEASIBLE |
| R4 | AssetRef | `{type:"id",assetId}` lab; `{type:"url",url}` hero/deploy; reject inline | FILTR refs-only + deploy needs |
| R5 | Library vs caps | Many uploads in library; render caps = M00 | Soft preference + fail-closed runtime |
| R6 | Text | Content + typography **in** recipe `TextSource` | Shareable type without asset; M00 rasterize |
| R7 | Effects | `{ id, params }` on objects; unknown id reject; text `effects=[]` in A | Closed registry; E13 per-object |
| R8 | E13 | Confirm: no document-level global ops; rename mentally to per-object | Simpler validate/compile |
| R9 | Patch | PathPatch `{path,value}[]` + allowlist; post-merge `validateRecipe` | Fail-closed; talk≡sliders; avoid Merge Patch footguns |
| R10 | Numerics | Reject OOR; UI may clamp pre-emit | Constitution over silent clamp |
| R11 | Pack apply | Merge onto current (keep asset ids); file/hash = replace | Preserve photo when changing look |
| R12 | Share | Hash = recipe only; recipient resolves assets | Shaddy transport + FILTR asset honesty |
| R13 | Versions | `schemaVersion` + `engineVersion` + `packVersion`; refuse silent drift | FILTR breaking preset precedent |
| R14 | Missing asset | Loud failure at resolve/draw | No blank success |
| R15 | Hybrid compositor | Not reopened | M00 C7 |

---

## 12. References

- Shaddy — URL LZ recipe share — [Devpost](https://devpost.com/software/shaddy)  
- FILTR — presets store media **names/refs**, not blobs — [antlii.work/WIP-Tool](https://antlii.work/WIP-Tool)  
- VideoFlow — resolution-agnostic `effects[]` stacks — [blog](https://videoflow.dev/blog/cinematic-glsl-effect-stacking-videoflow)  
- kampos — effect arrays / tiny WebGL compositor — [GitHub](https://github.com/wix-incubator/kampos), [Wix eng](https://www.wix.engineering/post/introducing-kampos-a-tiny-and-fast-effects-compositor)  
- Lumen — modular presets + on-device media — [legenki.com/lumen](https://legenki.com/lumen/)  
- FIBO Scene Director — LLM → validated JSON → deterministic render — [GitHub](https://github.com/msaluck/fibo-scene-director)  
- RFC 6902 JSON Patch — [datatracker](https://datatracker.ietf.org/doc/html/rfc6902)  
- RFC 7396 JSON Merge Patch — [datatracker](https://datatracker.ietf.org/doc/html/rfc7396)  
- Patch format comparison — [erosb](https://erosb.github.io/post/json-patch-vs-merge-patch/)  
- IndexedDB + Blob media storage — [Nazar Boyko](https://www.nazarboyko.com/articles/indexeddb-for-serious-frontend-storage), [Scanbot storage](https://scanbot.io/techblog/storage-wars-web-edition/)  
- In-repo: `VISION.md`, `00_FIELD_RESEARCH.md`, `01_ENGINE.md`, `02_CONSTITUTION.md`, `docs/modules/M00_COMPOSITOR.md`

---

## Operator summary

- **Recommended asset storage:** IndexedDB map `assetId → Blob` (+ metadata); object URLs ephemeral; no bytes in recipe/hash.  
- **Canonical recipe root shape:** `{ schemaVersion, engineVersion, packId, packVersion, canvas?, meta?, objects[] }` with image/text objects, `AssetRef`, in-recipe `TextSource`, per-object `effects[]`.  
- **Patch format choice:** PathPatch `{ path, value }[]` on a closed allowlist → single `validateRecipe` (reject OOR; no silent clamp).  
- **Share/reproduce:** Hash/JSON shares instructions only; same look tomorrow or on another machine requires resolvable assets (re-upload or bundled `url` for heroes).  
- **First code slice after this card:** `Recipe`/`Object`/`AssetRef` types + `validateRecipe` + IndexedDB asset store + empty compositor shell that refuses missing assets loudly.
