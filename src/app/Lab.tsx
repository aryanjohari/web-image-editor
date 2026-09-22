import { useEffect, useRef, useState, type DragEvent } from "react";
import { getAsset, putAsset } from "../assets/idb";
import { AssetStoreError } from "../assets/errors";
import type { AssetRecord } from "../assets/types";
import type { CanvasSelection, SizePx } from "../canvas";
import { Compositor } from "../compositor/renderer";
import {
  applyPack,
  applyRegionalSlider,
  applySemanticSlider,
  applyTextLayout,
  DUOTONE_SLIDER,
  listPacks,
  mainHasDuotone,
  mainHasMask,
  readRegionalSliderValue,
  readSliderValue,
  REGIONAL_SLIDERS,
  regionalSlidersForAxes,
  resetLook,
  SEMANTIC_SLIDERS,
  slidersForAxes,
  TEXT_POSITIONS,
  TYPE_PRESETS,
  tryGetPack,
  type RegionalSliderId,
  type SemanticSliderId,
  type TextPositionHint,
  type TypePresetId,
} from "../packs";
import { attachPersonMask, segmentPersonMask } from "../masks";
import {
  identityOverlayImage,
  identityText,
  identityRecipe,
  recipeWithMain,
} from "../recipe/identityRecipe";
import { applyPathPatch } from "../recipe/pathPatch";
import type { BlendMode, Recipe, Transform2D } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";
import { ErrorBanner } from "./ErrorBanner";
import { CanvasOverlay } from "./CanvasOverlay";
import {
  downloadPng,
  downloadRecipeJson,
  encodeRecipeHash,
  ExportError,
  listMissingAssets,
  ShareHashError,
  tryDecodeLocationHash,
} from "../export";
import {
  applyTalk,
  buildRecipeContext,
  normalizeTalkResponse,
  patchObjectTransform,
  postTalk,
  TalkClientError,
} from "../talk";

const RECIPE_KEY = "prism.recipe.v1";
const BLEND_OPTIONS: BlendMode[] = ["normal", "multiply", "screen", "overlay"];
const TALK_MOOD_CHIPS = [
  "warm film",
  "mute bg",
  "make me pop",
  "cooler",
  "more grain",
] as const;

function loadRecipeFromStorage(): Recipe {
  try {
    const raw = localStorage.getItem(RECIPE_KEY);
    if (!raw) return identityRecipe();
    return validateRecipe(JSON.parse(raw));
  } catch {
    return identityRecipe();
  }
}

function saveRecipe(recipe: Recipe): void {
  localStorage.setItem(RECIPE_KEY, JSON.stringify(recipe));
}

function bootRecipe(): { recipe: Recipe; hashError: string | null; fromHash: boolean } {
  const decoded = tryDecodeLocationHash(
    typeof window !== "undefined" ? window.location.hash : "",
  );
  if (decoded.present) {
    if (decoded.recipe) {
      return { recipe: decoded.recipe, hashError: null, fromHash: true };
    }
    return {
      recipe: loadRecipeFromStorage(),
      hashError: decoded.error ?? "share hash decode failed",
      fromHash: true,
    };
  }
  return { recipe: loadRecipeFromStorage(), hashError: null, fromHash: false };
}

function newAssetId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function loadAssetsMap(recipe: Recipe): Promise<{
  map: Map<string, AssetRecord>;
  error: string | null;
}> {
  const map = new Map<string, AssetRecord>();
  const ids = new Set<string>();
  for (const o of recipe.objects) {
    if (o.kind === "image") {
      if (o.source.type === "id") ids.add(o.source.assetId);
      if (o.role === "main" && o.maskRef?.type === "id") {
        ids.add(o.maskRef.assetId);
      }
    }
  }
  for (const id of ids) {
    try {
      map.set(id, await getAsset(id));
    } catch (e) {
      if (e instanceof AssetStoreError && e.code === "MISSING") {
        return { map, error: `asset "${id}" missing — re-upload` };
      }
      return { map, error: e instanceof Error ? e.message : String(e) };
    }
  }
  return { map, error: null };
}

