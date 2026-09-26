import { describe, expect, it } from "vitest";
import { scaledSize } from "@/lib/compress";

describe("scaledSize", () => {
  it("scales a landscape image down to maxDim", () => {
    expect(scaledSize(3200, 1600, 1600)).toEqual({ width: 1600, height: 800 });
  });

  it("scales a portrait image down to maxDim", () => {
    expect(scaledSize(1600, 3200, 1600)).toEqual({ width: 800, height: 1600 });
  });

  it("keeps images smaller than maxDim unchanged", () => {
    expect(scaledSize(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });

  it("rounds fractional results", () => {
    const result = scaledSize(1000, 667, 500);
    expect(result.width).toBe(500);
    expect(result.height).toBe(Math.round((667 * 500) / 1000));
  });

  it("returns zeros for invalid input", () => {
    expect(scaledSize(0, 100, 1600)).toEqual({ width: 0, height: 0 });
    expect(scaledSize(100, -5, 1600)).toEqual({ width: 0, height: 0 });
    expect(scaledSize(Number.NaN, 100, 1600)).toEqual({ width: 0, height: 0 });
  });
});
