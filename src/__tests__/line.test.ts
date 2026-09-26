import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import {
  buildLineMessage,
  extractGroupId,
  isLineConfigured,
  sendLineAlert,
  verifyLineSignature,
} from "@/lib/line";

describe("buildLineMessage", () => {
  it("builds a flex message with alert header, body and an app link button", () => {
    const msg = buildLineMessage("Tum", "น้ำท่วมถนนสูง 30 ซม.", "https://hundred-eyes.vercel.app", "26 ก.ย. 2569 23:45");
    expect(msg.type).toBe("flex");
    expect((msg.altText as string)).toContain("Tum รายงาน: น้ำท่วมถนนสูง 30 ซม.");
    const contents = msg.contents as Record<string, never>;
    const headerText = JSON.stringify(contents.header);
    expect(headerText).toContain("แจ้งเตือนน้ำท่วมหมู่บ้าน");
    expect(JSON.stringify(contents.body)).toContain("Tum รายงาน:");
    expect(JSON.stringify(contents.body)).toContain("26 ก.ย. 2569 23:45");
    const footer = JSON.stringify(contents.footer);
    expect(footer).toContain("เปิดดูรายงาน");
    expect(footer).toContain("https://hundred-eyes.vercel.app");
  });

  it("falls back to a default reporter name and omits time when not given", () => {
    const msg = buildLineMessage("  ", "msg", "https://x");
    expect((msg.altText as string)).toContain("เพื่อนบ้าน");
    expect(JSON.stringify((msg.contents as Record<string, never>).body)).not.toContain("🕒");
  });

  it("truncates long messages to 120 chars with ellipsis", () => {
    const msg = buildLineMessage("Tum", "ก".repeat(150), "https://x");
    const body = JSON.stringify((msg.contents as Record<string, never>).body);
    expect(body).toContain("…");
    expect(body.length).toBeLessThan(400);
  });
});

describe("isLineConfigured", () => {
  it("requires token plus groupId or broadcast", () => {
    expect(isLineConfigured(undefined)).toBe(false);
    expect(isLineConfigured({ token: "t" })).toBe(false);
    expect(isLineConfigured({ token: "t", groupId: "C123" })).toBe(true);
    expect(isLineConfigured({ token: "t", broadcast: true })).toBe(true);
  });
});

describe("sendLineAlert", () => {
  type LineRequestBody = { to?: string; messages: Array<{ type: string; text: string }> };
  async function recordCalls() {
    const calls: Array<{ url: string; body: LineRequestBody; auth?: string }> = [];
    const fetchLike = async (url: string, init: { body: string; headers: Record<string, string> }) => {
      calls.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization });
      return { ok: true, status: 200 };
    };
    return { calls, fetchLike };
  }

  it("broadcasts personally and pushes to every group (deduped)", async () => {
    const { calls, fetchLike } = await recordCalls();
    const flex = { type: "flex", altText: "alert", contents: { type: "bubble" } };
    const result = await sendLineAlert(
      { token: "tok", broadcast: true, groups: ["C1", "C2"], groupId: "C1" },
      flex,
      fetchLike,
    );
    expect(result).toEqual({ ok: true, broadcastOk: true, groupsOk: 2, groupsTotal: 2 });
    expect(calls.map((c) => c.url)).toEqual([
      "https://api.line.me/v2/bot/message/broadcast",
      "https://api.line.me/v2/bot/message/push",
      "https://api.line.me/v2/bot/message/push",
    ]);
    expect(calls[0].body.to).toBeUndefined();
    expect(calls[0].body.messages[0]).toEqual(flex as never);
    expect(calls[1].body.to).toBe("C1");
    expect(calls[2].body.to).toBe("C2");
    expect(calls.every((c) => c.auth === "Bearer tok")).toBe(true);
  });

  it("group-only mode skips broadcast", async () => {
    const { calls, fetchLike } = await recordCalls();
    const result = await sendLineAlert({ token: "t", groups: ["C9"] }, { type: "flex", altText: "x", contents: {} }, fetchLike);
    expect(result).toEqual({ ok: true, broadcastOk: false, groupsOk: 1, groupsTotal: 1 });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/push");
  });

  it("reports ok:false when everything fails, without throwing", async () => {
    const result = await sendLineAlert({ token: "t", broadcast: true, groups: ["C1"] }, { type: "flex" }, async () => {
      throw new Error("network down");
    });
    expect(result).toEqual({ ok: false, broadcastOk: false, groupsOk: 0, groupsTotal: 1 });
  });
});

describe("verifyLineSignature", () => {
  it("accepts a correctly signed body and rejects a tampered one", () => {
    const secret = "channel-secret";
    const body = JSON.stringify({ events: [] });
    const good = createHmac("sha256", secret).update(body, "utf8").digest("base64");
    expect(verifyLineSignature(body, good, secret)).toBe(true);
    expect(verifyLineSignature(body + "x", good, secret)).toBe(false);
    expect(verifyLineSignature(body, "badsignature==", secret)).toBe(false);
  });
});

describe("extractGroupId", () => {
  it("finds the first groupId in webhook events", () => {
    const body = JSON.stringify({
      events: [
        { type: "message", source: { type: "group", groupId: "C999", userId: "U1" } },
      ],
    });
    expect(extractGroupId(body)).toBe("C999");
  });

  it("returns null for user-only events or invalid JSON", () => {
    expect(extractGroupId(JSON.stringify({ events: [{ source: { userId: "U1" } }] }))).toBeNull();
    expect(extractGroupId("not json")).toBeNull();
    expect(extractGroupId("{}")).toBeNull();
  });
});
