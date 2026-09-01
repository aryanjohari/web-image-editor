# Stage on `main` (legacy)

Before the Prism rewrite, this repository’s **`main`** branch shipped **Background Studio → Stage**: animated full-viewport WebGL heroes, fourteen preset looks, brand briefs, campaign pack ZIP export, and a keyed in-memory **Jobs API** (`/api/v1/*`). That product lane is **martech / hero automation**, not still-photo parametric styling.

## What lives where

| Branch / artifact | Product |
|-------------------|---------|
| `main` (pre-merge) | Background Studio / Stage |
| `rewrite/v1-styling` | **Prism** — still-image lab (M00–M07) |

Prism is the **successor for the still-image lane**. It is **not** Stage 2.0 — no Jobs API, no campaign packs, no animated hero timeline as the core loop.

## Preservation

Suggested strategies after Prism merges:

- **Tag:** `git tag stage-v1 <commit-on-main-before-merge>` — frozen Stage snapshot
- **Branch:** `archive/stage` pointing at last Stage-only commit
- **Docs:** Stage README, `docs/DIRECTION.md`, and Stage C4 remain in git history on `main` ancestors

## Pointers

- Stage visitor README: `git show main:README.md`
- Stage portfolio card: `git show main:portfolio.yaml`
- Prism status: [`../STATUS.md`](../STATUS.md)
- Prism architecture: [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
