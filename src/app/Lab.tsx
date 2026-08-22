import { useEffect, useRef, useState } from "react";
import { getAsset, listAssets, putAsset } from "../assets/idb";
import type { AssetRecord } from "../assets/types";
import { AssetStoreError } from "../assets/errors";
import { Compositor } from "../compositor/renderer";
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

const RECIPE_KEY = "prism.recipe.v1";

function loadRecipe(): Recipe {
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
        return {
          map,
          error: `asset "${id}" missing — re-upload`,
        };
      }
      return {
        map,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
  return { map, error: null };
}

export function Lab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const compositorRef = useRef<Compositor | null>(null);
  const recipeRef = useRef<Recipe>(loadRecipe());

  const [recipe, setRecipe] = useState<Recipe>(() => recipeRef.current);
  const [error, setError] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState(() => {
    const t = recipeRef.current.objects.find((o) => o.kind === "text");
    return t && t.kind === "text" ? t.text.content : "Prism";
  });
  const [libraryCount, setLibraryCount] = useState(0);
  const [glReady, setGlReady] = useState(false);

  recipeRef.current = recipe;

  // Single lifecycle: create GL, observe wrap, draw. Survives StrictMode cleanly.
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

    // Lock CSS box so backing-store size never becomes layout size.
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

  // Redraw when recipe changes (compositor already alive).
  useEffect(() => {
    saveRecipe(recipe);
    const c = compositorRef.current;
    const wrap = wrapRef.current;
    if (!c || !wrap || !glReady) return;

    let cancelled = false;
    (async () => {
      const { map, error: resolveErr } = await loadAssetsMap(recipe);
      if (cancelled) return;
      if (resolveErr) {
        setError(resolveErr);
      } else {
        setError(null);
      }
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
      const assetId = newAssetId("main");
      await putAsset(assetId, file, { name: file.name });
      const overlay = recipe.objects.find((o) => o.kind === "image" && o.role === "overlay");
      const text = recipe.objects.find((o) => o.kind === "text");
      const objects = [...recipeWithMain(assetId).objects];
      if (overlay) objects.push(overlay);
      if (text) objects.push(text);
      setRecipe(validateRecipe({ ...identityRecipe(), objects }));
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
    setError(null);
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
        <button type="button" onClick={onReset}>
          Reset recipe
        </button>
        <p className="muted">Asset library: {libraryCount} blob(s) in IndexedDB</p>
        {!glReady && <p className="muted">Starting WebGL…</p>}
      </aside>
      <div className="lab-preview">
        <ErrorBanner message={error} />
        <div className="canvas-wrap" ref={wrapRef}>
          <canvas ref={canvasRef} width={640} height={480} />
        </div>
        <p className="muted canvas-hint">
          Preview stays grey until you upload a main image — that is expected.
        </p>
      </div>
    </div>
  );
}
