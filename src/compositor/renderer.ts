import type { AssetRecord } from "../assets/types";
import type { BlendMode, Recipe, RecipeObject, Transform2D } from "../recipe/types";
import {
  createFullscreenQuad,
  createGL,
  createTexture,
  linkProgram,
} from "./gl";
import { rasterizeText } from "./textRaster";
import {
  decodeImageBitmap,
  uploadCanvas,
  uploadImageBitmap,
  type UploadedTexture,
} from "./textureUpload";
import vertSrc from "./shaders/quad.vert.glsl";
import texturedFrag from "./shaders/textured.frag.glsl";
import blitFrag from "./shaders/blit.frag.glsl";

export type CompositorError = {
  code: string;
  message: string;
  assetId?: string;
};

export type RenderFrameInput = {
  recipe: Recipe;
  /** Resolved assets keyed by assetId (lab). url refs fetch separately. */
  assetsById: Map<string, AssetRecord>;
};

type Fbo = {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
};

function blendModeIndex(b: BlendMode): number {
  switch (b) {
    case "multiply":
      return 1;
    case "screen":
      return 2;
    case "overlay":
      return 3;
    default:
      return 0;
  }
}

function containScale(
  imgW: number,
  imgH: number,
  viewW: number,
  viewH: number,
): { scaleX: number; scaleY: number } {
  const imgAspect = imgW / Math.max(imgH, 1);
  const viewAspect = viewW / Math.max(viewH, 1);
  if (imgAspect > viewAspect) {
    // letterbox top/bottom
    return { scaleX: 1, scaleY: viewAspect / imgAspect };
  }
  return { scaleX: imgAspect / viewAspect, scaleY: 1 };
}

function transformUniforms(
  t: Transform2D,
  baseScale: { scaleX: number; scaleY: number },
): { scale: [number, number]; offset: [number, number]; rotation: number } {
  return {
    scale: [baseScale.scaleX * t.scaleX, baseScale.scaleY * t.scaleY],
    offset: [t.x, t.y],
    rotation: t.rotation,
  };
}

