import { describe, expect, it } from "vitest";
import { sirenSchedule } from "@/lib/alarm";

describe("sirenSchedule", () => {
  it("produces 8 segments by default", () => {
    expect(sirenSchedule()).toHaveLength(8);
  });

  it("alternates 800/600 starting at 800", () => {
    const segments = sirenSchedule();
    segments.forEach((segment, index) => {
      expect(segment.freq).toBe(index % 2 === 0 ? 800 : 600);
    });
  });

  it("spaces segments 0.25s apart starting at 0", () => {
    const segments = sirenSchedule();
    segments.forEach((segment, index) => {
      expect(segment.at).toBeCloseTo(index * 0.25);
    });
    expect(segments[0].at).toBe(0);
  });

  it("supports custom parameters", () => {
    const segments = sirenSchedule(3, 0.5, 900, 700);
    expect(segments).toEqual([
      { at: 0, freq: 900 },
      { at: 0.5, freq: 700 },
      { at: 1, freq: 900 },
    ]);
  });
});
