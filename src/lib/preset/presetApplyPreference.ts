const STORAGE_KEY = "synth-preserve-text-on-apply";

export const PRESERVE_TEXT_PREFERENCE_EVENT = "synth-preserve-text-changed";

export function getPreserveTextOnApply(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return true;
  return stored === "true";
}

export function setPreserveTextOnApply(value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  window.dispatchEvent(new CustomEvent(PRESERVE_TEXT_PREFERENCE_EVENT, { detail: value }));
}