export class Compositor {
  readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly vao: WebGLVertexArrayObject;
  private readonly quadBuffer: WebGLBuffer;
  private readonly texturedProg: WebGLProgram;
  private readonly blitProg: WebGLProgram;
  private fboA: Fbo | null = null;
  private fboB: Fbo | null = null;
  private textureCache = new Map<string, UploadedTexture>();
  private textTex: UploadedTexture | null = null;
  private textKey = "";
  private lastError: CompositorError | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = createGL(canvas);
    const quad = createFullscreenQuad(this.gl);
    this.vao = quad.vao;
    this.quadBuffer = quad.buffer;
    this.texturedProg = linkProgram(this.gl, vertSrc, texturedFrag);
    this.blitProg = linkProgram(this.gl, vertSrc, blitFrag);
  }

  getError(): CompositorError | null {
    return this.lastError;
  }

  resize(cssWidth: number, cssHeight: number, dpr = window.devicePixelRatio || 1): void {
    const w = Math.max(1, Math.floor(cssWidth * dpr));
    const h = Math.max(1, Math.floor(cssHeight * dpr));
    // Always pin CSS box so attribute width/height never become layout size.
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    if (this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.ensureFbos(w, h);
  }

  private ensureFbos(width: number, height: number): void {
    const gl = this.gl;
    const rebuild = (prev: Fbo | null): Fbo => {
      if (prev && prev.width === width && prev.height === height) return prev;
      if (prev) {
        gl.deleteFramebuffer(prev.framebuffer);
        gl.deleteTexture(prev.texture);
      }
      const texture = createTexture(gl);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      const fb = gl.createFramebuffer();
      if (!fb) throw new Error("createFramebuffer failed");
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
        throw new Error(`FBO incomplete: ${status}`);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { framebuffer: fb, texture, width, height };
    };
    this.fboA = rebuild(this.fboA);
    this.fboB = rebuild(this.fboB);
  }

  private async resolveTexture(
    obj: RecipeObject & { kind: "image" },
    assetsById: Map<string, AssetRecord>,
  ): Promise<UploadedTexture> {
    const src = obj.source;
    if (src.type === "id") {
      const rec = assetsById.get(src.assetId);
      if (!rec) {
        throw {
          code: "MISSING_ASSET",
          message: `asset "${src.assetId}" missing — re-upload`,
          assetId: src.assetId,
        } satisfies CompositorError;
      }
      const cached = this.textureCache.get(src.assetId);
      if (cached) return cached;
      const bitmap = await decodeImageBitmap(rec.blob);
      const uploaded = uploadImageBitmap(this.gl, bitmap);
      bitmap.close();
      this.textureCache.set(src.assetId, uploaded);
      return uploaded;
    }
    // url ref — fetch once per url key
    const key = `url:${src.url}`;
    const cached = this.textureCache.get(key);
    if (cached) return cached;
    const res = await fetch(src.url);
    if (!res.ok) {
      throw {
        code: "URL_FETCH",
        message: `failed to fetch asset url ${src.url}`,
      } satisfies CompositorError;
    }
    const blob = await res.blob();
    const bitmap = await decodeImageBitmap(blob);
    const uploaded = uploadImageBitmap(this.gl, bitmap);
    bitmap.close();
    this.textureCache.set(key, uploaded);
    return uploaded;
  }

  private drawTextured(
    target: WebGLFramebuffer | null,
    tex: UploadedTexture,
    transform: Transform2D,
    opacity: number,
    blend: BlendMode,
    isBase: boolean,
    viewW: number,
    viewH: number,
  ): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.viewport(0, 0, viewW, viewH);
    gl.useProgram(this.texturedProg);
    gl.bindVertexArray(this.vao);

    const base = containScale(tex.width, tex.height, viewW, viewH);
    const u = transformUniforms(transform, base);

    const locScale = gl.getUniformLocation(this.texturedProg, "u_scale");
    const locOffset = gl.getUniformLocation(this.texturedProg, "u_offset");
    const locRot = gl.getUniformLocation(this.texturedProg, "u_rotation");
    const locOpacity = gl.getUniformLocation(this.texturedProg, "u_opacity");
    const locBlend = gl.getUniformLocation(this.texturedProg, "u_blendMode");
    const locBase = gl.getUniformLocation(this.texturedProg, "u_isBase");
    const locTex = gl.getUniformLocation(this.texturedProg, "u_tex");

    gl.uniform2f(locScale, u.scale[0], u.scale[1]);
    gl.uniform2f(locOffset, u.offset[0], u.offset[1]);
    gl.uniform1f(locRot, u.rotation);
    gl.uniform1f(locOpacity, opacity);
    gl.uniform1i(locBlend, blendModeIndex(blend));
    gl.uniform1i(locBase, isBase ? 1 : 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex.texture);
    gl.uniform1i(locTex, 0);

    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private compositeLayer(
    readFbo: Fbo,
    writeFbo: Fbo,
    srcTex: UploadedTexture,
    transform: Transform2D,
    opacity: number,
    blend: BlendMode,
    viewW: number,
    viewH: number,
  ): void {
    const gl = this.gl;
    // Blit dst → write, then premul source-over the layer (blend modes ≠ normal
    // use textured.frag approximate tint — full dst-aware blend is ping-pong+.
    this.blitTexture(readFbo.texture, writeFbo.framebuffer, viewW, viewH);
    gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo.framebuffer);
    gl.viewport(0, 0, viewW, viewH);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.texturedProg);
    gl.bindVertexArray(this.vao);
    const base = containScale(srcTex.width, srcTex.height, viewW, viewH);
    const u = transformUniforms(transform, base);
    gl.uniform2f(gl.getUniformLocation(this.texturedProg, "u_scale"), u.scale[0], u.scale[1]);
    gl.uniform2f(gl.getUniformLocation(this.texturedProg, "u_offset"), u.offset[0], u.offset[1]);
    gl.uniform1f(gl.getUniformLocation(this.texturedProg, "u_rotation"), u.rotation);
    gl.uniform1f(gl.getUniformLocation(this.texturedProg, "u_opacity"), opacity);
    gl.uniform1i(gl.getUniformLocation(this.texturedProg, "u_blendMode"), blendModeIndex(blend));
    gl.uniform1i(gl.getUniformLocation(this.texturedProg, "u_isBase"), blend === "normal" ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, srcTex.texture);
    gl.uniform1i(gl.getUniformLocation(this.texturedProg, "u_tex"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disable(gl.BLEND);
  }

  private blitTexture(
    tex: WebGLTexture,
    target: WebGLFramebuffer | null,
    viewW: number,
    viewH: number,
  ): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.viewport(0, 0, viewW, viewH);
    gl.useProgram(this.blitProg);
    gl.bindVertexArray(this.vao);
    gl.uniform2f(gl.getUniformLocation(this.blitProg, "u_scale"), 1, 1);
    gl.uniform2f(gl.getUniformLocation(this.blitProg, "u_offset"), 0, 0);
    gl.uniform1f(gl.getUniformLocation(this.blitProg, "u_rotation"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(this.blitProg, "u_tex"), 0);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  async render(input: RenderFrameInput): Promise<boolean> {
    this.lastError = null;
    const gl = this.gl;
    const viewW = this.canvas.width;
    const viewH = this.canvas.height;
    this.ensureFbos(viewW, viewH);
    if (!this.fboA || !this.fboB) return false;

    const layers = [...input.recipe.objects]
      .filter((o) => o.visible)
      .sort((a, b) => a.z - b.z);

    try {
      // Clear accumulate buffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboA.framebuffer);
      gl.viewport(0, 0, viewW, viewH);
      gl.clearColor(0.08, 0.09, 0.11, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      let read = this.fboA;
      let write = this.fboB;
      let hasContent = false;

      for (const obj of layers) {
        if (obj.kind === "image") {
          const tex = await this.resolveTexture(obj, input.assetsById);
          if (!hasContent) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, read.framebuffer);
            gl.clearColor(0.08, 0.09, 0.11, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            this.drawTextured(
              read.framebuffer,
              tex,
              obj.transform,
              obj.opacity,
              "normal",
              true,
              viewW,
              viewH,
            );
            hasContent = true;
          } else {
            this.compositeLayer(
              read,
              write,
              tex,
              obj.transform,
              obj.opacity,
              obj.blend,
              viewW,
              viewH,
            );
            const tmp = read;
            read = write;
            write = tmp;
          }
        } else if (obj.kind === "text") {
          const key = JSON.stringify(obj.text);
          if (key !== this.textKey || !this.textTex) {
            const raster = rasterizeText(obj.text);
            this.textTex = uploadCanvas(this.gl, raster.canvas, this.textTex?.texture ?? null);
            this.textKey = key;
          }
          if (!hasContent) {
            this.drawTextured(
              read.framebuffer,
              this.textTex,
              obj.transform,
              obj.opacity,
              "normal",
              true,
              viewW,
              viewH,
            );
            hasContent = true;
          } else {
            this.compositeLayer(
              read,
              write,
              this.textTex,
              obj.transform,
              obj.opacity,
              obj.blend,
              viewW,
              viewH,
            );
            const tmp = read;
            read = write;
            write = tmp;
          }
        } else {
          throw {
            code: "UNSUPPORTED",
            message: `unsupported active object`,
          } satisfies CompositorError;
        }
      }

      // Present to canvas
      this.blitTexture(read.texture, null, viewW, viewH);
      return true;
    } catch (e) {
      const err =
        e && typeof e === "object" && "code" in e && "message" in e
          ? (e as CompositorError)
          : {
              code: "RENDER",
              message: e instanceof Error ? e.message : String(e),
            };
      this.lastError = err;
      // Loud fail: clear to dark red-tinted so blank success is impossible to miss
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, viewW, viewH);
      gl.clearColor(0.25, 0.05, 0.05, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return false;
    }
  }

  dispose(): void {
    const gl = this.gl;
    for (const t of this.textureCache.values()) {
      gl.deleteTexture(t.texture);
    }
    this.textureCache.clear();
    if (this.textTex) gl.deleteTexture(this.textTex.texture);
    if (this.fboA) {
      gl.deleteFramebuffer(this.fboA.framebuffer);
      gl.deleteTexture(this.fboA.texture);
    }
    if (this.fboB) {
      gl.deleteFramebuffer(this.fboB.framebuffer);
      gl.deleteTexture(this.fboB.texture);
    }
    gl.deleteProgram(this.texturedProg);
    gl.deleteProgram(this.blitProg);
    gl.deleteBuffer(this.quadBuffer);
    gl.deleteVertexArray(this.vao);
  }
}
