import { patchStageJob } from "../../../../src/lib/stage/server/runStageJob";
import { requireStageApiKey } from "../../../../src/lib/stage/server/stageApiAuth";
import {
  isRecord,
  methodNotAllowed,
  queryParam,
  type VercelRequest,
  type VercelResponse,
} from "../../../_lib/http";

/**
 * POST /api/v1/jobs/:jobId/patch — conversational follow-up.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireStageApiKey(req.headers ?? {});
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method !== "POST") {
    return methodNotAllowed(res, "POST");
  }

  const jobId = queryParam(req.query, "jobId");
  if (!jobId) {
    return res.status(400).json({ error: "jobId is required" });
  }

  const body = isRecord(req.body) ? req.body : {};
  const message = typeof body.message === "string" ? body.message : "";

  const result = await patchStageJob(jobId, message);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(200).json(result.job);
}
