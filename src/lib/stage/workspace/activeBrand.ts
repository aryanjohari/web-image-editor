import type { StageBrandKit } from "../types";
import { getBrand } from "./brands";
import { notifyWorkspace } from "./notify";
import { WORKSPACE_ACTIVE_BRAND_ID_KEY } from "./types";

export function getActiveBrandId(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const id = localStorage.getItem(WORKSPACE_ACTIVE_BRAND_ID_KEY);
    return id?.trim() || null;
  } catch {
    return null;
  }
}

export function setActiveBrandId(id: string | null): void {
  if (typeof localStorage === "undefined") return;
  try {
    if (!id) {
      localStorage.removeItem(WORKSPACE_ACTIVE_BRAND_ID_KEY);
    } else {
      localStorage.setItem(WORKSPACE_ACTIVE_BRAND_ID_KEY, id);
    }
  } catch {
    /* ignore quota / private mode */
  }
  notifyWorkspace({ type: "activeBrand" });
}

/** Resolve the active brand kit from workspace (null if unset or missing). */
export async function getActiveBrand(): Promise<StageBrandKit | null> {
  const id = getActiveBrandId();
  if (!id) return null;
  return getBrand(id);
}
