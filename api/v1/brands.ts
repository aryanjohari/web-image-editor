import { requireStageApiKey } from "../../src/lib/stage/server/stageApiAuth";
import { createBrand, listBrands } from "../../src/lib/stage/server/stageStore";
import {
  isRecord,
  methodNotAllowed,
  type VercelRequest,
  type VercelResponse,
} from "../_lib/http";

/**
 * POST /api/v1/brands — create
 * GET  /api/v1/brands — list
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireStageApiKey(req.headers ?? {});
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method === "GET") {
    return res.status(200).json({ items: listBrands() });
  }

  if (req.method === "POST") {
    const body = isRecord(req.body) ? req.body : {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }
    const brand = createBrand({
      name,
      voiceNotes: typeof body.voiceNotes === "string" ? body.voiceNotes : undefined,
      colors: Array.isArray(body.colors) ? (body.colors as never) : [],
      fonts: Array.isArray(body.fonts) ? (body.fonts as never) : [],
      logoAssetId: typeof body.logoAssetId === "string" ? body.logoAssetId : undefined,
      limits: isRecord(body.limits) ? (body.limits as never) : undefined,
    });
    return res.status(201).json(brand);
  }

  return methodNotAllowed(res, "GET, POST");
}
