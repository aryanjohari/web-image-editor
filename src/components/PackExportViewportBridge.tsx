import { useLayoutEffect, useEffect, useReducer, useRef } from "react";
import { useThree } from "@react-three/fiber";
import {
  getPackExportViewportTarget,
  notifyPackExportViewportReady,
  subscribePackExportViewport,
} from "@/lib/stage/packExportViewport";

/**
 * Re-asserts R3F size/DPR while a campaign pack capture is in progress,
 * so Canvas measure/reconfigure cannot overwrite the pack profile resolution.
 */
export function PackExportViewportBridge() {
  const setSize = useThree((s) => s.setSize);
  const setDpr = useThree((s) => s.setDpr);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const [, bump] = useReducer((n: number) => n + 1, 0);
  const restoreRef = useRef<{ width: number; height: number; dpr: number } | null>(null);

  useEffect(() => subscribePackExportViewport(() => bump()), []);

  const target = getPackExportViewportTarget();

  useLayoutEffect(() => {
    if (target) {
      if (!restoreRef.current) {
        restoreRef.current = {
          width: size.width,
          height: size.height,
          dpr: gl.getPixelRatio(),
        };
      }
      setDpr(1);
      setSize(target.width, target.height);
      invalidate(2);
      return;
    }

    if (restoreRef.current) {
      const parent = gl.domElement.parentElement;
      const width = parent?.clientWidth || restoreRef.current.width;
      const height = parent?.clientHeight || restoreRef.current.height;
      setDpr(restoreRef.current.dpr);
      setSize(Math.max(1, width), Math.max(1, height));
      restoreRef.current = null;
      invalidate(2);
    }
  }, [target, setSize, setDpr, invalidate, gl, size.width, size.height]);

  // Survive parent re-renders that reconfigure from container measure mid-export.
  useLayoutEffect(() => {
    if (!target) return;
    if (size.width !== target.width || size.height !== target.height) {
      setDpr(1);
      setSize(target.width, target.height);
      invalidate(2);
    }
  });

  useLayoutEffect(() => {
    if (!target) return;
    if (size.width === target.width && size.height === target.height) {
      const id = requestAnimationFrame(() => {
        notifyPackExportViewportReady();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [target, size.width, size.height]);

  return null;
}
