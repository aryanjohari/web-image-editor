export type WorkspaceChange =
  | { type: "brands" }
  | { type: "assets" }
  | { type: "activeBrand" }
  | { type: "migrated" };

type Listener = (change: WorkspaceChange) => void;

const listeners = new Set<Listener>();

export function subscribeWorkspace(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyWorkspace(change: WorkspaceChange): void {
  for (const listener of listeners) {
    try {
      listener(change);
    } catch {
      /* ignore subscriber errors */
    }
  }
}
