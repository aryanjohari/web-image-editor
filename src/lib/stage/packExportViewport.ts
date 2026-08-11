/**
 * Coordinate temporary R3F viewport overrides during campaign pack capture.
 * SynthCanvasView's bridge re-asserts size so measure/reconfigure cannot fight export.
 */

export type PackExportViewportSize = {
  width: number;
  height: number;
};

type Listener = () => void;

let target: PackExportViewportSize | null = null;
let readyWaiters: Array<() => void> = [];
const listeners = new Set<Listener>();

export function getPackExportViewportTarget(): PackExportViewportSize | null {
  return target;
}

export function subscribePackExportViewport(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  for (const listener of listeners) listener();
}

function flushReadyWaiters() {
  const waiters = readyWaiters;
  readyWaiters = [];
  for (const resolve of waiters) resolve();
}

/** Called by the in-canvas bridge once drawing buffer matches the target. */
export function notifyPackExportViewportReady(): void {
  if (!target) return;
  flushReadyWaiters();
}

export async function setPackExportViewport(
  next: PackExportViewportSize | null,
  options?: { readyTimeoutMs?: number },
): Promise<void> {
  target = next;
  notifyListeners();

  if (!next) {
    flushReadyWaiters();
    return;
  }

  const timeoutMs = options?.readyTimeoutMs ?? 2500;
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Timed out waiting for pack export viewport ${next.width}×${next.height}`));
    }, timeoutMs);

    readyWaiters.push(() => {
      window.clearTimeout(timer);
      resolve();
    });
  });
}
