import { describe, expect, it } from "vitest";
import { defaultDeltaForSlider, normalizeTalkResponse } from "./normalize";
import type { RecipeContext } from "./types";

const baseCtx = (): RecipeContext => ({
  packId: "warm-film",
  packVersion: "1.0.0",
  sliders: {
    exposure: 0,
    contrast: 0.15,
    warmth: 0.35,
    chroma: -0.1,
    fade: 0.22,
    grain: 0.35,
    vignette: 0.4,
  },
});

describe("normalizeTalkResponse", () => {
  it("clamps delta_slider to absolute set_slider (less grain)", () => {
    const r = normalizeTalkResponse(
      {
        patches: [{ op: "delta_slider", sliderId: "grain", delta: -0.1 }],
      },
      baseCtx(),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.patches).toHaveLength(1);
    expect(r.response.patches![0]).toMatchObject({
      op: "set_slider",
      sliderId: "grain",
    });
    expect(r.response.patches![0]!.op === "set_slider" && r.response.patches![0].value).toBeCloseTo(
      0.25,
    );
  });

  it("fills default Δ (~0.1 span) when delta omitted", () => {
    const r = normalizeTalkResponse(
      {
        patches: [{ op: "delta_slider", sliderId: "grain" }],
      },
      baseCtx(),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = defaultDeltaForSlider("grain");
    expect(r.response.patches?.[0]).toEqual({
      op: "set_slider",
      sliderId: "grain",
      value: 0.35 + d,
    });
  });

  it("clamps OOR set_slider to slider range (same as Lab pre-emit)", () => {
    const r = normalizeTalkResponse(
      {
        patches: [{ op: "set_slider", sliderId: "grain", value: 99 }],
      },
      baseCtx(),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.patches?.[0]).toEqual({
      op: "set_slider",
      sliderId: "grain",
      value: 1,
    });
  });

  it("rejects unknown pack", () => {
    const r = normalizeTalkResponse(
      { applyPack: { packId: "cyberpunk-neon" } },
      baseCtx(),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("UNKNOWN_PACK");
  });

  it("rejects unknown slider", () => {
    const r = normalizeTalkResponse(
      {
        patches: [{ op: "set_slider", sliderId: "clarity", value: 0.5 }],
      },
      baseCtx(),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("UNKNOWN_SLIDER");
  });

  it("passes refuse through and drops pack/patches", () => {
    const r = normalizeTalkResponse(
      {
        refuse: { code: "GENERATIVE", reason: "cannot put you on a beach" },
        applyPack: { packId: "warm-film" },
        patches: [{ op: "set_slider", sliderId: "grain", value: 0.2 }],
      },
      baseCtx(),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.refuse?.code).toBe("GENERATIVE");
    expect(r.response.applyPack).toBeUndefined();
    expect(r.response.patches).toBeUndefined();
  });

  it("rejects empty response", () => {
    const r = normalizeTalkResponse({}, baseCtx());
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("SCHEMA");
  });

  it("folds successive deltas in one turn", () => {
    const r = normalizeTalkResponse(
      {
        patches: [
          { op: "delta_slider", sliderId: "grain", delta: -0.1 },
          { op: "delta_slider", sliderId: "grain", delta: -0.05 },
        ],
      },
      baseCtx(),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.patches).toHaveLength(2);
    const p0 = r.response.patches![0]!;
    const p1 = r.response.patches![1]!;
    expect(p0).toMatchObject({ op: "set_slider", sliderId: "grain" });
    expect(p1).toMatchObject({ op: "set_slider", sliderId: "grain" });
    expect(p0.op === "set_slider" && p0.value).toBeCloseTo(0.25);
    expect(p1.op === "set_slider" && p1.value).toBeCloseTo(0.2);
  });

  it("default Δ for exposure is 0.1 of span (0.4)", () => {
    expect(defaultDeltaForSlider("exposure")).toBeCloseTo(0.4);
  });

  it("accepts new M06 packs and blur / grain_size sliders", () => {
    const r = normalizeTalkResponse(
      {
        applyPack: { packId: "muted-split" },
        patches: [
          { op: "set_slider", sliderId: "blur", value: 0.3 },
          { op: "set_slider", sliderId: "grain_size", value: 0.6 },
        ],
      },
      baseCtx(),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.applyPack?.packId).toBe("muted-split");
    expect(r.response.patches).toHaveLength(2);
  });

  it("normalizes setTextHint", () => {
    const r = normalizeTalkResponse(
      { setTextHint: { position: "center", typePreset: "condensed" } },
      baseCtx(),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.setTextHint).toEqual({
      position: "center",
      typePreset: "condensed",
    });
  });

  it("normalizes setTextContent", () => {
    const r = normalizeTalkResponse(
      { setTextContent: { content: "Hello" } },
      baseCtx(),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.setTextContent).toEqual({ content: "Hello" });
  });

  it("folds nudgeTransform dy into setTransform (move title up)", () => {
    const ctx = {
      ...baseCtx(),
      hasText: true,
      textTransform: { x: 0, y: -0.35, scaleX: 1, scaleY: 1 },
      selection: "text" as const,
    };
    const r = normalizeTalkResponse(
      { nudgeTransform: { target: "text", dy: 0.08 } },
      ctx,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.setTransform).toEqual({
      target: "text",
      y: expect.closeTo(-0.27, 5),
    });
  });

  it("multi-intent: pack + setTextContent + nudge", () => {
    const ctx = {
      ...baseCtx(),
      hasText: true,
      textTransform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    };
    const r = normalizeTalkResponse(
      {
        applyPack: { packId: "poster-punch" },
        setTextContent: { content: "SHOW" },
        nudgeTransform: { target: "text", dy: 0.1 },
      },
      ctx,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.response.applyPack?.packId).toBe("poster-punch");
    expect(r.response.setTextContent?.content).toBe("SHOW");
    expect(r.response.setTransform?.y).toBeCloseTo(0.1);
  });
});
