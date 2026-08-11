/**
 * @deprecated Library lives on `/workspace` via `WorkspaceLibrary`.
 * Kept so older imports fail closed with a clear comment; not mounted by StudioShell.
 */
export { WorkspaceLibrary as LibraryDrawer } from "@/components/workspace/WorkspaceLibrary";

export type LibraryDrawerProps = {
  open?: boolean;
  onClose?: () => void;
};
