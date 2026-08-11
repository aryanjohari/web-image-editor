import { requireStageApiKey } from "../../../../src/lib/stage/server/stageApiAuth";
import { appendJobArtifacts } from "../../../../src/lib/stage/server/stageStore";
import type { StageExportArtifact } from "../../../../src/lib/stage/types";
import {
  isRecord,
  methodNotAllowed,
  queryParam,
  type VercelRequest,
  type VercelResponse,
} from "../../../_lib/http";

/**
 * POST /api/v1/jobs/:jobId/artifacts — stub: append artifact metadata (no blob store).
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
  if (!Array.isArray(body.artifacts)) {
    return res.status(400).json({ error: "artifacts array is required" });
  }

  const artifacts: StageExportArtifact[] = [];
  for (const item of body.artifacts) {
    if (!isRecord(item)) continue;
    if (typeof item.packProfileId !== "string") continue;
    if (item.kind !== "png" && item.kind !== "webm" && item.kind !== "json") continue;
    artifacts.push({
      packProfileId: item.packProfileId,
      kind: item.kind,
      url: typeof item.url === "string" ? item.url : undefined,
      width: typeof item.width === "number" ? item.width : undefined,
      height: typeof item.height === "number" ? item.height : undefined,
    });
  }

  const updated = appendJobArtifacts(jobId, artifacts);
  if (!updated) return res.status(404).json({ error: "Job not found" });
  return res.status(200).json(updated);
}
