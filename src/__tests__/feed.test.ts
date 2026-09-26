import { describe, expect, it } from "vitest";
import { activeFloodReport, mergeReports } from "@/lib/feed";
import type { FeedItem } from "@/lib/supabase/types";

function item(overrides: Partial<FeedItem>): FeedItem {
  return {
    id: "id-1",
    user_id: "user-1",
    is_flooded: false,
    message: "message",
    photos: [],
    created_at: "2026-01-01T00:00:00Z",
    flood_notified_at: null,
    reporter_name: "Reporter",
    ...overrides,
  };
}

describe("mergeReports", () => {
  it("dedupes by id keeping existing data", () => {
    const a = [item({ id: "r1", message: "latest" })];
    const b = [item({ id: "r1", message: "stale" }), item({ id: "r2" })];
    const merged = mergeReports(a, b);
    expect(merged).toHaveLength(2);
    expect(merged.find((x) => x.id === "r1")?.message).toBe("latest");
  });

  it("sorts by created_at descending", () => {
    const older = item({ id: "old", created_at: "2026-01-01T00:00:00Z" });
    const newer = item({ id: "new", created_at: "2026-01-02T00:00:00Z" });
    const merged = mergeReports([older], [newer]);
    expect(merged.map((x) => x.id)).toEqual(["new", "old"]);
  });

  it("handles two tabs receiving the same insert (dedupe on merge)", () => {
    const first = mergeReports([], [item({ id: "r1" })]);
    const second = mergeReports(first, [item({ id: "r1" })]);
    expect(second).toHaveLength(1);
  });
});

describe("activeFloodReport", () => {
  const now = new Date("2026-01-01T12:00:00Z");

  it("finds a flooded report within 3 hours", () => {
    const flooded = item({ id: "f1", is_flooded: true, created_at: "2026-01-01T10:30:00Z" });
    expect(activeFloodReport([flooded], now)?.id).toBe("f1");
  });

  it("returns null for a flooded report older than 3 hours", () => {
    const flooded = item({ id: "f2", is_flooded: true, created_at: "2026-01-01T08:59:00Z" });
    expect(activeFloodReport([flooded], now)).toBeNull();
  });

  it("returns null when the newest report is not flooded", () => {
    const normal = item({ id: "n1", is_flooded: false, created_at: "2026-01-01T11:00:00Z" });
    expect(activeFloodReport([normal], now)).toBeNull();
  });

  it("returns the most recent flooded report within the window", () => {
    const older = item({ id: "f-old", is_flooded: true, created_at: "2026-01-01T09:30:00Z" });
    const newer = item({ id: "f-new", is_flooded: true, created_at: "2026-01-01T11:30:00Z" });
    expect(activeFloodReport([older, newer], now)?.id).toBe("f-new");
  });
});
