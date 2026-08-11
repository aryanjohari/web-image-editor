import { useEffect, useId, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BrandEditorForm,
  colorsToString,
  fontsToString,
  parseFontList,
  parseHexList,
} from "@/components/lab/BrandEditorForm";
import {
  applyWorkspaceAssetAsHero,
  applyWorkspaceAssetAsOverlay,
} from "@/components/lab/applyWorkspaceAsset";
import { createEmptyBrandKit, brandKitHasRules } from "@/lib/stage";
import {
  createBrandId,
  deleteAsset,
  deleteBrand,
  ensureWorkspaceMigrated,
  getActiveBrandId,
  isOverlayMime,
  listAssets,
  listBrands,
  putAssetFromFile,
  putBrand,
  setActiveBrandId,
  subscribeWorkspace,
  type WorkspaceAsset,
} from "@/lib/stage/workspace";
import type { StageBrandKit } from "@/lib/stage/types";

type Tab = "brands" | "assets";

function emptyDraft(): StageBrandKit {
  return createEmptyBrandKit({ id: createBrandId(), name: "" });
}

const tabBtnBase =
  "rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]";
const softBtn =
  "rounded-xl border border-stage-border bg-stage-panel px-3 py-1.5 text-sm text-stage-text transition hover:border-stage-accent/40 hover:bg-stage-elevated disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]";
const primaryBtn =
  "rounded-xl bg-stage-text px-3 py-1.5 text-sm font-medium text-stage-bg transition hover:bg-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]";

/**
 * Brands + Assets library for the Workspace page (IndexedDB stage-workspace).
 */
