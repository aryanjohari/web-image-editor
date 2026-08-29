export type WorkerSegmentRequest = {
  type: "segment";
  id: number;
  bitmap: ImageBitmap;
  width: number;
  height: number;
};

export type WorkerSegmentOk = {
  type: "ok";
  id: number;
  weights: Float32Array;
  width: number;
  height: number;
};

export type WorkerSegmentErr = {
  type: "error";
  id: number;
  code: "LOAD" | "EMPTY" | "WORKER";
  message: string;
};
