export class AssetStoreError extends Error {
  readonly code: string;
  readonly assetId?: string;

  constructor(code: string, message: string, assetId?: string) {
    super(message);
    this.name = "AssetStoreError";
    this.code = code;
    this.assetId = assetId;
  }
}
