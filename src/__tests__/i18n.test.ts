import { describe, expect, it } from "vitest";
import { th } from "@/lib/i18n/th";
import { en } from "@/lib/i18n/en";

describe("i18n dictionaries", () => {
  it("th and en have identical key sets", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(th).sort());
  });

  it("all values are non-empty strings", () => {
    for (const dict of [th, en]) {
      for (const value of Object.values(dict)) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("appName is Hundred Eyes in both locales", () => {
    expect(th.appName).toBe("Hundred Eyes");
    expect(en.appName).toBe("Hundred Eyes");
  });
});
