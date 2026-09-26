import { describe, expect, it } from "vitest";
import { broadcastFloodNotification, type NotifyDeps } from "@/lib/notify";
import type { PushSubRow } from "@/lib/notify";

interface DbResult<T> {
  data: T;
  error: unknown;
}

interface MockConfig {
  claim: DbResult<{ id: string; user_id: string; message: string } | null>;
  feed: DbResult<{ reporter_name: string } | null>;
  subs: DbResult<PushSubRow[]>;
}

// chainable mock จำลอง supabase query builder: .update/.eq/.is/.select/.maybeSingle + delete().eq()
function createMockDb(config: MockConfig) {
  const deletedEndpoints: string[] = [];

  const reportsQuery = {
    update: () => reportsQuery,
    eq: () => reportsQuery,
    is: () => reportsQuery,
    select: () => reportsQuery,
    maybeSingle: () => Promise.resolve(config.claim),
  };
  const feedQuery = {
    select: () => feedQuery,
    eq: () => feedQuery,
    maybeSingle: () => Promise.resolve(config.feed),
  };
  const subsDeleteQuery = {
    eq: (column: string, value: string) => {
      if (column !== "endpoint") throw new Error(`unexpected delete filter ${column}`);
      deletedEndpoints.push(value);
      return Promise.resolve({ data: null, error: null });
    },
  };
  const subsQuery = {
    select: () => Promise.resolve(config.subs),
    delete: () => subsDeleteQuery,
  };

  const db = {
    from: (table: string) => {
      if (table === "reports") return reportsQuery;
      if (table === "v_report_feed") return feedQuery;
      if (table === "push_subscriptions") return subsQuery;
      throw new Error(`unexpected table ${table}`);
    },
  };

  return { db: db as unknown as NotifyDeps["db"], deletedEndpoints };
}

const env = { publicKey: "pub-key", privateKey: "priv-key", subject: "mailto:admin@example.com" };

function sub(overrides: Partial<PushSubRow>): PushSubRow {
  return {
    endpoint: "https://push.example/endpoint",
    p256dh: "p256dh-key",
    auth: "auth-key",
    locale: "th",
    user_id: "user-x",
    ...overrides,
  };
}

const CLAIM_OK: DbResult<{ id: string; user_id: string; message: string }> = {
  data: { id: "11111111-1111-4111-8111-111111111111", user_id: "reporter-1", message: "น้ำท่วมเข้าบ้านแล้ว" },
  error: null,
};

