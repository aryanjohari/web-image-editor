import { requireStageApiKey } from "../../../src/lib/stage/server/stageApiAuth";
import { getBrand, patchBrand } from "../../../src/lib/stage/server/stageStore";
import {
  isRecord,
  methodNotAllowed,
  queryParam,
  type VercelRequest,
  type VercelResponse,
} from "../../_lib/http";

/**
 * GET   /api/v1/brands/:brandId
 * PATCH /api/v1/brands/:brandId
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireStageApiKey(req.headers ?? {});
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const brandId = queryParam(req.query, "brandId");
  if (!brandId) {
    return res.status(400).json({ error: "brandId is required" });
  }

  if (req.method === "GET") {
    const brand = getBrand(brandId);
    if (!brand) return res.status(404).json({ error: "Brand not found" });
    return res.status(200).json(brand);
  }

  if (req.method === "PATCH") {
    const body = isRecord(req.body) ? req.body : {};
    const patch: Parameters<typeof patchBrand>[1] = {};
    if (typeof body.name === "string") patch.name = body.name;
    if (typeof body.voiceNotes === "string") patch.voiceNotes = body.voiceNotes;
    if (Array.isArray(body.colors)) patch.colors = body.colors as never;
    if (Array.isArray(body.fonts)) patch.fonts = body.fonts as never;
    if (typeof body.logoAssetId === "string") patch.logoAssetId = body.logoAssetId;
    if (isRecord(body.limits)) patch.limits = body.limits as never;

    const updated = patchBrand(brandId, patch);
    if (!updated) return res.status(404).json({ error: "Brand not found" });
    return res.status(200).json(updated);
  }

  return methodNotAllowed(res, "GET, PATCH");
}
