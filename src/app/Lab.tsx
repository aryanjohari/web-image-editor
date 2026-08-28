import { useEffect, useRef, useState } from "react";
import { getAsset, listAssets, putAsset } from "../assets/idb";
import type { AssetRecord } from "../assets/types";
import { AssetStoreError } from "../assets/errors";
import { Compositor } from "../compositor/renderer";
import {
  applyPack,
  applySemanticSlider,
  DUOTONE_SLIDER,
  listPacks,
  mainHasDuotone,
  PACK_IDS,
  readSliderValue,
  resetLook,
  SEMANTIC_SLIDERS,
  type SemanticSliderId,
} from "../packs";
import {
  identityOverlayImage,
  identityText,
  identityRecipe,
  recipeWithMain,
} from "../recipe/identityRecipe";
import { applyPathPatch } from "../recipe/pathPatch";
import type { Recipe } from "../recipe/types";
import { validateRecipe } from "../recipe/validate";
import { ErrorBanner } from "./ErrorBanner";
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
  postTalk,
  TalkClientError,
} from "../talk";

const RECIPE_KEY = "prism.recipe.v1";

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
    if (o.kind === "image" && o.source.type === "id") {
      ids.add(o.source.assetId);
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

function recipePeek(recipe: Recipe): string {
  const main = recipe.objects.find((o) => o.kind === "image" && o.role === "main");
  const effects = main && main.kind === "image" ? main.effects : [];
  return JSON.stringify(
    {
      packId: recipe.packId,
      packVersion: recipe.packVersion,
      mainEffects: effects,
    },
    null,
    2,
  );
}

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
  const [libraryCount, setLibraryCount] = useState(0);
  const [glReady, setGlReady] = useState(false);
  const [intensity, setIntensity] = useState(1);
  const [talkText, setTalkText] = useState("");
  const [talkBusy, setTalkBusy] = useState(false);
  const [talkStatus, setTalkStatus] = useState<string | null>(null);

  recipeRef.current = recipe;
  const packs = listPacks();
  const sliderSpecs = mainHasDuotone(recipe)
    ? [...SEMANTIC_SLIDERS, DUOTONE_SLIDER]
    : [...SEMANTIC_SLIDERS];

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
      const list = await listAssets();
      if (!cancelled) setLibraryCount(list.length);
    })();
    return () => {
      cancelled = true;
    };
  }, [recipe]);

  async function onMainFile(file: File | null) {
    if (!file) return;
    try {
      const assetId = reconnectMainId ?? newAssetId("main");
      await putAsset(assetId, file, { name: file.name });
      if (reconnectMainId) {
        // FILTR reconnect: keep shared recipe, fill expected asset id
        setReconnectMainId(null);
        setError(null);
        setToast(`Reconnected main asset "${assetId}"`);
        setRecipe({ ...recipe }); // trigger redraw with same recipe
        return;
      }
      const overlay = recipe.objects.find((o) => o.kind === "image" && o.role === "overlay");
      const text = recipe.objects.find((o) => o.kind === "text");
      const objects = [...recipeWithMain(assetId).objects];
      if (overlay) objects.push(overlay);
      if (text) objects.push(text);
      setRecipe(validateRecipe({ ...identityRecipe(), objects }));
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
      setRecipe(ensureTextObject(textDraft));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function onReset() {
    setRecipe(identityRecipe());
    setTextDraft("Prism");
    setIntensity(1);
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
        setRecipe(applyPack(recipe, packId, { intensity }));
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

  async function onTalkSend() {
    const text = talkText.trim();
    if (!text || talkBusy) return;
    if (!hasMain(recipe)) {
      setTalkStatus("upload a main image before talk");
      return;
    }
    setTalkBusy(true);
    setTalkStatus(null);
    try {
      const recipeContext = buildRecipeContext(recipe);
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
      setError(null);
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



  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { map } = await loadAssetsMap(recipe);
      if (cancelled) return;
      const missing = listMissingAssets(recipe, map);
      const mainMiss = missing.find((m) => m.role === "main");
      setReconnectMainId(mainMiss?.assetId ?? null);
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
      const url = `${window.location.origin}${window.location.pathname}${hash}`;
      await navigator.clipboard.writeText(url);
      window.history.replaceState(null, "", hash);
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

  return (
    <div className="lab">
      <aside className="panel">
        <label>
          Main image
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void onMainFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Overlay image
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void onOverlayFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Text
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
        <button type="button" onClick={onTextCommit}>
          Apply text
        </button>

        <div className="talk-block">
          <p className="panel-heading">Talk</p>
          <label>
            Mood / refine
            <input
              type="text"
              value={talkText}
              disabled={talkBusy}
              placeholder="e.g. warm film, less grain…"
              onChange={(e) => setTalkText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void onTalkSend();
              }}
            />
          </label>
          <button
            type="button"
            disabled={talkBusy || !talkText.trim()}
            onClick={() => void onTalkSend()}
          >
            {talkBusy ? "Sending…" : "Send"}
          </button>
          {talkStatus && <p className="muted talk-status">{talkStatus}</p>}
        </div>

        <div className="pack-block">
          <p className="panel-heading">Packs</p>
          <div className="pack-row">
            <button
              type="button"
              className={recipe.packId === null ? "active" : undefined}
              onClick={() => onPack(null)}
            >
              None / identity
            </button>
            {packs.map((p) => (
              <button
                key={p.id}
                type="button"
                className={recipe.packId === p.id ? "active" : undefined}
                onClick={() => onPack(p.id)}
                title={p.summary}
              >
                {p.label}
              </button>
            ))}
          </div>
          <label>
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
          <p className="panel-heading">Sliders</p>
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

        <div className="export-block">
          <p className="panel-heading">Export</p>
          <div className="pack-row">
            <button
              type="button"
              disabled={!hasMain(recipe) || exportBusy}
              onClick={() => void onDownloadPng()}
            >
              {exportBusy ? "Exporting…" : "Download PNG"}
            </button>
            <button type="button" onClick={onDownloadRecipe}>
              Download recipe
            </button>
            <button type="button" onClick={() => void onCopyLink()}>
              Copy share link
            </button>
            <button
              type="button"
              disabled={!hasMain(recipe) || exportBusy}
              onClick={() => void onDownloadBoth()}
            >
              PNG + recipe
            </button>
          </div>
          <p className="muted honesty">
            PNG matches lab preview (blends are approximate).
          </p>
          {toast && <p className="muted">{toast}</p>}
          {reconnectMainId && (
            <p className="reconnect">
              Main asset <code>{reconnectMainId}</code> missing — re-upload main to
              reconnect this shared recipe.
            </p>
          )}
        </div>

        <button type="button" onClick={onReset}>
          Reset recipe
        </button>
        <p className="muted">Asset library: {libraryCount} blob(s) in IndexedDB</p>
        <p className="muted">Catalog: {PACK_IDS.join(", ")}</p>
        {!glReady && <p className="muted">Starting WebGL…</p>}

        <details className="recipe-peek">
          <summary>Recipe peek</summary>
          <pre>{recipePeek(recipe)}</pre>
        </details>
      </aside>
      <div className="lab-preview">
        <ErrorBanner message={error} />
        <div className={`canvas-wrap${reconnectMainId ? " canvas-blocked" : ""}`} ref={wrapRef}>
          <canvas ref={canvasRef} width={640} height={480} />
        </div>
        <p className="muted canvas-hint">
          Preview stays grey until you upload a main image — that is expected.
        </p>
      </div>
    </div>
  );
}
