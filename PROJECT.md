# Background Studio

> Design **animated hero backgrounds for portfolios and landing pages** in the browser — export **preset JSON** for your site, **WebM loops** for demos, and **PNG posters** for fallbacks. Powered by *The Algorithm Engine*, a single-pass WebGL compositor.

Visitor card copy: [`portfolio.yaml`](portfolio.yaml).  
Architecture case study: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).  
C4 diagrams: [`docs/c4/README.md`](docs/c4/README.md).

---

## What problem this solves

Ambient, performant animated backgrounds without baking video or round-tripping through desktop compositing software.

1. Optionally bring in a **hero texture** as the sampled backdrop.
2. Optionally add an **overlay** and **preview text** for lab layout (production sites use HTML above the canvas).
3. Twist the look in real time, then export **JSON you can embed** on a real site ([`PORTING.md`](src/lib/preset/PORTING.md)).

---

## Routes

One deploy, three surfaces, one shared shader + Zustand store + canvas.

| Route | Surface |
|-------|---------|
| **`/`** | Living demo — demo hero + preset on mount; mood (keywords + optional AI) |
| **`/lab`** | Background Studio — Source / Look / Tune / Export / Advanced |
| **`/story`** | Case study — HTML above canvas, preset JSON, exports |

---

## What makes it mine

- **One draw, many looks** — hero, overlay, and preview text each get their own effect bank in a single fragment program (`L0` / `L1` / `T0–T3`).
- **Presets as coefficients** — schema v2 stores numbers and optional assets, not baked frames; apply modes preserve uploads or preview text when you only want a grade.
- **Full-viewport embed pattern** — controls overlay the canvas so the background still reads as a site hero behind HTML.

Deeper tradeoffs and flow: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Current state

- Local: `npm run dev` / `npm run build` / `npm test`.
- **14** bundled looks (7 featured ambient + 7 legacy under More looks).
- **Keep preview text** (default on) for catalog/mood/URL apply.
- JSON export without upload; PNG/WebM require a hero texture.
- Optional AI mood on Vercel when `VITE_MOOD_AI_ENABLED` + `OPENAI_API_KEY` are set.

**Known limits:** shared store across routes (returning to `/` re-inits landing hero); single-pass shader only; browser/GPU dependent; English-first UI.

Deferred ideas (not commitments): safe-zone / reduced-motion helpers, audio-reactive params, richer capture codec UX.

---

## Links

- Operator docs: [README.md](README.md)
- GPU math: [MATH.md](MATH.md)
- Embed guide: [src/lib/preset/PORTING.md](src/lib/preset/PORTING.md)