export function WorkspaceLibrary() {
  const navigate = useNavigate();
  const tabsId = useId();
  const [tab, setTab] = useState<Tab>("brands");
  const [brands, setBrands] = useState<StageBrandKit[]>([]);
  const [assets, setAssets] = useState<WorkspaceAsset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<StageBrandKit | null>(null);
  const [colorsText, setColorsText] = useState("");
  const [fontsText, setFontsText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [thumbUrls, setThumbUrls] = useState<Record<string, string>>({});

  const refresh = async () => {
    await ensureWorkspaceMigrated();
    const [b, a] = await Promise.all([listBrands(), listAssets()]);
    setBrands(b);
    setAssets(a);
    setActiveId(getActiveBrandId());
  };

  useEffect(() => {
    void refresh().catch((e) => {
      console.error("[WorkspaceLibrary]", e);
      setStatus("Workspace unavailable");
    });
  }, []);

  useEffect(() => {
    return subscribeWorkspace(() => {
      void refresh();
    });
  }, []);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const asset of assets) {
      try {
        if (asset.blob instanceof Blob && asset.blob.size > 0) {
          next[asset.id] = URL.createObjectURL(asset.blob);
        }
      } catch (err) {
        console.error("[WorkspaceLibrary] thumbnail", asset.id, err);
      }
    }
    setThumbUrls(next);
    return () => {
      for (const url of Object.values(next)) URL.revokeObjectURL(url);
    };
  }, [assets]);

  const startCreate = () => {
    const draft = emptyDraft();
    setEditing(draft);
    setColorsText("");
    setFontsText("");
    setStatus(null);
  };

  const startEdit = (brand: StageBrandKit) => {
    setEditing({ ...brand });
    setColorsText(colorsToString(brand.colors));
    setFontsText(fontsToString(brand.fonts));
    setStatus(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setStatus(null);
  };

  const saveBrand = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const saved = await putBrand({
        ...editing,
        colors: parseHexList(colorsText),
        fonts: parseFontList(fontsText),
      });
      if (!getActiveBrandId()) {
        setActiveBrandId(saved.id);
      }
      setEditing(null);
      setStatus(`Saved ${saved.name}`);
      await refresh();
    } catch (err) {
      console.error(err);
      setStatus("Save failed");
    } finally {
      setBusy(false);
    }
  };

  const activate = (id: string) => {
    setActiveBrandId(id);
    setActiveId(id);
    setStatus("Active brand updated");
  };

  const removeBrand = async (id: string) => {
    if (!window.confirm("Delete this brand from this browser?")) return;
    setBusy(true);
    try {
      await deleteBrand(id);
      if (getActiveBrandId() === id) {
        setActiveBrandId(null);
      }
      if (editing?.id === id) setEditing(null);
      await refresh();
      setStatus("Brand deleted");
    } finally {
      setBusy(false);
    }
  };

  const onUploadAssets = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;
    setBusy(true);
    let uploaded = 0;
    let previewOk = 0;
    const errors: string[] = [];
    try {
      for (const file of files) {
        try {
          const asset = await putAssetFromFile({ file, kind: "image" });
          uploaded += 1;
          const blobOk = asset.blob instanceof Blob && asset.blob.size > 0;
          if (blobOk) previewOk += 1;
        } catch (err) {
          console.error(err);
          errors.push(err instanceof Error ? err.message : "Upload failed");
        }
      }
      await refresh();
      if (uploaded === 0) {
        setStatus(errors[0] ?? "Upload failed");
      } else {
        const previewLabel =
          previewOk === uploaded ? "preview ok" : `preview ${previewOk}/${uploaded} ok`;
        const errSuffix = errors.length ? ` · ${errors[0]}` : "";
        setStatus(`Uploaded ${uploaded} · ${previewLabel}${errSuffix}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const removeAsset = async (id: string) => {
    if (!window.confirm("Delete this asset from this browser?")) return;
    setBusy(true);
    try {
      await deleteAsset(id);
      await refresh();
      setStatus("Asset deleted");
    } finally {
      setBusy(false);
    }
  };

  const useHero = async (asset: WorkspaceAsset) => {
    setBusy(true);
    try {
      await applyWorkspaceAssetAsHero(asset);
      setStatus(`Hero: ${asset.name}`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to set hero");
    } finally {
      setBusy(false);
    }
  };

  const useOverlay = async (asset: WorkspaceAsset) => {
    setBusy(true);
    try {
      await applyWorkspaceAssetAsOverlay(asset);
      setStatus(`Overlay: ${asset.name}`);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to set overlay");
    } finally {
      setBusy(false);
    }
  };

  const openInStudio = async (asset: WorkspaceAsset, mode: "hero" | "overlay") => {
    setBusy(true);
    try {
      if (mode === "hero") await applyWorkspaceAssetAsHero(asset);
      else await applyWorkspaceAssetAsOverlay(asset);
      navigate("/studio");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to open in Studio");
    } finally {
      setBusy(false);
    }
  };

  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setTab((t) => (t === "brands" ? "assets" : "brands"));
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Workspace sections"
        className="flex flex-wrap gap-2"
        onKeyDown={onTabKeyDown}
      >
        {(["brands", "assets"] as const).map((id) => {
          const selected = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`${tabsId}-${id}`}
              aria-selected={selected}
              aria-controls={`${tabsId}-panel-${id}`}
              tabIndex={selected ? 0 : -1}
              className={`${tabBtnBase} ${
                selected
                  ? "bg-stage-text text-stage-bg"
                  : "border border-stage-border bg-stage-panel text-stage-muted hover:text-stage-text"
              }`}
              onClick={() => setTab(id)}
            >
              {id === "brands" ? "Brands" : "Assets"}
            </button>
          );
        })}
      </div>

      {status ? (
        <p
          role="status"
          className="rounded-2xl border border-stage-border bg-stage-accent-soft px-4 py-3 text-sm text-stage-text"
          style={{ background: "var(--stage-accent-soft)" }}
        >
          {status}
        </p>
      ) : null}

      {tab === "brands" ? (
        <div
          role="tabpanel"
          id={`${tabsId}-panel-brands`}
          aria-labelledby={`${tabsId}-brands`}
          className="flex flex-col gap-4"
        >
          {!editing ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-stage-muted">
                  Brands stay in this browser. The floating brief in Studio uses the active brand.
                </p>
                <button type="button" disabled={busy} className={primaryBtn} onClick={startCreate}>
                  New brand
                </button>
              </div>
              {brands.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stage-border bg-stage-panel/50 px-6 py-12 text-center">
                  <p className="text-base text-stage-text">No brands yet</p>
                  <p className="mt-2 text-sm text-stage-muted">
                    Create a brand kit so briefs respect your colours, fonts, and limits.
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    className={`${primaryBtn} mt-6`}
                    onClick={startCreate}
                  >
                    Create brand
                  </button>
                </div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {brands.map((brand) => {
                    const isActive = brand.id === activeId;
                    return (
                      <li
                        key={brand.id}
                        className="rounded-2xl border border-stage-border bg-stage-panel p-4 shadow-stage"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-base font-medium text-stage-text">
                              {brand.name || "Untitled"}
                            </p>
                            <p className="mt-1 text-sm text-stage-muted">
                              {brandKitHasRules(brand) ? "Has rules" : "Weak prompt"}
                              {isActive ? " · Active" : ""}
                            </p>
                          </div>
                          {isActive ? (
                            <span className="shrink-0 rounded-lg bg-stage-accent-soft px-2 py-1 text-xs font-medium text-stage-accent"
                              style={{ background: "var(--stage-accent-soft)" }}
                            >
                              Active
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {!isActive ? (
                            <button
                              type="button"
                              className={softBtn}
                              onClick={() => activate(brand.id)}
                            >
                              Set active
                            </button>
                          ) : null}
                          <button type="button" className={softBtn} onClick={() => startEdit(brand)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`${softBtn} text-stage-muted`}
                            onClick={() => void removeBrand(brand.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <form
              className="rounded-2xl border border-stage-border bg-stage-panel p-5 shadow-stage"
              onSubmit={(e) => void saveBrand(e)}
            >
              <p className="mb-4 text-sm font-medium text-stage-text">
                {brands.some((b) => b.id === editing.id) ? "Edit brand" : "New brand"}
              </p>
              <BrandEditorForm
                draft={editing}
                colorsText={colorsText}
                fontsText={fontsText}
                onDraftChange={setEditing}
                onColorsTextChange={setColorsText}
                onFontsTextChange={setFontsText}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="submit" disabled={busy} className={primaryBtn}>
                  Save
                </button>
                <button type="button" className={softBtn} onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div
          role="tabpanel"
          id={`${tabsId}-panel-assets`}
          aria-labelledby={`${tabsId}-assets`}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-stage-muted">
            Upload images here, then set hero or overlay — or open them in Studio. Selecting an asset
            does not apply it until you choose an action.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label className={`${primaryBtn} cursor-pointer`}>
              Upload images
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                disabled={busy}
                onChange={(e) => void onUploadAssets(e)}
              />
            </label>
            <Link to="/studio" className={`${softBtn} no-underline`}>
              Open Studio
            </Link>
          </div>
          {assets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stage-border bg-stage-panel/50 px-6 py-12 text-center">
              <p className="text-base text-stage-text">No assets yet</p>
              <p className="mt-2 text-sm text-stage-muted">
                Upload PNG, JPEG, or WebP — they persist in IndexedDB on this device.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {assets.map((asset) => {
                const thumb = thumbUrls[asset.id];
                return (
                  <li
                    key={asset.id}
                    className="flex flex-col gap-2 rounded-2xl border border-stage-border bg-stage-panel p-3 shadow-stage"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-stage-elevated">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={asset.name}
                          className="h-full w-full object-cover"
                          onError={() => {
                            setThumbUrls((prev) => {
                              const { [asset.id]: stale, ...rest } = prev;
                              if (stale) URL.revokeObjectURL(stale);
                              return rest;
                            });
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
                          <span className="text-sm text-stage-muted">No preview</span>
                        </div>
                      )}
                    </div>
                    <p className="truncate text-sm text-stage-text" title={asset.name}>
                      {asset.name}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        className={softBtn}
                        onClick={() => void useHero(asset)}
                      >
                        Use as hero
                      </button>
                      <button
                        type="button"
                        disabled={busy || !isOverlayMime(asset.mime)}
                        title={
                          isOverlayMime(asset.mime) ? undefined : "Overlay requires PNG or WebP"
                        }
                        className={softBtn}
                        onClick={() => void useOverlay(asset)}
                      >
                        Use as overlay
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className={softBtn}
                        onClick={() => void openInStudio(asset, "hero")}
                      >
                        Open in Studio
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="rounded-xl px-3 py-1.5 text-sm text-stage-muted transition hover:text-stage-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--stage-focus)]"
                        onClick={() => void removeAsset(asset.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
