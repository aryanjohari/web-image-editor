/**
 * Pure helpers for embedding a Stage live background.
 * CSS / reduced-motion guidance used by the in-repo demo and docs.
 */

export const STAGE_EMBED_DEFAULT_Z_INDEX = 0;

export type EmbedLayerStyle = {
  position: "fixed" | "absolute";
  inset: string;
  zIndex: number;
  pointerEvents: "none";
  width: string;
  height: string;
};

/** Recommended fixed full-viewport layer behind interactive HTML. */
export function getEmbedLayerStyle(options?: {
  position?: "fixed" | "absolute";
  zIndex?: number;
}): EmbedLayerStyle {
  return {
    position: options?.position ?? "fixed",
    inset: "0",
    zIndex: options?.zIndex ?? STAGE_EMBED_DEFAULT_Z_INDEX,
    pointerEvents: "none",
    width: "100%",
    height: "100%",
  };
}

export type MatchMediaFn = (query: string) => { matches: boolean };

/** True when the user prefers reduced motion (injectable for tests). */
export function prefersReducedMotion(
  matchMedia: MatchMediaFn | undefined =
    typeof globalThis.matchMedia === "function"
      ? (q) => globalThis.matchMedia(q)
      : undefined,
): boolean {
  if (!matchMedia) return false;
  try {
    return matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * When reduced motion is preferred, pause time-driven animation by freezing
 * shader time (callers set store baseTime / timeScale accordingly).
 */
export function shouldFreezeEmbedMotion(options?: {
  matchMedia?: MatchMediaFn;
  /** Explicit override from host app */
  forceFreeze?: boolean;
}): boolean {
  if (options?.forceFreeze === true) return true;
  if (options?.forceFreeze === false) return false;
  return prefersReducedMotion(options?.matchMedia);
}

export const STAGE_EMBED_SNIPPET = `<!-- Stage live background (in-repo pattern) -->
<div id="stage-bg" aria-hidden="true" style="position:fixed;inset:0;z-index:0;pointer-events:none"></div>
<main style="position:relative;z-index:1">
  <!-- Your HTML content -->
</main>
<!-- Load StageRecipe JSON → apply look coefficients; see src/lib/stage/EMBED.md -->`;
