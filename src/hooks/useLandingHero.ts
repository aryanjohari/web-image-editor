import { useEffect, useRef, useState } from "react";
import { initLandingHero } from "@/lib/landing/initLandingHero";

export function useLandingHero(): { isLoading: boolean } {
  const [isLoading, setIsLoading] = useState(true);
  const initGenerationRef = useRef(0);

  useEffect(() => {
    const generation = ++initGenerationRef.current;
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      try {
        await initLandingHero();
      } catch (err) {
        console.error("[useLandingHero]", err);
      } finally {
        if (!cancelled && generation === initGenerationRef.current) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { isLoading };
}
