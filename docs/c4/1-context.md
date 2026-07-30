# C1 — System context

**Background Studio** is one product: a browser tool for designing animated full-viewport hero backgrounds and exporting **preset JSON** (plus optional WebM/PNG).

## Elements

| ID | Type | Role |
|----|------|------|
| `designer` | Person | Uses `/`, `/lab`, `/story` to author looks |
| `studio` | Software system | This repository’s deployable product |
| `openai` | External system | Optional upstream for AI mood (`POST` chat completions) |
| `embedSite` | External system | A site that reuses exported preset coefficients (not part of this deploy) |

## Notes

- Keyword mood runs entirely in the browser; AI mood is optional and needs the Mood API + `OPENAI_API_KEY`.
- There is no hosted database or multi-tenant backend in this system.
- Diagram source: [`1-context.mmd`](1-context.mmd). Zoom: [`2-containers.md`](2-containers.md).
