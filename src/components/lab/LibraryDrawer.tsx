import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
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

export type LibraryDrawerProps = {
  open: boolean;
  onClose: () => void;
};

function emptyDraft(): StageBrandKit {
  return createEmptyBrandKit({ id: createBrandId(), name: "" });
}

export function LibraryDrawer({ open, onClose }: LibraryDrawerProps) {
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
    if (!open) return;
    void refresh().catch((e) => {
      console.error("[LibraryDrawer]", e);
      setStatus("Workspace unavailable");
    });
  }, [open]);

  useEffect(() => {
    return subscribeWorkspace(() => {
      if (!open) return;
      void refresh();
    });
  }, [open]);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const asset of assets) {
      try {
        if (asset.blob instanceof Blob && asset.blob.size > 0) {
          next[asset.id] = URL.createObjectURL(asset.blob);
        }
      } catch (err) {
        console.error("[LibraryDrawer] thumbnail", asset.id, err);
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
    // Snapshot before clearing — FileList is live and empties when value is reset.
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
          if (import.meta.env.DEV) {
            console.debug("[LibraryDrawer] uploaded", {
              id: asset.id,
              mime: asset.mime,
              blobSize: asset.blob.size,
              name: asset.name,
            });
          }
        } catch (err) {
          console.error(err);
          errors.push(err instanceof Error ? err.message : "Upload failed");
        }
      }
      await refresh();
      if (uploaded === 0) {
        setStatus(errors[0] ?? "Upload failed");
      } else {
        const previewLabel = previewOk === uploaded ? "preview ok" : `preview ${previewOk}/${uploaded} ok`;
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

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[45] bg-black/40 md:bg-transparent"
          aria-label="Close library"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-full flex-col border-r border-white/20 bg-panel/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out md:w-[min(100vw,380px)] ${
          open ? "pointer-events-auto translate-x-0" : "pointer-events-none -translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/20 px-4 py-3">
          <h2 className="text-sm uppercase tracking-[0.22em]">Library</h2>
          <button
            type="button"
            className="border border-white/35 px-2 py-1 text-[10px] uppercase tracking-widest"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex shrink-0 border-b border-white/20">
          {(["brands", "assets"] as const).map((id) => (
            <button
              key={id}
              type="button"
              className={`flex-1 py-2.5 text-[10px] uppercase tracking-[0.16em] ${
                tab === id ? "bg-white text-black" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              }`}
              onClick={() => setTab(id)}
            >
              {id}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === "brands" ? (
            <div className="flex flex-col gap-4">
              {!editing ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    className="border border-white px-3 py-2 text-xs uppercase tracking-wide transition hover:bg-white hover:text-black disabled:opacity-50"
                    onClick={startCreate}
                  >
                    New brand
                  </button>
                  {brands.length === 0 ? (
                    <p className="text-[11px] leading-relaxed text-zinc-500">
                      No brands yet. Create one — the floating brief uses the active brand.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {brands.map((brand) => {
                        const isActive = brand.id === activeId;
                        return (
                          <li key={brand.id} className="border border-white/20 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[12px] text-zinc-100">{brand.name}</p>
                                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                                  {brandKitHasRules(brand) ? "Has rules" : "Weak prompt"}
                                  {isActive ? " · Active" : ""}
                                </p>
                              </div>
                              {isActive ? (
                                <span className="shrink-0 border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-emerald-200">
                                  Active
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {!isActive ? (
                                <button
                                  type="button"
                                  className="border border-white/25 px-2 py-1 text-[9px] uppercase tracking-wide text-zinc-300 hover:border-white hover:text-white"
                                  onClick={() => activate(brand.id)}
                                >
                                  Set active
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="border border-white/25 px-2 py-1 text-[9px] uppercase tracking-wide text-zinc-300 hover:border-white hover:text-white"
                                onClick={() => startEdit(brand)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="border border-white/25 px-2 py-1 text-[9px] uppercase tracking-wide text-zinc-500 hover:border-white hover:text-white"
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
                <form className="flex flex-col gap-3" onSubmit={(e) => void saveBrand(e)}>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
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
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={busy}
                      className="border border-white bg-black/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white hover:bg-white hover:text-black disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="border border-white/25 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400 hover:text-white"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-[10px] leading-relaxed text-zinc-500">
                Upload images here, then set hero or overlay. Selecting an asset does not apply it until you choose an
                action.
              </p>
              <label className="border border-white px-3 py-2 text-center text-xs uppercase tracking-wide transition hover:bg-white hover:text-black">
                Upload images
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => void onUploadAssets(e)}
                />
              </label>
              {assets.length === 0 ? (
                <p className="text-[11px] text-zinc-500">No assets stored yet.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-2">
                  {assets.map((asset) => {
                    const thumb = thumbUrls[asset.id];
                    return (
                      <li key={asset.id} className="flex flex-col gap-2 border border-white/20 p-2">
                        <div className="relative aspect-square overflow-hidden bg-zinc-900">
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
                              <span className="text-[18px] leading-none text-zinc-600" aria-hidden>
                                ▢
                              </span>
                              <span className="text-[9px] uppercase tracking-wide text-zinc-500">
                                No preview
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="truncate text-[10px] text-zinc-300" title={asset.name}>
                          {asset.name}
                        </p>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            disabled={busy}
                            className="border border-white/25 px-2 py-1 text-[9px] uppercase tracking-wide text-zinc-300 hover:border-white hover:text-white disabled:opacity-40"
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
                            className="border border-white/25 px-2 py-1 text-[9px] uppercase tracking-wide text-zinc-300 hover:border-white hover:text-white disabled:opacity-40"
                            onClick={() => void useOverlay(asset)}
                          >
                            Use as overlay
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            className="text-[9px] uppercase tracking-wide text-zinc-500 hover:text-white"
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

        {status ? (
          <p className="shrink-0 border-t border-white/15 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-white/50">
            {status}
          </p>
        ) : null}
      </aside>
    </>
  );
}
