import { describe, expect, it } from "vitest";
import { resolveRoute, shareHashRedirectUrl } from "./routes";

describe("app routes", () => {
  it("sends / to cover", () => {
    expect(resolveRoute("/", "")).toBe("cover");
  });

  it("sends /lab to lab", () => {
    expect(resolveRoute("/lab", "")).toBe("lab");
    expect(resolveRoute("/lab/", "")).toBe("lab");
  });

  it("sends /hero to hero", () => {
    expect(resolveRoute("/hero", "")).toBe("hero");
    expect(shareHashRedirectUrl("/hero", "#r=abc")).toBeNull();
  });

  it("redirects cover share hashes to /lab", () => {
    expect(shareHashRedirectUrl("/", "#r=abc")).toBe("/lab#r=abc");
    expect(resolveRoute("/", "#r=abc")).toBe("lab");
  });
});
