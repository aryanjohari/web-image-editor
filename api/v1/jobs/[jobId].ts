import { requireStageApiKey } from "../../../src/lib/stage/server/stageApiAuth";
import { getJob } from "../../../src/lib/stage/server/stageStore";
import {
  methodNotAllowed,
  queryParam,
  type VercelRequest,
  type VercelResponse,
} from "../../_lib/http";

/**
 * GET /api/v1/jobs/:jobId
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireStageApiKey(req.headers ?? {});
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method !== "GET") {
    return methodNotAllowed(res, "GET");
  }

  const jobId = queryParam(req.query, "jobId");
  if (!jobId) {
    return res.status(400).json({ error: "jobId is required" });
  }

  const job = getJob(jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  return res.status(200).json(job);
}
