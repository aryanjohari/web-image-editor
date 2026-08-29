import type { AssetRecord } from "../assets/types";
import type { BlendMode, Effect, ImageObject, Recipe, RecipeObject, Transform2D } from "../recipe/types";
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

/** Uniform pack for Tier A main grade (missing effect → identity 0). */
type GradeUniforms = {
  enable: boolean;
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  fade: number;
  duotone: number;
  vignette: number;
  grain: number;
  grainSeed: number;
  duotoneShadow: [number, number, number];
  duotoneHighlight: [number, number, number];
};

type GradeDrawState = {
  grade: GradeUniforms;
  regional: boolean;
  subject: GradeUniforms;
  background: GradeUniforms;
  maskTex: UploadedTexture | null;
};

function gradeDrawState(
  grade: GradeUniforms,
  regional = false,
  subject: GradeUniforms = IDENTITY_GRADE,
  background: GradeUniforms = IDENTITY_GRADE,
  maskTex: UploadedTexture | null = null,
): GradeDrawState {
  return { grade, regional, subject, background, maskTex };
}

const IDENTITY_GRADE: GradeUniforms = {
  enable: false,
  exposure: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  fade: 0,
  duotone: 0,
  vignette: 0,
  grain: 0,
  grainSeed: 0,
  duotoneShadow: [0.1, 0.06, 0.19],
  duotoneHighlight: [0.95, 0.9, 0.78],
};

function parseHexRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1]!, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function amountOf(effects: Effect[], id: string): number {
  const ef = effects.find((e) => e.id === id);
  if (!ef) return 0;
  const v = ef.params.amount;
  return typeof v === "number" ? v : 0;
}

function grainSeedOf(effects: Effect[]): number {
  const ef = effects.find((e) => e.id === "grain");
  if (!ef) return 0;
  const v = ef.params.seed;
  return typeof v === "number" ? v : 0;
}

