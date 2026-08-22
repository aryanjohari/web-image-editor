export type AssetMeta = {
  assetId: string;
  mime: string;
  width?: number;
  height?: number;
  createdAt: string;
  name?: string;
};

export type AssetRecord = AssetMeta & {
  blob: Blob;
};
