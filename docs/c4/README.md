# C4 model — Background Studio

Official-style C4 for this repo, built **bottom-up from code** (C1–C3 only; no Code/class level).

| Level | What it shows | Files |
|-------|---------------|--------|
| **C1 Context** | One system box, people, external systems | [`1-context.mmd`](1-context.mmd) · [`1-context.md`](1-context.md) |
| **C2 Containers** | What actually runs/deploys | [`2-containers.mmd`](2-containers.mmd) · [`2-containers.md`](2-containers.md) |
| **C3 Components** | Internals of each container that needs them | [`3-components/`](3-components/) |

## Zoom path (portfolio / SVG)

1. **Context** → click the system box → **Containers**
2. **Containers** → click `studio-spa` or `mood-api` → that container’s **Components**

Machine index for a future zoom UI: [`portfolio-map.json`](portfolio-map.json).

## How to read

- **Visitor labels** are plain English.
- **IDs** (`studio-spa`, `mood-api`, …) are stable kebab-case.
- Dashed edges = optional / secondary (AI mood).
- Complexity belongs in C3; C1/C2 stay clear but do not erase the single-pass compositor + preset-contract design (see `notes` in the markdown companions).

## Case study prose

Narrative, tradeoffs, verify steps: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).
