# Background Studio → Stage

> **Today:** Design **animated hero backgrounds** in the browser — export **preset / StageRecipe JSON**, **campaign pack ZIP**, **WebM**, and **PNG**.  
> **Direction (Stage):** Brand-ruled visual automation — brief + brand kit → campaign pack + live background recipe (web app + Jobs API). Spec: [`docs/DIRECTION.md`](docs/DIRECTION.md).

Visitor card copy: [`portfolio.yaml`](portfolio.yaml).  
Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).  
C4: [`docs/c4/README.md`](docs/c4/README.md).  
Contracts: [`src/lib/stage/`](src/lib/stage/) · [`docs/api/stage-v1.openapi.yaml`](docs/api/stage-v1.openapi.yaml).

---

## What problem this solves

Ambient animated backgrounds without baking video — plus brand-ruled brief → recipe for campaign packs and module callers.

1. Optionally bring in a **hero texture**.
2. Optionally add overlay / preview text (production sites use HTML above the canvas).
3. Twist the look, brief with brand rules, export **JSON you can embed** ([`EMBED.md`](src/lib/stage/EMBED.md), [`PORTING.md`](src/lib/preset/PORTING.md)).

---

## Routes

| Route | Surface |
|-------|---------|
| **`/`** | Home — soft landing, CTAs |
| **`/workspace`** | Brands + Assets (IndexedDB) |
| **`/studio`** | Create — canvas, brief, pack ZIP, exports |
| **`/lab`** | Redirect → `/studio` |
| **`/story`** | Case study (secondary) |
| **`/embed-demo`** | Live StageRecipe behind HTML |

---

## What makes it mine

- **One draw, many looks** — `L0` / `L1` / `T0–T3` in a single fragment program.
- **Presets / recipes as coefficients** — not baked frames.
- **Jobs API** — other modules call `POST /api/v1/jobs` with an API key (in-memory dogfood store).

---

## Current state

- Phases **0–5** done with honest limits (see DIRECTION).
- Multi-page soft UI shell: Home · Workspace · Studio (library moved out of the lab drawer).
- Gemini brief/mood; OpenAI path removed.
- In-memory `/api/v1` brands + jobs (`STAGE_API_KEY`); browser workspace = IndexedDB (`stage-workspace`).
- Embed helper + `/embed-demo`; not a published npm player.

**Known limits:** cold-start wipe; compositor L0+L1; shared Zustand across routes; no auth/sync for the web workspace.

**Next:** Bugfix. Do not start plate gen (Phase 6) without an explicit revise.

---

## Links

- Live: see `portfolio.yaml` demo URL  
- Repo: GitHub link in `portfolio.yaml`
