import { createAndRunStageJob } from "../../src/lib/stage/server/runStageJob";
import { requireStageApiKey } from "../../src/lib/stage/server/stageApiAuth";
import { methodNotAllowed, type VercelRequest, type VercelResponse } from "../_lib/http";

/**
 * POST /api/v1/jobs — sync brief → recipe; returns 200 + Job (succeeded or failed).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = requireStageApiKey(req.headers ?? {});
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.error });
  }

  if (req.method !== "POST") {
    return methodNotAllowed(res, "POST");
  }

  const result = await createAndRunStageJob(req.body);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }
  return res.status(200).json(result.job);
}
