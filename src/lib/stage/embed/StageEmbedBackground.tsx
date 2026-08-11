/**
 * In-repo React helper: full-bleed WebGL background from a StageRecipe.
 * Not a standalone npm player — ports outside this repo still need PORTING.md.
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { SynthCanvasView } from "@/components/SynthCanvasView";
import { useSynthStore } from "@/store/useSynthStore";
import { applyStageRecipeJson, recipeToJson } from "../applyRecipe";
import type { StageRecipe } from "../types";
import {
  getEmbedLayerStyle,
  shouldFreezeEmbedMotion,
  type EmbedLayerStyle,
} from "./embedHelpers";

export type StageEmbedBackgroundProps = {
  recipe: StageRecipe;
  /** Respect prefers-reduced-motion (default true). */
  respectReducedMotion?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

export function StageEmbedBackground({
  recipe,
  respectReducedMotion = true,
  className,
  style,
  children,
}: StageEmbedBackgroundProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);

    (async () => {
      const result = await applyStageRecipeJson(recipeToJson(recipe, false));
      if (cancelled) return;
      if (!result.ok) {
        setStatus("error");
        setError(result.error);
        return;
      }

      if (respectReducedMotion && shouldFreezeEmbedMotion()) {
        // Freeze animated time scale on all layers for a near-static poster look.
        const store = useSynthStore.getState();
        const le = structuredClone(store.layerEffects);
        for (const id of ["background", "decal", "text"] as const) {
          le[id] = { ...le[id], timeScale: 0, colorCycleSpeed: 0 };
        }
        store.replaceLayerEffects(le);
      }

      setStatus("ready");
    })().catch((err) => {
      if (cancelled) return;
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to apply recipe");
    });

    return () => {
      cancelled = true;
    };
  }, [recipe, respectReducedMotion]);

  const layer: EmbedLayerStyle = getEmbedLayerStyle({ position: "absolute" });
  const layerStyle: CSSProperties = {
    ...layer,
    ...style,
  };

  return (
    <>
      <div className={className} style={layerStyle} aria-hidden="true">
        <SynthCanvasView />
      </div>
      {status === "error" && error ? (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-20 text-center text-xs text-red-200">
          Embed failed: {error}
        </div>
      ) : null}
      {children}
    </>
  );
}