function gradeFromEffects(effects: Effect[], enable: boolean): GradeUniforms {
  if (!enable) return IDENTITY_GRADE;
  const duo = effects.find((e) => e.id === "duotone");
  const shadow =
    duo && typeof duo.params.shadow === "string"
      ? parseHexRgb(duo.params.shadow)
      : IDENTITY_GRADE.duotoneShadow;
  const highlight =
    duo && typeof duo.params.highlight === "string"
      ? parseHexRgb(duo.params.highlight)
      : IDENTITY_GRADE.duotoneHighlight;
  return {
    enable: true,
    exposure: amountOf(effects, "exposure"),
    contrast: amountOf(effects, "contrast"),
    saturation: amountOf(effects, "saturation"),
    temperature: amountOf(effects, "temperature"),
    fade: amountOf(effects, "fade"),
    duotone: amountOf(effects, "duotone"),
    vignette: amountOf(effects, "vignette"),
    grain: amountOf(effects, "grain"),
    grainSeed: grainSeedOf(effects),
    duotoneShadow: shadow,
    duotoneHighlight: highlight,
  };
}

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

  private async resolveMaskTexture(
    maskRef: ImageObject["maskRef"],
    assetsById: Map<string, AssetRecord>,
  ): Promise<UploadedTexture> {
    if (!maskRef) {
      throw {
        code: "MISSING_MASK",
        message: "maskRef missing on main",
      } satisfies CompositorError;
    }
    if (maskRef.type === "id") {
      const rec = assetsById.get(maskRef.assetId);
      if (!rec) {
        throw {
          code: "MISSING_MASK",
          message: `mask asset "${maskRef.assetId}" missing — regenerate or re-upload`,
          assetId: maskRef.assetId,
        } satisfies CompositorError;
      }
      const key = `mask:${maskRef.assetId}`;
      const cached = this.textureCache.get(key);
      if (cached) return cached;
      const bitmap = await decodeImageBitmap(rec.blob);
      const uploaded = uploadImageBitmap(this.gl, bitmap);
      bitmap.close();
      this.textureCache.set(key, uploaded);
      return uploaded;
    }
    const key = `mask:url:${maskRef.url}`;
    const cached = this.textureCache.get(key);
    if (cached) return cached;
    const res = await fetch(maskRef.url);
    if (!res.ok) {
      throw {
        code: "MISSING_MASK",
        message: `failed to fetch mask url ${maskRef.url}`,
      } satisfies CompositorError;
    }
    const blob = await res.blob();
    const bitmap = await decodeImageBitmap(blob);
    const uploaded = uploadImageBitmap(this.gl, bitmap);
    bitmap.close();
    this.textureCache.set(key, uploaded);
    return uploaded;
  }

  private mainGradeState(
    obj: ImageObject,
  ): { regional: boolean; grade: GradeUniforms; subject: GradeUniforms; background: GradeUniforms } {
    const useRegional = obj.role === "main" && !!obj.maskRef && !!obj.regional;
    if (useRegional && obj.regional) {
      return {
        regional: true,
        grade: IDENTITY_GRADE,
        subject: gradeFromEffects(obj.regional.subject.effects, true),
        background: gradeFromEffects(obj.regional.background.effects, true),
      };
    }
    return {
      regional: false,
      grade: gradeFromEffects(obj.effects, obj.role === "main"),
      subject: IDENTITY_GRADE,
      background: IDENTITY_GRADE,
    };
  }

  private setGradeUniforms(prog: WebGLProgram, grade: GradeUniforms, prefix = "u_"): void {
    const gl = this.gl;
    const p = (name: string) => gl.getUniformLocation(prog, `${prefix}${name}`);
    if (prefix === "u_") {
      gl.uniform1i(gl.getUniformLocation(prog, "u_enableGrade"), grade.enable ? 1 : 0);
    }
    gl.uniform1f(p("exposure"), grade.exposure);
    gl.uniform1f(p("contrast"), grade.contrast);
    gl.uniform1f(p("saturation"), grade.saturation);
    gl.uniform1f(p("temperature"), grade.temperature);
    gl.uniform1f(p("fade"), grade.fade);
    gl.uniform1f(p("duotone"), grade.duotone);
    gl.uniform1f(p("vignette"), grade.vignette);
    gl.uniform1f(p("grain"), grade.grain);
    gl.uniform1f(p("grainSeed"), grade.grainSeed);
    gl.uniform3f(
      p("duotoneShadow"),
      grade.duotoneShadow[0],
      grade.duotoneShadow[1],
      grade.duotoneShadow[2],
    );
    gl.uniform3f(
      p("duotoneHighlight"),
      grade.duotoneHighlight[0],
      grade.duotoneHighlight[1],
      grade.duotoneHighlight[2],
    );
  }

  private setRegionalGradeUniforms(
    prog: WebGLProgram,
    subject: GradeUniforms,
    background: GradeUniforms,
    enabled: boolean,
  ): void {
    const gl = this.gl;
    gl.uniform1i(gl.getUniformLocation(prog, "u_regionalGrade"), enabled ? 1 : 0);
    this.setGradeUniforms(prog, IDENTITY_GRADE);
    this.setGradeUniforms(prog, subject, "u_subject_");
    this.setGradeUniforms(prog, background, "u_background_");
  }

  private bindGradeDrawState(state: GradeDrawState): void {
    if (state.regional) {
      this.setRegionalGradeUniforms(
        this.texturedProg,
        state.subject,
        state.background,
        true,
      );
    } else {
      this.setRegionalGradeUniforms(
        this.texturedProg,
        IDENTITY_GRADE,
        IDENTITY_GRADE,
        false,
      );
      this.setGradeUniforms(this.texturedProg, state.grade);
    }
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE1);
    if (state.maskTex) {
      gl.bindTexture(gl.TEXTURE_2D, state.maskTex.texture);
    } else {
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    gl.uniform1i(gl.getUniformLocation(this.texturedProg, "u_mask"), 1);
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
    drawState: GradeDrawState = gradeDrawState(IDENTITY_GRADE),
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
    this.bindGradeDrawState(drawState);

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
    drawState: GradeDrawState = gradeDrawState(IDENTITY_GRADE),
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
    this.bindGradeDrawState(drawState);
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

  private async ensureTextTexture(
    obj: RecipeObject & { kind: "text" },
    textScale: number,
  ): Promise<UploadedTexture> {
    const scaled = {
      ...obj.text,
      fontSize: Math.max(1, obj.text.fontSize * textScale),
      letterSpacing:
        obj.text.letterSpacing != null ? obj.text.letterSpacing * textScale : undefined,
      lineHeight: obj.text.lineHeight != null ? obj.text.lineHeight * textScale : undefined,
    };
    const key = `${textScale.toFixed(6)}:${JSON.stringify(scaled)}`;
    if (key !== this.textKey || !this.textTex) {
      const raster = rasterizeText(scaled);
      this.textTex = uploadCanvas(this.gl, raster.canvas, this.textTex?.texture ?? null);
      this.textKey = key;
    }
    return this.textTex;
  }

  /**
   * Compose visible layers into read/write FBO pair at viewW×viewH.
   * Returns the FBO holding the final composite.
   */
  private async composeToFbos(
    input: RenderFrameInput,
    read: Fbo,
    write: Fbo,
    viewW: number,
    viewH: number,
    textScale: number,
  ): Promise<Fbo> {
    const gl = this.gl;
    const layers = [...input.recipe.objects]
      .filter((o) => o.visible)
      .sort((a, b) => a.z - b.z);

    gl.bindFramebuffer(gl.FRAMEBUFFER, read.framebuffer);
    gl.viewport(0, 0, viewW, viewH);
    gl.clearColor(0.08, 0.09, 0.11, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let curRead = read;
    let curWrite = write;
    let hasContent = false;

    for (const obj of layers) {
      if (obj.kind === "image") {
        const tex = await this.resolveTexture(obj, input.assetsById);
        const gradeState = this.mainGradeState(obj);
        let drawState = gradeDrawState(gradeState.grade);
        if (gradeState.regional) {
          const maskTex = await this.resolveMaskTexture(obj.maskRef, input.assetsById);
          drawState = gradeDrawState(
            gradeState.grade,
            true,
            gradeState.subject,
            gradeState.background,
            maskTex,
          );
        }
        if (!hasContent) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, curRead.framebuffer);
          gl.clearColor(0.08, 0.09, 0.11, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          this.drawTextured(
            curRead.framebuffer,
            tex,
            obj.transform,
            obj.opacity,
            "normal",
            true,
            viewW,
            viewH,
            drawState,
          );
          hasContent = true;
        } else {
          this.compositeLayer(
            curRead,
            curWrite,
            tex,
            obj.transform,
            obj.opacity,
            obj.blend,
            viewW,
            viewH,
            drawState,
          );
          const tmp = curRead;
          curRead = curWrite;
          curWrite = tmp;
        }
      } else if (obj.kind === "text") {
        const textTex = await this.ensureTextTexture(obj, textScale);
        if (!hasContent) {
          this.drawTextured(
            curRead.framebuffer,
            textTex,
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
            curRead,
            curWrite,
            textTex,
            obj.transform,
            obj.opacity,
            obj.blend,
            viewW,
            viewH,
          );
          const tmp = curRead;
          curRead = curWrite;
          curWrite = tmp;
        }
      } else {
        throw {
          code: "UNSUPPORTED",
          message: `unsupported active object`,
        } satisfies CompositorError;
      }
    }
    return curRead;
  }

  private createTempFbo(width: number, height: number): Fbo {
    const gl = this.gl;
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
  }

  private deleteFbo(fbo: Fbo): void {
    const gl = this.gl;
    gl.deleteFramebuffer(fbo.framebuffer);
    gl.deleteTexture(fbo.texture);
  }

  /** Max GPU texture edge for export clamp. */
  maxTextureSize(): number {
    return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) as number;
  }

  /**
   * Resolve main image native pixel size (after upload/decode).
   * Fail closed if main missing or unresolved.
   */
  async resolveMainNativeSize(
    recipe: Recipe,
    assetsById: Map<string, AssetRecord>,
  ): Promise<{ width: number; height: number }> {
    const main = recipe.objects.find((o) => o.kind === "image" && o.role === "main");
    if (!main || main.kind !== "image" || !main.visible) {
      throw {
        code: "MISSING_ASSET",
        message: "main image missing — cannot export PNG",
      } satisfies CompositorError;
    }
    const tex = await this.resolveTexture(main, assetsById);
    return { width: tex.width, height: tex.height };
  }

  /**
   * Export at source RT: same shaders as preview, different FBO size (E14 / X1).
   * Never touches canvas drawing-buffer / preserveDrawingBuffer.
   * Returns bottom-up RGBA (GL order) — caller flips Y for Canvas2D.
   */
  async exportPixels(
    input: RenderFrameInput,
    exportWidth: number,
    exportHeight: number,
    previewHeight: number,
  ): Promise<{ width: number; height: number; pixels: Uint8Array }> {
    this.lastError = null;
    const gl = this.gl;
    const viewW = Math.max(1, Math.floor(exportWidth));
    const viewH = Math.max(1, Math.floor(exportHeight));
    const textScale = previewHeight > 0 ? viewH / Math.max(1, previewHeight) : 1;

    for (const obj of input.recipe.objects) {
      if (!obj.visible || obj.kind !== "image") continue;
      await this.resolveTexture(obj, input.assetsById);
      if (obj.role === "main" && obj.maskRef) {
        await this.resolveMaskTexture(obj.maskRef, input.assetsById);
      }
    }

    const fboA = this.createTempFbo(viewW, viewH);
    const fboB = this.createTempFbo(viewW, viewH);
    try {
      const finalFbo = await this.composeToFbos(
        input,
        fboA,
        fboB,
        viewW,
        viewH,
        textScale,
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, finalFbo.framebuffer);
      const pixels = new Uint8Array(viewW * viewH * 4);
      gl.readPixels(0, 0, viewW, viewH, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const err = gl.getError();
      if (err !== gl.NO_ERROR) {
        throw {
          code: "READPIXELS",
          message: `readPixels failed (gl error ${err}) — possible CORS taint`,
        } satisfies CompositorError;
      }
      return { width: viewW, height: viewH, pixels };
    } catch (e) {
      const err =
        e && typeof e === "object" && "code" in e && "message" in e
          ? (e as CompositorError)
          : {
              code: "EXPORT",
              message: e instanceof Error ? e.message : String(e),
            };
      this.lastError = err;
      throw err;
    } finally {
      this.deleteFbo(fboA);
      this.deleteFbo(fboB);
      this.textKey = "";
      if (this.textTex) {
        gl.deleteTexture(this.textTex.texture);
        this.textTex = null;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  async render(input: RenderFrameInput): Promise<boolean> {
    this.lastError = null;
    const gl = this.gl;
    const viewW = this.canvas.width;
    const viewH = this.canvas.height;
    this.ensureFbos(viewW, viewH);
    if (!this.fboA || !this.fboB) return false;

    try {
      const finalFbo = await this.composeToFbos(
        input,
        this.fboA,
        this.fboB,
        viewW,
        viewH,
        1,
      );
      this.blitTexture(finalFbo.texture, null, viewW, viewH);
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
