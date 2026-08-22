import { createTexture } from "./gl";

export type UploadedTexture = {
  texture: WebGLTexture;
  width: number;
  height: number;
};

export async function decodeImageBitmap(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob);
}

export function uploadImageBitmap(
  gl: WebGL2RenderingContext,
  bitmap: ImageBitmap,
  existing?: WebGLTexture | null,
): UploadedTexture {
  const texture = existing ?? createTexture(gl);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // ImageBitmap / canvas are top-left origin. Do not UNPACK_FLIP_Y — flip in the
  // textured shader instead so FBO blits (same vertex UVs) stay upright.
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
  return { texture, width: bitmap.width, height: bitmap.height };
}

export function uploadCanvas(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement | OffscreenCanvas,
  existing?: WebGLTexture | null,
): UploadedTexture {
  const texture = existing ?? createTexture(gl);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
  return {
    texture,
    width: canvas.width,
    height: canvas.height,
  };
}
