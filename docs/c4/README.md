# C4 model — Background Studio

Official-style C4 for this repo, built **bottom-up from code** (C1–C3 only; no Code/class level).

> **Stage:** product freeze and Phase 4+ `stage-api` are in [`../DIRECTION.md`](../DIRECTION.md). Shipped containers: `studio-spa`, `stage-api` (includes keyless brief/mood + keyed `/api/v1`).

| Level | What it shows | Files |
|-------|---------------|--------|
| **C1 Context** | One system box, people, external systems | [`1-context.mmd`](1-context.mmd) · [`1-context.md`](1-context.md) |
| **C2 Containers** | What actually runs/deploys | [`2-containers.mmd`](2-containers.mmd) · [`2-containers.md`](2-containers.md) |
| **C3 Components** | Internals of each container | [`3-components/`](3-components/) — see `stage-api.md`, `mood-api.md`, `studio-spa.md` |

## Zoom path (portfolio / SVG)

1. **Context** → click the system box → **Containers**
2. **Containers** → click `studio-spa` or `stage-api` → that container’s **Components**

Machine index: [`portfolio-map.json`](portfolio-map.json).

## How to read

- **Visitor labels** are plain English.
- **IDs** (`studio-spa`, `stage-api`, …) are stable kebab-case.
- In-memory Jobs Maps wipe on cold start — documented in DIRECTION / AUTH.
- Complexity belongs in C3; C1/C2 stay clear.

## Case study prose

Narrative, tradeoffs, verify steps: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).
