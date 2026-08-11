/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachWindowScrubEnd } from "./usePointerScrub";

describe("attachWindowScrubEnd", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls onEnd on pointerup and cleans up listeners", () => {
    const onEnd = vi.fn();
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const detach = attachWindowScrubEnd(onEnd);

    expect(addSpy).toHaveBeenCalledWith("pointerup", expect.any(Function), { capture: true });
    expect(addSpy).toHaveBeenCalledWith("pointercancel", expect.any(Function), { capture: true });
    expect(addSpy).toHaveBeenCalledWith("touchend", expect.any(Function), { capture: true });

    window.dispatchEvent(new Event("pointerup"));
    expect(onEnd).toHaveBeenCalledTimes(1);

    detach();
    expect(removeSpy).toHaveBeenCalledWith("pointerup", expect.any(Function), { capture: true });
    expect(removeSpy).toHaveBeenCalledWith("pointercancel", expect.any(Function), { capture: true });
    expect(removeSpy).toHaveBeenCalledWith("touchend", expect.any(Function), { capture: true });
  });

  it("calls onEnd on touchend", () => {
    const onEnd = vi.fn();
    const detach = attachWindowScrubEnd(onEnd);
    window.dispatchEvent(new Event("touchend"));
    expect(onEnd).toHaveBeenCalledTimes(1);
    detach();
  });
});
