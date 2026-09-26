import { describe, expect, it } from "vitest";
import { buildPushPayload, truncate } from "@/lib/push-texts";

describe("truncate", () => {
  it("keeps text at or under the limit", () => {
    expect(truncate("x".repeat(80), 80)).toBe("x".repeat(80));
    expect(truncate("short", 80)).toBe("short");
  });
  it("cuts to 79 chars plus ellipsis over the limit", () => {
    expect(truncate("x".repeat(81), 80)).toBe(`${"x".repeat(79)}…`);
    expect(truncate("x".repeat(200), 80).length).toBe(80);
  });
});

describe("buildPushPayload", () => {
  it("builds a Thai payload with reporter name", () => {
    const payload = buildPushPayload("th", "Napa", "น้ำท่วมถนน");
    expect(payload.title).toBe("⚠️ แจ้งเตือนน้ำท่วม");
    expect(payload.body).toContain("Napa");
    expect(payload.body).toContain("น้ำท่วมถนน");
    expect(payload.tag).toBe("flood-alert");
    expect(payload.data.url).toBe("/");
  });

  it("builds an English payload", () => {
    const payload = buildPushPayload("en", "Napa", "water on the road");
    expect(payload.title).toBe("⚠️ Flood Alert");
    expect(payload.body).toContain("Napa reported flooding in the village: water on the road");
    expect(payload.tag).toBe("flood-alert");
  });

  it("falls back to a default reporter name per locale", () => {
    const th = buildPushPayload("th", "", "msg");
    expect(th.body).toContain("เพื่อนบ้าน");
    const en = buildPushPayload("en", "   ", "msg");
    expect(en.body).toContain("A neighbour");
  });

  it("truncates long messages to 80 chars in the body", () => {
    const long = "ก".repeat(120);
    const payload = buildPushPayload("th", "Napa", long);
    expect(payload.body).toContain(`${"ก".repeat(79)}…`);
    expect(payload.body).not.toContain("ก".repeat(80));
  });
});