function hasMain(recipe: Recipe): boolean {
  return recipe.objects.some((o) => o.kind === "image" && o.role === "main");
}

function takeImageFile(files: FileList | null): File | null {
  const file = files?.[0];
  if (!file || !file.type.startsWith("image/")) return null;
  return file;
}

function recipePeek(recipe: Recipe): string {
  const main = recipe.objects.find((o) => o.kind === "image" && o.role === "main");
  const effects = main && main.kind === "image" ? main.effects : [];
  const maskRef = main && main.kind === "image" ? main.maskRef : undefined;
  const regional = main && main.kind === "image" ? main.regional : undefined;
  return JSON.stringify(
    {
      packId: recipe.packId,
      packVersion: recipe.packVersion,
      engineVersion: recipe.engineVersion,
      mainEffects: effects,
      maskRef,
      regional,
    },
    null,
    2,
  );
}

type MaskStatus = "idle" | "generating" | "ready" | "failed";

export function Lab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const compositorRef = useRef<Compositor | null>(null);
  const boot = bootRecipe();
  const recipeRef = useRef<Recipe>(boot.recipe);

  const [recipe, setRecipe] = useState<Recipe>(() => recipeRef.current);
  const [error, setError] = useState<string | null>(() => boot.hashError);
  const [exportBusy, setExportBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [reconnectMainId, setReconnectMainId] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState(() => {
    const t = recipeRef.current.objects.find((o) => o.kind === "text");
    return t && t.kind === "text" ? t.text.content : "Prism";
  });
  const [glReady, setGlReady] = useState(false);
  const [intensity, setIntensity] = useState(1);
  const [talkText, setTalkText] = useState("");
  const [talkBusy, setTalkBusy] = useState(false);
  const [talkStatus, setTalkStatus] = useState<string | null>(null);
  const [maskStatus, setMaskStatus] = useState<MaskStatus>(() =>
    mainHasMask(recipeRef.current) ? "ready" : "idle",
  );
  const [maskBanner, setMaskBanner] = useState<string | null>(null);
  const [reconnectMaskId, setReconnectMaskId] = useState<string | null>(null);
  const [selection, setSelection] = useState<CanvasSelection | null>(null);
  const [overlaySize, setOverlaySize] = useState<SizePx | null>(null);
  const [dragOver, setDragOver] = useState(false);

  recipeRef.current = recipe;
  const packs = listPacks();
  const activePack = recipe.packId ? tryGetPack(recipe.packId) : null;
  const packAxes = activePack?.axes ?? null;
  const sliderSpecs = (() => {
    if (packAxes) {
      const fromAxes = slidersForAxes(packAxes);
      if (mainHasDuotone(recipe) && !fromAxes.some((s) => s.id === "duotone")) {
        return [...fromAxes, DUOTONE_SLIDER];
      }
      return fromAxes.length > 0 ? fromAxes : [...SEMANTIC_SLIDERS];
    }
    return mainHasDuotone(recipe)
      ? [...SEMANTIC_SLIDERS, DUOTONE_SLIDER]
      : [...SEMANTIC_SLIDERS];
  })();
  const regionalSpecs = packAxes
    ? regionalSlidersForAxes(packAxes)
    : [...REGIONAL_SLIDERS];
  const showAllRegionalFallback = regionalSpecs.length === 0 && !!packAxes;
  const regionalSliderList = showAllRegionalFallback
    ? [...REGIONAL_SLIDERS]
    : regionalSpecs.length > 0
      ? regionalSpecs
      : [...REGIONAL_SLIDERS];
  const maskReady = maskStatus === "ready" && mainHasMask(recipe);

  const textObj = recipe.objects.find((o) => o.kind === "text");
  const overlayObj = recipe.objects.find((o) => o.kind === "image" && o.role === "overlay");
  const hasText = !!(textObj && textObj.kind === "text");
  const hasOverlay = !!(overlayObj && overlayObj.kind === "image");
  const photoReady = hasMain(recipe);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let cancelled = false;
    let compositor: Compositor;
    try {
      compositor = new Compositor(canvas);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }
    compositorRef.current = compositor;
    setGlReady(true);

    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";

    const syncSize = () => {
      const cssW = Math.max(1, wrap.clientWidth);
      const cssH = Math.max(1, wrap.clientHeight);
      compositor.resize(cssW, cssH);
    };

    const redraw = async () => {
      if (cancelled) return;
      const current = recipeRef.current;
      const { map, error: resolveErr } = await loadAssetsMap(current);
      if (cancelled) return;
      const c = compositorRef.current;
      if (!c) return;
      syncSize();
      const ok = await c.render({ recipe: current, assetsById: map });
      if (cancelled) return;
      if (!ok) {
        setError(c.getError()?.message ?? resolveErr ?? "render failed");
      } else if (resolveErr) {
        setError(resolveErr);
      } else {
        setError(null);
      }
    };

    syncSize();
    void redraw();

    const ro = new ResizeObserver(() => {
      if (cancelled) return;
      syncSize();
      void redraw();
    });
    ro.observe(wrap);

    return () => {
      cancelled = true;
      ro.disconnect();
      compositor.dispose();
      compositorRef.current = null;
      setGlReady(false);
    };
  }, []);

  useEffect(() => {
    saveRecipe(recipe);
    const c = compositorRef.current;
    const wrap = wrapRef.current;
    if (!c || !wrap || !glReady) return;

    let cancelled = false;
    (async () => {
      const { map, error: resolveErr } = await loadAssetsMap(recipe);
      if (cancelled) return;
      if (resolveErr) setError(resolveErr);
      else setError(null);
      const cssW = Math.max(1, wrap.clientWidth);
      const cssH = Math.max(1, wrap.clientHeight);
      c.resize(cssW, cssH);
      const ok = await c.render({ recipe, assetsById: map });
      if (cancelled) return;
      if (!ok) {
        const ce = c.getError();
        if (ce) setError(ce.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [recipe, glReady]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!overlayObj || overlayObj.kind !== "image" || overlayObj.source.type !== "id") {
        setOverlaySize(null);
        return;
      }
      try {
        const rec = await getAsset(overlayObj.source.assetId);
        if (cancelled) return;
        if (rec.width && rec.height) {
          setOverlaySize({ width: rec.width, height: rec.height });
          return;
        }
        const bmp = await createImageBitmap(rec.blob);
        if (cancelled) {
          bmp.close();
          return;
        }
        setOverlaySize({ width: bmp.width, height: bmp.height });
        bmp.close();
      } catch {
        if (!cancelled) setOverlaySize({ width: 1024, height: 1024 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [overlayObj]);

  useEffect(() => {
    if (selection === "text" && !hasText) setSelection(null);
    if (selection === "overlay" && !hasOverlay) setSelection(null);
  }, [selection, hasText, hasOverlay]);

  async function generateMaskForMain(
    file: File,
    baseRecipe: Recipe,
  ): Promise<Recipe> {
    setMaskStatus("generating");
    setMaskBanner(null);
    try {
      const bitmap = await createImageBitmap(file);
      const result = await segmentPersonMask(bitmap);
      bitmap.close();
      if ("code" in result) {
        setMaskStatus("failed");
        setMaskBanner(`Mask unavailable — global grade only (${result.message})`);
        return baseRecipe;
      }
      const maskId = newAssetId("mask");
      await putAsset(maskId, result.blob, {
        width: result.width,
        height: result.height,
        name: `${file.name}-mask.png`,
      });
      const withMask = attachPersonMask(baseRecipe, maskId);
      setMaskStatus("ready");
      return withMask;
    } catch (e) {
      setMaskStatus("failed");
      const detail = e instanceof Error ? e.message : String(e);
      setMaskBanner(`Mask unavailable — global grade only (${detail})`);
      return baseRecipe;
    }
  }

  async function onMainFile(file: File | null) {
    if (!file) return;
    try {
      const assetId = reconnectMainId ?? newAssetId("main");
      await putAsset(assetId, file, { name: file.name });
      if (reconnectMainId) {
        setReconnectMainId(null);
        setError(null);
        setToast(`Reconnected main asset "${assetId}"`);
        setRecipe({ ...recipe });
        return;
      }
      const overlay = recipe.objects.find((o) => o.kind === "image" && o.role === "overlay");
      const text = recipe.objects.find((o) => o.kind === "text");
      const objects = [...recipeWithMain(assetId).objects];
      if (overlay) objects.push(overlay);
      if (text) objects.push(text);
      const base = validateRecipe({ ...identityRecipe(), objects });
      const next = await generateMaskForMain(file, base);
      setRecipe(next);
      setIntensity(1);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onOverlayFile(file: File | null) {
    if (!file) return;
    try {
      const assetId = newAssetId("overlay");
      await putAsset(assetId, file, { name: file.name });
      const withoutOverlay = recipe.objects.filter(
        (o) => !(o.kind === "image" && o.role === "overlay"),
      );
      const objects = [...withoutOverlay, identityOverlayImage(assetId)];
      setRecipe(validateRecipe({ ...recipe, objects }));
      setSelection("overlay");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function ensureTextObject(content: string): Recipe {
    const existing = recipe.objects.find((o) => o.kind === "text");
    if (existing && existing.kind === "text") {
      return applyPathPatch(recipe, [
        { path: "/objects/text/text/content", value: content },
      ]);
    }
    return validateRecipe({
      ...recipe,
      objects: [...recipe.objects, identityText(content)],
    });
  }

  function onTextCommit() {
    try {
      const next = ensureTextObject(textDraft);
      setRecipe(next);
      setSelection("text");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onAddText() {
    try {
      if (hasText) {
        setSelection("text");
        return;
      }
      const next = validateRecipe({
        ...recipe,
        objects: [...recipe.objects, identityText(textDraft || "Prism")],
      });
      setRecipe(next);
      setSelection("text");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onTextPosition(position: TextPositionHint) {
    try {
      const withContent = ensureTextObject(textDraft);
      setRecipe(applyTextLayout(withContent, { position }));
      setSelection("text");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onTypePreset(typePreset: TypePresetId) {
    try {
      const withContent = ensureTextObject(textDraft);
      setRecipe(applyTextLayout(withContent, { typePreset }));
      setSelection("text");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onFontSize(fontSize: number) {
    try {
      const withContent = ensureTextObject(textDraft);
      setRecipe(
        applyPathPatch(withContent, [
          { path: "/objects/text/text/fontSize", value: fontSize },
        ]),
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onOverlayOpacity(opacity: number) {
    try {
      if (!hasOverlay) return;
      setRecipe(
        applyPathPatch(recipe, [{ path: "/objects/overlay/opacity", value: opacity }]),
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onOverlayBlend(blend: BlendMode) {
    try {
      if (!hasOverlay) return;
      setRecipe(applyPathPatch(recipe, [{ path: "/objects/overlay/blend", value: blend }]));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onOverlayScale(scale: number) {
    try {
      if (!hasOverlay || !overlayObj || overlayObj.kind !== "image") return;
      setRecipe(
        patchObjectTransform(recipe, "overlay", {
          ...overlayObj.transform,
          scaleX: scale,
          scaleY: scale,
        }),
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onCanvasTransform(target: CanvasSelection, transform: Transform2D) {
    try {
      setRecipe(patchObjectTransform(recipeRef.current, target, transform));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onReset() {
    setRecipe(identityRecipe());
    setTextDraft("Prism");
    setIntensity(1);
    setMaskStatus("idle");
    setMaskBanner(null);
    setSelection(null);
    setError(null);
  }

  function onPack(packId: string | null) {
    try {
      if (!hasMain(recipe)) {
        setError("upload a main image before applying a pack");
        return;
      }
      if (packId === null) {
        setRecipe(resetLook(recipe));
        setIntensity(1);
      } else {
        const next = applyPack(recipe, packId, { intensity });
        setRecipe(next);
        const t = next.objects.find((o) => o.kind === "text");
        if (t && t.kind === "text") setTextDraft(t.text.content);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onIntensity(next: number) {
    setIntensity(next);
    if (!recipe.packId || !hasMain(recipe)) return;
    try {
      setRecipe(applyPack(recipe, recipe.packId, { intensity: next }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onRegenerateMask() {
    const main = recipe.objects.find((o) => o.kind === "image" && o.role === "main");
    if (!main || main.kind !== "image" || main.source.type !== "id") {
      setError("upload a main image before regenerating mask");
      return;
    }
    try {
      const rec = await getAsset(main.source.assetId);
      const file = new File([rec.blob], rec.name ?? "main.jpg", {
        type: rec.mime || "image/jpeg",
      });
      const next = await generateMaskForMain(file, recipe);
      setRecipe(next);
      setError(null);
      setToast("Mask regenerated");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onRegionalSlider(id: RegionalSliderId, value: number) {
    try {
      if (!maskReady) {
        setError("regional sliders require a ready person mask");
        return;
      }
      setRecipe(applyRegionalSlider(recipe, id, value));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onSlider(id: SemanticSliderId, value: number) {
    try {
      if (!hasMain(recipe)) {
        setError("upload a main image before using sliders");
        return;
      }
      setRecipe(applySemanticSlider(recipe, id, value));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function sendTalk(rawText: string) {
    const text = rawText.trim();
    if (!text || talkBusy) return;
    if (!hasMain(recipe)) {
      setTalkStatus("upload a main image before talk");
      return;
    }
    setTalkText(text);
    setTalkBusy(true);
    setTalkStatus(null);
    try {
      const recipeContext = buildRecipeContext(recipe, {
        selection: selection ?? "none",
      });
      const raw = await postTalk({ text, recipeContext });
      const normalized = normalizeTalkResponse(raw, recipeContext);
      if (!normalized.ok) {
        setTalkStatus(`${normalized.code}: ${normalized.message}`);
        return;
      }
      const applied = applyTalk(recipe, normalized.response);
      if (!applied.ok) {
        setTalkStatus(`${applied.code}: ${applied.message}`);
        return;
      }
      setRecipe(applied.recipe);
      const t = applied.recipe.objects.find((o) => o.kind === "text");
      if (t && t.kind === "text") setTextDraft(t.text.content);
      setError(null);
      if (applied.regenerateMask) {
        await onRegenerateMask();
      }
      if (applied.say) {
        setToast(applied.say);
        setTalkStatus(applied.say);
      } else {
        setTalkStatus("applied");
      }
      setTalkText("");
    } catch (e) {
      if (e instanceof TalkClientError) {
        setTalkStatus(`${e.code}: ${e.message}`);
      } else {
        setTalkStatus(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setTalkBusy(false);
    }
  }

  function onTalkSend() {
    void sendTalk(talkText);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { map } = await loadAssetsMap(recipe);
      if (cancelled) return;
      const missing = listMissingAssets(recipe, map);
      const mainMiss = missing.find((m) => m.role === "main");
      const maskMiss = missing.find((m) => m.role === "mask");
      setReconnectMainId(mainMiss?.assetId ?? null);
      setReconnectMaskId(maskMiss?.assetId ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [recipe]);

  async function onDownloadPng() {
    const c = compositorRef.current;
    const wrap = wrapRef.current;
    if (!c || !wrap) return;
    setExportBusy(true);
    setToast(null);
    try {
      const { map, error: resolveErr } = await loadAssetsMap(recipe);
      if (resolveErr) {
        const missing = listMissingAssets(recipe, map);
        const mainMiss = missing.find((m) => m.role === "main");
        if (mainMiss) setReconnectMainId(mainMiss.assetId);
        setError(resolveErr);
        return;
      }
      await downloadPng(c, recipe, map, Math.max(1, wrap.clientHeight));
      setToast("PNG downloaded");
    } catch (e) {
      const msg =
        e instanceof ExportError || e instanceof ShareHashError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e);
      setError(msg);
    } finally {
      setExportBusy(false);
    }
  }

  function onDownloadRecipe() {
    try {
      downloadRecipeJson(recipe);
      setToast("Recipe JSON downloaded");
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDownloadBoth() {
    await onDownloadPng();
    onDownloadRecipe();
  }

  async function onCopyLink() {
    try {
      const hash = encodeRecipeHash(recipe);
      const url = `${window.location.origin}/lab${hash}`;
      await navigator.clipboard.writeText(url);
      window.history.replaceState(null, "", `/lab${hash}`);
      setToast("Share link copied (recipe only — photos reconnect locally)");
      setError(null);
    } catch (e) {
      const msg =
        e instanceof ShareHashError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e);
      setError(msg);
    }
  }

  function onMainInput(files: FileList | null) {
    const file = takeImageFile(files);
    if (file) void onMainFile(file);
  }

  function onCanvasDragOver(e: DragEvent<HTMLDivElement>) {
    if (photoReady) return;
    e.preventDefault();
    setDragOver(true);
  }

  function onCanvasDragLeave(e: DragEvent<HTMLDivElement>) {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragOver(false);
  }

  function onCanvasDrop(e: DragEvent<HTMLDivElement>) {
    if (photoReady) return;
    e.preventDefault();
    setDragOver(false);
    onMainInput(e.dataTransfer.files);
  }

  return (
    <div className="lab">
      <div className="lab-stage">
        <ErrorBanner message={error} />
        <div
          className={`canvas-wrap${reconnectMainId || reconnectMaskId ? " canvas-blocked" : ""}${
            !photoReady ? " canvas-empty" : ""
          }${dragOver ? " is-dragover" : ""}`}
          ref={wrapRef}
          onDragOver={onCanvasDragOver}
          onDragLeave={onCanvasDragLeave}
          onDrop={onCanvasDrop}
        >
          <canvas ref={canvasRef} width={640} height={480} />
          {photoReady && (
            <CanvasOverlay
              recipe={recipe}
              selection={selection}
              onSelect={setSelection}
              onTransformLive={onCanvasTransform}
              overlaySize={overlaySize}
              disabled={!!reconnectMainId || !!reconnectMaskId}
            />
          )}
          {!photoReady && (
            <label className="canvas-drop">
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  onMainInput(e.target.files);
                  e.target.value = "";
                }}
              />
              <span className="canvas-drop-title">Drop a still</span>
              <span className="canvas-drop-choose">Choose photo</span>
              <span className="muted canvas-drop-hint">
                PNG, JPEG, or WebP — stays in this browser
              </span>
            </label>
          )}
        </div>
        {photoReady && (
          <p className="muted canvas-hint">
            {selection
              ? `Selected ${selection} — drag to move, corners to scale, Esc to clear`
              : "Click text or overlay on canvas to select"}
          </p>
        )}
        {!glReady && <p className="muted canvas-hint">Starting WebGL…</p>}
      </div>

      <div className={`lab-bar panel${!photoReady ? " lab-bar-empty" : ""}`}>
        {!photoReady ? (
          <p className="muted lab-bar-loop">Upload → pack → tune → export</p>
        ) : (
          <>
            <div className="pack-block">
              <div className="pack-block-head">
                <p className="panel-heading">Look</p>
                <label className="replace-chip">
                  Replace
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      onMainInput(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              <div className="pack-strip">
                <div className="pack-row">
                  <button
                    type="button"
                    className={recipe.packId === null ? "active" : undefined}
                    onClick={() => onPack(null)}
                  >
                    None
                  </button>
                  {packs.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={recipe.packId === p.id ? "active" : undefined}
                      onClick={() => onPack(p.id)}
                      title={`${p.family} · ${p.summary}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="intensity-label">
                Intensity {intensity.toFixed(2)}
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={intensity}
                  disabled={!recipe.packId}
                  onChange={(e) => onIntensity(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="slider-block">
              <p className="panel-heading">
                {activePack ? `Tune · ${activePack.label}` : "Tune"}
              </p>
              {!activePack ? (
                <p className="muted">Pick a look pack first.</p>
              ) : (
                <div className="slider-grid">
                  {sliderSpecs.map((spec) => (
                    <label key={spec.id}>
                      {spec.label} {readSliderValue(recipe, spec.id).toFixed(2)}
                      <input
                        type="range"
                        min={spec.min}
                        max={spec.max}
                        step={spec.step}
                        value={readSliderValue(recipe, spec.id)}
                        disabled={!hasMain(recipe)}
                        onChange={(e) => onSlider(spec.id, Number(e.target.value))}
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mask-block">
              <div className="mask-row">
                <p className="panel-heading">
                  Mask{" "}
                  <span className={`mask-chip mask-${maskStatus}`}>{maskStatus}</span>
                </p>
                <button
                  type="button"
                  disabled={!hasMain(recipe) || maskStatus === "generating"}
                  onClick={() => void onRegenerateMask()}
                >
                  {maskStatus === "generating" ? "Generating…" : "Regen"}
                </button>
              </div>
              {maskBanner && <p className="muted mask-banner">{maskBanner}</p>}
            </div>

            <div className="talk-block">
              <p className="panel-heading">Talk</p>
              <div className="talk-chips pack-strip">
                <div className="pack-row">
                  {TALK_MOOD_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      disabled={talkBusy || !hasMain(recipe)}
                      onClick={() => void sendTalk(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
              <div className="talk-compose">
                <label>
                  Mood / refine
                  <input
                    type="text"
                    value={talkText}
                    disabled={talkBusy}
                    placeholder="warm film, mute bg, move title up…"
                    onChange={(e) => setTalkText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onTalkSend();
                    }}
                  />
                </label>
                <button
                  type="button"
                  disabled={talkBusy || !talkText.trim()}
                  onClick={onTalkSend}
                >
                  {talkBusy ? "Sending…" : "Send"}
                </button>
              </div>
              {talkStatus && <p className="muted talk-status">{talkStatus}</p>}
            </div>

            <div className="export-block">
              <div className="lab-bar-actions">
                <button
                  type="button"
                  className="primary"
                  disabled={!hasMain(recipe) || exportBusy}
                  onClick={() => void onDownloadPng()}
                >
                  {exportBusy ? "Exporting…" : "Export PNG"}
                </button>
                <button type="button" onClick={onDownloadRecipe}>
                  Recipe
                </button>
                <button type="button" onClick={() => void onCopyLink()}>
                  Link
                </button>
              </div>
              <p className="muted honesty">
                PNG matches lab preview (handles never export).
              </p>
              {toast && <p className="muted">{toast}</p>}
              {reconnectMainId && (
                <p className="reconnect">
                  Main asset <code>{reconnectMainId}</code> missing — re-upload main.
                </p>
              )}
              {reconnectMaskId && (
                <p className="reconnect">
                  Mask asset <code>{reconnectMaskId}</code> missing — regen or re-upload.
                </p>
              )}
            </div>

            <details className="lab-more">
              <summary>More</summary>
              <div className="lab-more-body">
                <label className="compact-file">
                  Overlay
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void onOverlayFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                <div className="inspector-block">
                  <p className="panel-heading">Inspector</p>
                  {!selection && (
                    <div className="inspector-empty">
                      <p className="muted">Select text or overlay on canvas.</p>
                      {!hasText && (
                        <button type="button" onClick={onAddText}>
                          Add text
                        </button>
                      )}
                    </div>
                  )}
                  {selection === "text" && (
                    <div className="inspector-fields">
                      {!hasText ? (
                        <button type="button" onClick={onAddText}>
                          Add text
                        </button>
                      ) : (
                        <>
                          <label>
                            Content
                            <input
                              type="text"
                              value={textDraft}
                              onChange={(e) => setTextDraft(e.target.value)}
                              onBlur={onTextCommit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") onTextCommit();
                              }}
                            />
                          </label>
                          <label>
                            Size{" "}
                            {textObj && textObj.kind === "text"
                              ? textObj.text.fontSize
                              : 48}
                            <input
                              type="range"
                              min={16}
                              max={160}
                              step={1}
                              value={
                                textObj && textObj.kind === "text"
                                  ? textObj.text.fontSize
                                  : 48
                              }
                              onChange={(e) => onFontSize(Number(e.target.value))}
                            />
                          </label>
                          <div className="pack-row">
                            {TEXT_POSITIONS.map((pos) => (
                              <button
                                key={pos}
                                type="button"
                                onClick={() => onTextPosition(pos)}
                              >
                                {pos}
                              </button>
                            ))}
                          </div>
                          <div className="pack-row">
                            {TYPE_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => onTypePreset(preset)}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {selection === "overlay" &&
                    hasOverlay &&
                    overlayObj &&
                    overlayObj.kind === "image" && (
                      <div className="inspector-fields">
                        <label>
                          Opacity {overlayObj.opacity.toFixed(2)}
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={overlayObj.opacity}
                            onChange={(e) => onOverlayOpacity(Number(e.target.value))}
                          />
                        </label>
                        <label>
                          Blend
                          <select
                            value={overlayObj.blend}
                            onChange={(e) =>
                              onOverlayBlend(e.target.value as BlendMode)
                            }
                          >
                            {BLEND_OPTIONS.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Scale {overlayObj.transform.scaleX.toFixed(2)}
                          <input
                            type="range"
                            min={0.15}
                            max={4}
                            step={0.01}
                            value={overlayObj.transform.scaleX}
                            onChange={(e) => onOverlayScale(Number(e.target.value))}
                          />
                        </label>
                      </div>
                    )}
                  {selection === "overlay" && !hasOverlay && (
                    <p className="muted">Upload an overlay image first.</p>
                  )}
                </div>

                <div className="slider-block regional-block">
                  <p className="panel-heading">Regional</p>
                  {!maskReady && (
                    <p className="muted">Enabled when person mask is ready.</p>
                  )}
                  {regionalSliderList.map((spec) => (
                    <label key={spec.id}>
                      {spec.label}{" "}
                      {(hasMain(recipe)
                        ? readRegionalSliderValue(recipe, spec.id)
                        : 0
                      ).toFixed(2)}
                      <input
                        type="range"
                        min={spec.min}
                        max={spec.max}
                        step={spec.step}
                        value={
                          hasMain(recipe)
                            ? readRegionalSliderValue(recipe, spec.id)
                            : 0
                        }
                        disabled={!maskReady}
                        onChange={(e) =>
                          onRegionalSlider(spec.id, Number(e.target.value))
                        }
                      />
                    </label>
                  ))}
                </div>

                <details className="recipe-peek">
                  <summary>Recipe peek</summary>
                  <pre>{recipePeek(recipe)}</pre>
                </details>
                <div className="lab-more-footer">
                  <button
                    type="button"
                    disabled={!hasMain(recipe) || exportBusy}
                    onClick={() => void onDownloadBoth()}
                  >
                    Export both
                  </button>
                  <button type="button" onClick={onReset}>
                    Reset recipe
                  </button>
                </div>
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
