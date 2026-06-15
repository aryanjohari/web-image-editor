import { useEffect, useRef } from "react";
import { type ThreeEvent, useThree } from "@react-three/fiber";
import { SynthMaterial } from "@/webgl/materials/SynthMaterial";
import { useSynthStore } from "@/store/useSynthStore";

function setCanvasCursor(el: HTMLElement, cursor: string) {
  el.style.cursor = cursor;
}

export function SynthScene() {
  const imageTexture = useSynthStore((state) => state.imageTexture);
  const domElement = useThree((state) => state.gl.domElement);
  const isDragging = useRef(false);
  const prevCanvas = useRef({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);
  const detachDragListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const el = domElement;
    return () => {
      detachDragListenersRef.current?.();
      detachDragListenersRef.current = null;
      try {
        const id = activePointerId.current;
        if (id != null) el.releasePointerCapture(id);
      } catch {
        /* already released */
      }
      setCanvasCursor(el, "");
    };
  }, [domElement]);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    detachDragListenersRef.current?.();

    const el = domElement;
    const rect = el.getBoundingClientRect();
    isDragging.current = true;
    activePointerId.current = e.pointerId;
    prevCanvas.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    el.setPointerCapture(e.pointerId);
    setCanvasCursor(el, "grabbing");

    const onMove = (ev: PointerEvent) => {
      if (!isDragging.current || ev.pointerId !== activePointerId.current) return;
      const r = el.getBoundingClientRect();
      const x = ev.clientX - r.left;
      const y = ev.clientY - r.top;
      const dx = x - prevCanvas.current.x;
      const dy = y - prevCanvas.current.y;
      prevCanvas.current = { x, y };
      const w = Math.max(r.width, 1);
      const h = Math.max(r.height, 1);
      const { stackTab, decalTexture, updateDecalOffset, updateSelectedTextLayerOffset, selectedTextLayerId } =
        useSynthStore.getState();
      if (stackTab === "text" && decalTexture && selectedTextLayerId) {
        updateSelectedTextLayerOffset(dx / w, -dy / h);
      } else {
        updateDecalOffset(dx / w, -dy / h);
      }
    };

    const detach = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      detachDragListenersRef.current = null;
    };

    const onUp = (ev: PointerEvent) => {
      if (ev.pointerId !== activePointerId.current) return;
      isDragging.current = false;
      activePointerId.current = null;
      detach();
      setCanvasCursor(el, "");
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch {
        /* noop */
      }
    };

    detachDragListenersRef.current = detach;
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  };

  const onPointerEnter = () => {
    if (!isDragging.current) setCanvasCursor(domElement, "grab");
  };

  const onPointerLeave = () => {
    if (!isDragging.current) setCanvasCursor(domElement, "");
  };

  return (
    <mesh
      onPointerDown={onPointerDown}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <planeGeometry args={[2, 2]} />
      <SynthMaterial key={imageTexture ? imageTexture.uuid : "empty"} />
    </mesh>
  );
}
