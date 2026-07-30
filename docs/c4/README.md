# C4 model — Background Studio

C4 diagrams for this repository. Read top-down: context → containers → components.

| Level | What it shows | Files |
|-------|---------------|--------|
| **C1 Context** | The system as one box, people, and external systems | [`1-context.mmd`](1-context.mmd) · [`1-context.md`](1-context.md) |
| **C2 Containers** | Runnable pieces (SPA, Mood API) and how they talk | [`2-containers.mmd`](2-containers.mmd) · [`2-containers.md`](2-containers.md) |
| **C3 Components** | Internals of selected containers | [`3-components/`](3-components/) |

There is no C4 **Code** level here (no class diagrams).

## How to read

- **Visitor labels** in diagrams are plain English.
- **IDs** (`studio-spa`, `mood-api`, …) are stable kebab-case for machines and deep links.
- Dashed edges mean optional or secondary paths (AI mood).

## Portfolio

The portfolio site fetches architecture at build time from:

- Root [`portfolio.yaml`](../../portfolio.yaml) (`diagram` + `graph`)
- [`docs/architecture.mmd`](../architecture.mmd) — visitor flowchart aligned with C2
- [`docs/architecture.graph.json`](../architecture.graph.json) — preferred map IR (C2-derived tour)

Component zooms that exist: see [`portfolio-map.json`](portfolio-map.json).

## Case study prose

Narrative, tradeoffs, and local verify steps: [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md).
