import { getPresetById } from "@/data/presetCatalog";

export function parsePresetIdFromSearchParams(
  params: URLSearchParams,
): string | null {
  const id = params.get("preset")?.trim();
  return id ? id : null;
}

export function isValidCatalogPresetId(id: string): boolean {
  return getPresetById(id) !== undefined;
}

export function buildPresetShareUrl(
  path: "/" | "/lab",
  presetId: string,
  origin?: string,
): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  const query = new URLSearchParams({ preset: presetId });
  return `${base}${path}?${query.toString()}`;
}
