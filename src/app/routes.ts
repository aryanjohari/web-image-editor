export type AppRoute = "cover" | "lab" | "hero";

export function normalizeAppPath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

export function hasShareHash(hash: string): boolean {
  return hash.includes("r=");
}

export function pathIsHero(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  return path === "/hero" || path.endsWith("/hero");
}

export function pathIsLab(pathname: string): boolean {
  const path = normalizeAppPath(pathname);
  return path === "/lab" || path.endsWith("/lab");
}

/** Cover (or unknown) URLs with `#r=` must land on the lab so boot hydrate still runs. */
export function shareHashRedirectUrl(pathname: string, hash: string): string | null {
  if (pathIsLab(pathname) || pathIsHero(pathname)) return null;
  if (!hasShareHash(hash)) return null;
  return `/lab${hash}`;
}

export function resolveRoute(pathname: string, hash: string): AppRoute {
  if (pathIsHero(pathname)) return "hero";
  if (pathIsLab(pathname) || hasShareHash(hash)) return "lab";
  return "cover";
}
