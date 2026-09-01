/** DOM selection chrome + pointer → recipe transform (M07). Never drawn into export FBO. */

import { useEffect, useRef, useState } from "react";
import type { Recipe, Transform2D } from "../recipe/types";
import {
  applyDragDelta,
  applyUniformScale,
  cssToNdc,
  distPx,
  hitTestSelection,
  selectionScreenRect,
  type CanvasSelection,
  type SizePx,
} from "../canvas";

type Mode = "idle" | "drag" | "resize";

type DragState = {
  mode: Mode;
  selection: CanvasSelection;
  startTransform: Transform2D;
  startNdcX: number;
  startNdcY: number;
  startDist: number;
  centerCssX: number;
  centerCssY: number;
};

export type CanvasOverlayProps = {
  recipe: Recipe;
  selection: CanvasSelection | null;
  onSelect: (next: CanvasSelection | null) => void;
  onTransformLive: (target: CanvasSelection, transform: Transform2D) => void;
  overlaySize?: SizePx | null;
  disabled?: boolean;
};

function readTransform(recipe: Recipe, selection: CanvasSelection): Transform2D | null {
  if (selection === "text") {
    const t = recipe.objects.find((o) => o.kind === "text");
    return t && t.kind === "text" ? t.transform : null;
  }
  const o = recipe.objects.find((obj) => obj.kind === "image" && obj.role === "overlay");
  return o && o.kind === "image" ? o.transform : null;
}

export function CanvasOverlay({
  recipe,
  selection,
  onSelect,
  onTransformLive,
  overlaySize,
  disabled,
}: CanvasOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [, setTick] = useState(0);

  const viewW = rootRef.current?.clientWidth ?? 1;
  const viewH = rootRef.current?.clientHeight ?? 1;
  const dims = { viewW, viewH, overlay: overlaySize };

  const screen =
    selection && viewW > 1
      ? selectionScreenRect(recipe, selection, dims)
      : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSelect(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSelect]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setTick((n) => n + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function localPoint(e: React.PointerEvent): { x: number; y: number } {
    const el = rootRef.current!;
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (disabled || e.button !== 0) return;
    const el = rootRef.current;
    if (!el) return;
    const { x, y } = localPoint(e);
    const w = el.clientWidth;
    const h = el.clientHeight;
    const ndc = cssToNdc(x, y, w, h);

    const handle = (e.target as HTMLElement).dataset.handle;
    if (handle && selection) {
      const t = readTransform(recipe, selection);
      if (!t) return;
      const rect = selectionScreenRect(recipe, selection, {
        viewW: w,
        viewH: h,
        overlay: overlaySize,
      });
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      dragRef.current = {
        mode: "resize",
        selection,
        startTransform: { ...t },
        startNdcX: ndc.x,
        startNdcY: ndc.y,
        startDist: Math.max(8, distPx(x, y, cx, cy)),
        centerCssX: cx,
        centerCssY: cy,
      };
      el.setPointerCapture(e.pointerId);
      e.preventDefault();
      return;
    }

    const hit = hitTestSelection(recipe, ndc.x, ndc.y, {
      viewW: w,
      viewH: h,
      overlay: overlaySize,
    });
    onSelect(hit);
    if (!hit) {
      dragRef.current = null;
      return;
    }
    const t = readTransform(recipe, hit);
    if (!t) return;
    const rect = selectionScreenRect(recipe, hit, {
      viewW: w,
      viewH: h,
      overlay: overlaySize,
    });
    dragRef.current = {
      mode: "drag",
      selection: hit,
      startTransform: { ...t },
      startNdcX: ndc.x,
      startNdcY: ndc.y,
      startDist: 0,
      centerCssX: rect ? rect.left + rect.width / 2 : x,
      centerCssY: rect ? rect.top + rect.height / 2 : y,
    };
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    const el = rootRef.current;
    if (!drag || !el) return;
    const { x, y } = localPoint(e);
    const w = el.clientWidth;
    const h = el.clientHeight;
    const ndc = cssToNdc(x, y, w, h);

    if (drag.mode === "drag") {
      const next = applyDragDelta(
        drag.startTransform,
        ndc.x - drag.startNdcX,
        ndc.y - drag.startNdcY,
      );
      onTransformLive(drag.selection, next);
    } else if (drag.mode === "resize") {
      const d = distPx(x, y, drag.centerCssX, drag.centerCssY);
      const next = applyUniformScale(drag.startTransform, drag.startDist, d);
      onTransformLive(drag.selection, next);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    dragRef.current = null;
    try {
      rootRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  return (
    <div
      ref={rootRef}
      className="canvas-overlay"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {screen && selection && (
        <div
          className="selection-box"
          style={{
            left: screen.left,
            top: screen.top,
            width: screen.width,
            height: screen.height,
          }}
        >
          <span className="selection-handle" data-handle="nw" style={{ left: 0, top: 0 }} />
          <span className="selection-handle" data-handle="ne" style={{ right: 0, top: 0 }} />
          <span className="selection-handle" data-handle="sw" style={{ left: 0, bottom: 0 }} />
          <span className="selection-handle" data-handle="se" style={{ right: 0, bottom: 0 }} />
        </div>
      )}
    </div>
  );
}
