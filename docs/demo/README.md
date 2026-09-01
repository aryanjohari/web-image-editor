# Demo screenshots (v1)

Operator-captured Lab exports for README thumbnails, portfolio gallery, and M06 §14 falsifier F1.

**Do not commit large binaries in CI** — drop PNGs here locally after capture from a running Lab (`npm run dev`).

## Required five looks

| # | Pack | Filename | Notes |
|---|------|----------|-------|
| 1 | `warm-film` | `warm-film.png` | Scanner warmth + grain |
| 2 | `flash-raw` | `flash-raw.png` | Harsh contrast / disposable flash |
| 3 | `muted-split` | `muted-split.png` | **Needs portrait + person mask**; soft muted background |
| 4 | `editorial-bw` | `editorial-bw.png` | Print B&W + paper grain |
| 5 | `poster-punch` + text | `poster-punch.png` | Duotone + textHints (bottom-left / sans-bold) |

### Bonus (optional)

- `dusk-grain.png`
- `cool-chrome.png`
- `clean-editorial.png`

## Capture procedure

1. `npm run dev` → open `/`
2. Upload a suitable portrait (for `muted-split`, wait for mask chip / regional sliders)
3. Select pack from family group
4. Adjust axes only if needed for readability at thumbnail size
5. **Download PNG** or screenshot the canvas (export preferred — matches shipped pipeline)
6. Save to this folder with the filename above

## README embeds

When present, root [`README.md`](../README.md) references:

![warm-film](warm-film.png)
![flash-raw](flash-raw.png)
![muted-split](muted-split.png)
![editorial-bw](editorial-bw.png)
![poster-punch](poster-punch.png)

## Status

| File | Captured? |
|------|-----------|
| `warm-film.png` | pending |
| `flash-raw.png` | pending |
| `muted-split.png` | pending |
| `editorial-bw.png` | pending |
| `poster-punch.png` | pending |

Update this table when operator adds files.
