import { describe, expect, it } from "vitest";
import { relativeTime } from "@/lib/reltime";

const now = new Date("2026-01-01T12:00:00Z");
const rtf = (locale: "th" | "en") => new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

describe("relativeTime", () => {
  it("formats seconds in en", () => {
    expect(relativeTime(new Date(now.getTime() - 30_000), "en", now)).toBe(rtf("en").format(-30, "second"));
  });

  it("formats minutes in en", () => {
    expect(relativeTime(new Date(now.getTime() - 5 * 60_000), "en", now)).toBe(rtf("en").format(-5, "minute"));
  });

  it("formats hours in en", () => {
    expect(relativeTime(new Date(now.getTime() - 3 * 3_600_000), "en", now)).toBe(rtf("en").format(-3, "hour"));
  });

  it("formats days in en", () => {
    expect(relativeTime(new Date(now.getTime() - 2 * 86_400_000), "en", now)).toBe(rtf("en").format(-2, "day"));
  });

  it("formats seconds in th", () => {
    expect(relativeTime(new Date(now.getTime() - 30_000), "th", now)).toBe(rtf("th").format(-30, "second"));
  });

  it("formats days in th", () => {
    expect(relativeTime(new Date(now.getTime() - 2 * 86_400_000), "th", now)).toBe(rtf("th").format(-2, "day"));
  });

  it("clamps future timestamps to now (never negative)", () => {
    const result = relativeTime(new Date(now.getTime() + 60_000), "en", now);
    expect(result).toBe(rtf("en").format(-0, "second"));
    expect(result).not.toMatch(/in /i);
  });

  it("returns empty string for invalid input", () => {
    expect(relativeTime("not-a-date", "en", now)).toBe("");
  });
});
