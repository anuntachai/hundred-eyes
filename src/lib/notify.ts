import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPushPayload } from "./push-texts";
import { buildLineMessage, isLineConfigured, sendLineAlert, type LineConfig } from "./line";

export interface PushSubRow {
  endpoint: string;
  p256dh: string;
  auth: string;
  locale: string;
  user_id: string;
}

export interface SendNotificationOptions {
  vapidDetails: { publicKey: string; privateKey: string; subject: string };
  TTL: number;
}

export type SendNotification = (
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
  options: SendNotificationOptions,
) => Promise<unknown>;

export interface NotifyDeps {
  db: Pick<SupabaseClient, "from">;
  sendNotification?: SendNotification;
  env: { publicKey: string; privateKey: string; subject: string };
  now?: Date;
  // LINE กลุ่มหมู่บ้าน (optional) — ส่งหลัง web-push แบบ best-effort
  line?: LineConfig;
  sendLine?: (config: LineConfig, message: Record<string, unknown>) => Promise<{ ok: boolean }>;
  siteUrl?: string;
}

export type BroadcastResult =
  | { sent: false }
  | { sent: true; delivered: number; removed: number; skipped: number; line: "sent" | "skipped" | "failed" };

interface ClaimedReport {
  id: string;
  user_id: string;
  message: string;
  created_at?: string;
}

function isDeadEndpoint(reason: unknown): boolean {
  const status = (reason as { statusCode?: number } | null | undefined)?.statusCode;
  return status === 404 || status === 410;
}

export async function broadcastFloodNotification(reportId: string, deps: NotifyDeps): Promise<BroadcastResult> {
  const { db, env } = deps;
  const send: SendNotification =
    deps.sendNotification ?? ((subscription, payload, options) => webpush.sendNotification(subscription, payload, options));

  // 1. atomic claim: update ก่อนส่ง → request ที่ชนะคือตัวเดียวที่ส่ง (idempotent)
  const claim = await db
    .from("reports")
    .update({ flood_notified_at: (deps.now ?? new Date()).toISOString() })
    .eq("id", reportId)
    .eq("is_flooded", true)
    .is("flood_notified_at", null)
    .select("id, user_id, message, created_at")
    .maybeSingle();
  const report = claim.data as ClaimedReport | null;
  if (claim.error) throw claim.error;
  if (!report) return { sent: false };

  // 2. ชื่อผู้รายงานจาก feed view (ไม่เปิดบ้านเลขที่)
  const feed = await db.from("v_report_feed").select("reporter_name").eq("id", reportId).maybeSingle();
  if (feed.error) throw feed.error;
  const reporterName = (feed.data as { reporter_name?: string } | null)?.reporter_name ?? "";

  // 3. subscribers ทั้งหมด
  const subsResult = await db.from("push_subscriptions").select("endpoint, p256dh, auth, locale, user_id");
  if (subsResult.error) throw subsResult.error;
  const subs = (subsResult.data ?? []) as PushSubRow[];

  // 4. คนรายงานไม่เตือนตัวเอง
  const targets = subs.filter((s) => s.user_id !== report.user_id);
  const skipped = subs.length - targets.length;

  // 5. ส่งพร้อมกันทั้งหมด — payload แปลตาม locale ของผู้รับแต่ละคน
  const deadEndpoints: string[] = [];
  const results = await Promise.allSettled(
    targets.map((sub) =>
      send(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(
          buildPushPayload(sub.locale === "en" ? "en" : "th", reporterName, report.message),
        ),
        { vapidDetails: { publicKey: env.publicKey, privateKey: env.privateKey, subject: env.subject }, TTL: 86400 },
      ),
    ),
  );
  let delivered = 0;
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      delivered += 1;
    } else if (isDeadEndpoint(result.reason)) {
      deadEndpoints.push(targets[index].endpoint);
    }
  });

  // 6. ลบ endpoint ตาย (404/410)
  await Promise.allSettled(
    deadEndpoints.map((endpoint) => db.from("push_subscriptions").delete().eq("endpoint", endpoint)),
  );

  // 7. ส่งเข้า LINE กลุ่มหมู่บ้าน (best-effort — ล้มไม่กระทบผลลัพธ์ push)
  let lineStatus: "sent" | "skipped" | "failed" = "skipped";
  if (isLineConfigured(deps.line)) {
    try {
      const sendLine = deps.sendLine ?? sendLineAlert;
      const timeText = report.created_at
        ? new Date(report.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })
        : undefined;
      const lineMessage = buildLineMessage(
        reporterName,
        report.message,
        `${deps.siteUrl ?? "https://hundred-eyes.vercel.app"}/#report-${report.id}`,
        timeText,
      );
      const lineResult = await sendLine(deps.line as LineConfig, lineMessage);
      lineStatus = lineResult.ok ? "sent" : "failed";
    } catch {
      lineStatus = "failed";
    }
  }

  return { sent: true, delivered, removed: deadEndpoints.length, skipped, line: lineStatus };
}
