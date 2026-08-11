import { describe, expect, it } from "vitest";
import {
  extractStageApiKey,
  getStageApiKeysFromEnv,
  requireStageApiKey,
} from "./stageApiAuth";

describe("stageApiAuth", () => {
  it("parses STAGE_API_KEY and STAGE_API_KEYS", () => {
    expect(
      getStageApiKeysFromEnv({
        STAGE_API_KEY: " solo ",
        STAGE_API_KEYS: "a, b , ,c",
      }).sort(),
    ).toEqual(["a", "b", "c", "solo"].sort());
  });

  it("extracts Bearer and X-Stage-Key", () => {
    expect(extractStageApiKey({ authorization: "Bearer sk_abc" })).toBe("sk_abc");
    expect(extractStageApiKey({ "X-Stage-Key": "sk_xyz" })).toBe("sk_xyz");
    expect(extractStageApiKey({ "x-stage-key": "sk_lower" })).toBe("sk_lower");
  });

  it("returns 503 when no keys configured", () => {
    const r = requireStageApiKey({ authorization: "Bearer x" }, {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(503);
  });

  it("returns 401 for bad key", () => {
    const r = requireStageApiKey(
      { authorization: "Bearer wrong" },
      { STAGE_API_KEY: "right" },
    );
    expect(r).toEqual({ ok: false, status: 401, error: "Unauthorized" });
  });

  it("accepts valid key", () => {
    expect(
      requireStageApiKey(
        { authorization: "Bearer right" },
        { STAGE_API_KEY: "right" },
      ),
    ).toEqual({ ok: true });
  });
});
