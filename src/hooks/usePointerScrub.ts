import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Attach window listeners that fire once scrub ends (pointer/touch release).
 * Pure helper — unit-tested without React.
 */
export function attachWindowScrubEnd(onEnd: () => void): () => void {
  const opts: AddEventListenerOptions = { capture: true };
  const end = () => onEnd();
  window.addEventListener("pointerup", end, opts);
  window.addEventListener("pointercancel", end, opts);
  window.addEventListener("touchend", end, opts);
  return () => {
    window.removeEventListener("pointerup", end, opts);
    window.removeEventListener("pointercancel", end, opts);
    window.removeEventListener("touchend", end, opts);
  };
}

/**
 * Track pointer/touch scrub on range controls (not keyboard).
 * Call `onScrubStart` from slider `pointerdown`; window release clears scrubbing.
 */
export function usePointerScrub() {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const clear = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setIsScrubbing(false);
  }, []);

  const onScrubStart = useCallback(() => {
    setIsScrubbing(true);
    cleanupRef.current?.();
    cleanupRef.current = attachWindowScrubEnd(() => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setIsScrubbing(false);
    });
  }, []);

  useEffect(() => () => cleanupRef.current?.(), []);

  return { isScrubbing, onScrubStart, onScrubEnd: clear };
}
