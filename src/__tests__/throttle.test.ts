import { describe, expect, it } from "vitest";
import { isThrottled, markReported } from "@/lib/throttle";

function createStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => (map.has(key) ? (map.get(key) as string) : null),
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

describe("isThrottled", () => {
  it("returns true inside the window", () => {
    const store = createStorage({ "he-last-report-at": "990000" });
    expect(isThrottled(1_000_000, 30_000, store)).toBe(true);
  });

  it("returns false once the window has passed", () => {
    const store = createStorage({ "he-last-report-at": "950000" });
    expect(isThrottled(1_000_000, 30_000, store)).toBe(false);
  });

  it("returns false when nothing is stored", () => {
    expect(isThrottled(1_000_000, 30_000, createStorage())).toBe(false);
  });

  it("returns false for NaN or garbage values", () => {
    expect(isThrottled(1_000_000, 30_000, createStorage({ "he-last-report-at": "NaN" }))).toBe(false);
    expect(isThrottled(1_000_000, 30_000, createStorage({ "he-last-report-at": "garbage" }))).toBe(false);
    expect(isThrottled(1_000_000, 30_000, createStorage({ "he-last-report-at": "0" }))).toBe(false);
  });

  it("defaults to REPORT_THROTTLE_MS (30s)", () => {
    const store = createStorage({ "he-last-report-at": "980000" });
    expect(isThrottled(1_000_000, undefined, store)).toBe(true);
    const store2 = createStorage({ "he-last-report-at": "960000" });
    expect(isThrottled(1_000_000, undefined, store2)).toBe(false);
  });
});

describe("markReported", () => {
  it("stores the timestamp", () => {
    const store = createStorage();
    markReported(1_234_567, store);
    expect(store.getItem("he-last-report-at")).toBe("1234567");
  });
});
