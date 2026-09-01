# C4 model — Prism

Official-style C4 for this repo, built **bottom-up from code** (C1–C3 only; no Code/class level).

> **Prism:** still-image parametric styling on `rewrite/v1-styling`. Shipped containers: `prism-lab`, `talk-api`, `compositor` (browser WebGL2).

| Level | What it shows | Files |
|-------|---------------|--------|
| **C1 Context** | One system box, people, external systems | [`1-context.mmd`](1-context.mmd) · [`1-context.md`](1-context.md) |
| **C2 Containers** | What actually runs/deploys | [`2-containers.mmd`](2-containers.mmd) · [`2-containers.md`](2-containers.md) |
| **C3 Components** | Internals of each container | [`3-components/`](3-components/) — see `lab-spa.md`, `talk-api.md`, `compositor.md` |

## Zoom path (portfolio / SVG)

1. **Context** → click the system box → **Containers**
2. **Containers** → click `prism-lab`, `talk-api`, or `compositor` → that container’s **Components**

Machine index: [`portfolio-map.json`](portfolio-map.json).

## How to read

- **Visitor labels** are plain English.
- **IDs** (`prism-lab`, `talk-api`, `compositor`, …) are stable kebab-case.
- Talk API requires `GEMINI_API_KEY` on the server; Lab packs/sliders/export work without it.
- Assets live in browser IndexedDB; recipe may carry `#r=` hash (no image bytes in URL).
- Complexity belongs in C3; C1/C2 stay clear.

## Case study prose

Narrative, tradeoffs, verify steps: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).
