/** Mask asset metadata (M05 §3). */
export type MaskKind = "person-split";

export type MaskAssetMeta = {
  kind: MaskKind;
  width: number;
  height: number;
};

export type SegmentResult = {
  blob: Blob;
  width: number;
  height: number;
  kind: MaskKind;
};

export type SegmentError = {
  code: "WORKER" | "EMPTY" | "LOAD" | "ENCODE";
  message: string;
};
