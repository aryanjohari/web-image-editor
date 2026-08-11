import { describe, expect, it } from "vitest";
import { buildZipStore } from "./zipStore";

describe("buildZipStore", () => {
  it("embeds STORED entry payloads", () => {
    const payload = new TextEncoder().encode("hello-stage");
    const zip = buildZipStore([{ name: "note.txt", data: payload }]);
    const asText = new TextDecoder().decode(zip);
    expect(asText.includes("note.txt")).toBe(true);
    expect(asText.includes("hello-stage")).toBe(true);
    // End of central directory signature
    const endSig = [0x50, 0x4b, 0x05, 0x06];
    let found = false;
    for (let i = 0; i < zip.length - 3; i += 1) {
      if (
        zip[i] === endSig[0] &&
        zip[i + 1] === endSig[1] &&
        zip[i + 2] === endSig[2] &&
        zip[i + 3] === endSig[3]
      ) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
