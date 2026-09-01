# C3 — compositor

WebGL2 engine organ: validated recipe → textures → graded composite → optional blur → PNG readback. Same draw path for Lab preview, export, and hero-lite.

## Components

| ID / label | Evidence | Role |
|------------|----------|------|
| GL context | `src/compositor/gl.ts` | WebGL2 init; fullscreen quad; FBO allocation |
| Compositor renderer | `src/compositor/renderer.ts` | `composeToFbos`; main/overlay/text stack; mask sampler bind |
| Grade shader | `src/compositor/shaders/textured.frag.glsl` | exposure → contrast → saturation → temperature → fade/duotone → vignette → grain |
| Blur ping-pong | `blur.frag.glsl`, `mixMask.frag.glsl` | Blur graded main; `mix(blurred, sharp, mask)` for regional bg (M06) |
| Text raster | `src/compositor/textRaster.ts` | Canvas2D font render → GL texture; scales with export/preview height ratio |
| Texture upload | `src/compositor/textureUpload.ts` | Resolve `AssetRef` from IDB or same-origin URL |
| Export FBO | `src/export/png.ts` + renderer | Draw at main native resolution (clamped); `readPixels` → flipY → PNG blob |

## Notes

- **Tier A objects** — one `main`, one `overlay`, one `text`; schema parses more but renderer caps active count.
- **Regional grade** — `u_mask` sampler; dual `applyGradeParams` for subject vs background stacks (M05).
- **Grain stability** — UV hash + optional `grain.params.seed`; no `u_time` flicker (export ≡ preview).
- **Approximate blends** — non-`normal` blend modes are simplified vs Photoshop (documented honest limit).

Diagram: [`compositor.mmd`](compositor.mmd). Parent: [`../2-containers.md`](../2-containers.md).