describe("broadcastFloodNotification", () => {
  it("returns sent:false without sending when the claim is lost (already notified)", async () => {
    const { db } = createMockDb({
      claim: { data: null, error: null },
      feed: { data: null, error: null },
      subs: { data: [], error: null },
    });
    const sent: string[] = [];
    const result = await broadcastFloodNotification("11111111-1111-4111-8111-111111111111", {
      db,
      env,
      sendNotification: async (subscription) => {
        sent.push(subscription.endpoint);
      },
    });
    expect(result).toEqual({ sent: false });
    expect(sent).toHaveLength(0);
  });

  it("throws when the claim query errors so the route reports broadcast_failed", async () => {
    const { db } = createMockDb({
      claim: { data: null, error: new Error("fetch failed") },
      feed: { data: null, error: null },
      subs: { data: [], error: null },
    });
    await expect(
      broadcastFloodNotification("11111111-1111-4111-8111-111111111111", { db, env, sendNotification: async () => {} }),
    ).rejects.toThrow("fetch failed");
  });

  it("sends to all subscribers except the reporter, localized per sub locale", async () => {
    const subs = [
      sub({ endpoint: "https://push/reporter", locale: "th", user_id: "reporter-1" }),
      sub({ endpoint: "https://push/thai", locale: "th", user_id: "user-2" }),
      sub({ endpoint: "https://push/english", locale: "en", user_id: "user-3" }),
    ];
    const { db } = createMockDb({
      claim: CLAIM_OK,
      feed: { data: { reporter_name: "Napa" }, error: null },
      subs: { data: subs, error: null },
    });
    const calls: Array<{ endpoint: string; payload: string; ttl: number | undefined }> = [];
    const result = await broadcastFloodNotification("11111111-1111-4111-8111-111111111111", {
      db,
      env,
      sendNotification: async (subscription, payload, options) => {
        calls.push({ endpoint: subscription.endpoint, payload, ttl: options.TTL });
      },
    });
    expect(result).toEqual({ sent: true, delivered: 2, removed: 0, skipped: 1 });
    expect(calls).toHaveLength(2);
    const thai = JSON.parse(calls.find((call) => call.endpoint === "https://push/thai")?.payload ?? "{}");
    expect(thai.title).toBe("⚠️ แจ้งเตือนน้ำท่วม");
    expect(thai.body).toContain("Napa");
    expect(thai.body).toContain("น้ำท่วมเข้าบ้านแล้ว");
    const english = JSON.parse(calls.find((call) => call.endpoint === "https://push/english")?.payload ?? "{}");
    expect(english.title).toBe("⚠️ Flood Alert");
    expect(english.body).toContain("Napa reported flooding in the village");
    expect(calls.every((call) => call.ttl === 86400)).toBe(true);
  });

  it("deletes dead endpoints (410) after a failed send", async () => {
    const subs = [sub({ endpoint: "https://push/dead", user_id: "user-9" })];
    const { db, deletedEndpoints } = createMockDb({
      claim: CLAIM_OK,
      feed: { data: { reporter_name: "Napa" }, error: null },
      subs: { data: subs, error: null },
    });
    const result = await broadcastFloodNotification("11111111-1111-4111-8111-111111111111", {
      db,
      env,
      sendNotification: async () => {
        throw Object.assign(new Error("gone"), { statusCode: 410 });
      },
    });
    expect(result).toEqual({ sent: true, delivered: 0, removed: 1, skipped: 0 });
    expect(deletedEndpoints).toEqual(["https://push/dead"]);
  });

  it("does not resend when broadcast is replayed for the same report (claim now null)", async () => {
    const firstDb = createMockDb({
      claim: CLAIM_OK,
      feed: { data: { reporter_name: "Napa" }, error: null },
      subs: { data: [sub({ endpoint: "https://push/once", user_id: "user-2" })], error: null },
    });
    const replayDb = createMockDb({
      claim: { data: null, error: null },
      feed: { data: null, error: null },
      subs: { data: [sub({ endpoint: "https://push/once", user_id: "user-2" })], error: null },
    });
    const calls: string[] = [];
    const send = async (subscription: { endpoint: string }) => {
      calls.push(subscription.endpoint);
    };
    const first = await broadcastFloodNotification("11111111-1111-4111-8111-111111111111", {
      db: firstDb.db,
      env,
      sendNotification: send,
    });
    const replay = await broadcastFloodNotification("11111111-1111-4111-8111-111111111111", {
      db: replayDb.db,
      env,
      sendNotification: send,
    });
    expect(first).toEqual({ sent: true, delivered: 1, removed: 0, skipped: 0 });
    expect(replay).toEqual({ sent: false });
    expect(calls).toEqual(["https://push/once"]);
  });

  it("ignores send failures that are not 404/410", async () => {
    const subs = [sub({ endpoint: "https://push/flaky", user_id: "user-4" })];
    const { db, deletedEndpoints } = createMockDb({
      claim: CLAIM_OK,
      feed: { data: { reporter_name: "Napa" }, error: null },
      subs: { data: subs, error: null },
    });
    const result = await broadcastFloodNotification("11111111-1111-4111-8111-111111111111", {
      db,
      env,
      sendNotification: async () => {
        throw new Error("network hiccup");
      },
    });
    expect(result).toEqual({ sent: true, delivered: 0, removed: 0, skipped: 0 });
    expect(deletedEndpoints).toHaveLength(0);
  });
});
