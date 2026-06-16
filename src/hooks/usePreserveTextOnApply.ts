import { useEffect, useState } from "react";
import {
  getPreserveTextOnApply,
  PRESERVE_TEXT_PREFERENCE_EVENT,
  setPreserveTextOnApply,
} from "@/lib/preset/presetApplyPreference";

export function usePreserveTextOnApply(): [boolean, (value: boolean) => void] {
  const [preserveText, setPreserveText] = useState(getPreserveTextOnApply);

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setPreserveText(typeof detail === "boolean" ? detail : getPreserveTextOnApply());
    };
    window.addEventListener(PRESERVE_TEXT_PREFERENCE_EVENT, onChange);
    return () => window.removeEventListener(PRESERVE_TEXT_PREFERENCE_EVENT, onChange);
  }, []);

  return [preserveText, setPreserveTextOnApply];
}
