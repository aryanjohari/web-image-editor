import { STAGE_CONTRACT_VERSION } from "../../src/lib/stage/types";
import { methodNotAllowed, type VercelRequest, type VercelResponse } from "../_lib/http";

/**
 * GET /api/v1/health — public liveness (no API key).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return methodNotAllowed(res, "GET");
  }
  return res.status(200).json({ ok: true, contractVersion: STAGE_CONTRACT_VERSION });
}
