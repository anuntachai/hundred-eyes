// ส่งข้อความเตือนภัยเข้า LINE กลุ่มหมู่บ้าน ผ่าน LINE Messaging API (Official Account)
// เปิดใช้เมื่อตั้ง env: LINE_CHANNEL_ACCESS_TOKEN + (LINE_GROUP_ID หรือ LINE_BROADCAST=1)

import { createHmac, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const LINE_GROUP_SETTING_KEY = "line_group_id";

export interface LineConfig {
  token: string;
  /** กลุ่มเป้าหมาย (ส่งทุกกลุ่มใน list) */
  groups?: string[];
  /** กลุ่มเดี่ยว (legacy) */
  groupId?: string;
  /** ส่งถึงทุกคนที่เพิ่ม OA เป็นเพื่อน (ส่วนตัว) — เปิดโดยดีฟอลต์ */
  broadcast?: boolean;
}

export function isLineConfigured(config: LineConfig | undefined | null): boolean {
  if (!config?.token) return false;
  return !!config.broadcast || !!config.groupId || (config.groups?.length ?? 0) > 0;
}

export function buildLineMessage(
  reporterName: string,
  message: string,
  link: string,
  timeText?: string,
): Record<string, unknown> {
  const name = reporterName.trim() || "เพื่อนบ้าน";
  const msg = message.length > 120 ? `${message.slice(0, 119)}…` : message;
  const altText = `⚠️ แจ้งเตือนน้ำท่วมหมู่บ้าน\n${name} รายงาน: ${msg}`;
  const bodyContents: Array<Record<string, unknown>> = [
    { type: "text", text: `${name} รายงาน:`, weight: "bold", size: "sm", color: "#1F2937" },
    { type: "text", text: msg, size: "sm", wrap: true, color: "#374151" },
  ];
  if (timeText) {
    bodyContents.push({ type: "text", text: `🕒 ${timeText}`, size: "xs", color: "#9CA3AF", margin: "sm" });
  }
  // Flex Message: การ์ดพร้อมปุ่มกลับเข้าแอป (altText คือข้อความที่โชว์ในแถบแจ้งเตือน)
  return {
    type: "flex",
    altText,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#DC2626",
        paddingAll: "md",
        contents: [
          { type: "text", text: "⚠️ แจ้งเตือนน้ำท่วมหมู่บ้าน", color: "#FFFFFF", weight: "bold", size: "lg", wrap: true },
        ],
      },
      body: { type: "box", layout: "vertical", contents: bodyContents },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#0284C7",
            height: "md",
            action: { type: "uri", label: "เปิดดูรายงาน", uri: link },
          },
        ],
      },
    },
  };
}

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ ok: boolean; status: number }>;

async function postLine(
  url: string,
  body: unknown,
  token: string,
  fetchLike: FetchLike,
): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetchLike(url, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

export interface LineSendSummary {
  ok: boolean;
  broadcastOk: boolean;
  groupsOk: number;
  groupsTotal: number;
}

// ส่งถึงทุกช่องทาง: broadcast ทุกคนที่เพิ่ม OA (ส่วนตัว) + push ทุกกลุ่มใน list
// กลุ่มนับ 1 ข้อความ/กลุ่มต่อครั้ง, broadcast นับ 1/ผู้ติดตาม — อยู่ในโควตาแผนฟรี 200/เดือน
export async function sendLineAlert(
  config: LineConfig,
  message: Record<string, unknown>,
  fetchLike: FetchLike = (url, init) => fetch(url, init),
): Promise<LineSendSummary> {
  const groups = [...new Set([config.groupId, ...(config.groups ?? [])].filter((g): g is string => !!g))];
  const messages = [message];
  let ok = false;
  let broadcastOk = false;
  if (config.broadcast) {
    const r = await postLine("https://api.line.me/v2/bot/message/broadcast", { messages }, config.token, fetchLike);
    broadcastOk = r.ok;
    ok = ok || r.ok;
  }
  let groupsOk = 0;
  for (const groupId of groups) {
    const r = await postLine("https://api.line.me/v2/bot/message/push", { to: groupId, messages }, config.token, fetchLike);
    if (r.ok) groupsOk += 1;
    ok = ok || r.ok;
  }
  return { ok, broadcastOk, groupsOk, groupsTotal: groups.length };
}

// ---- webhook: ตรวจ signature + แยก groupId ออกจาก event ----

export function verifyLineSignature(rawBody: string, signature: string, channelSecret: string): boolean {
  try {
    const expected = createHmac("sha256", channelSecret).update(rawBody, "utf8").digest("base64");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function extractGroupId(webhookBody: string): string | null {
  try {
    const parsed = JSON.parse(webhookBody) as {
      events?: Array<{ source?: { groupId?: string } }>;
    };
    for (const event of parsed.events ?? []) {
      if (event.source?.groupId) return event.source.groupId;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getStoredGroupId(db: Pick<SupabaseClient, "from">): Promise<string | null> {
  try {
    const { data } = await db
      .from("app_settings")
      .select("value")
      .eq("key", LINE_GROUP_SETTING_KEY)
      .maybeSingle();
    return (data as { value?: string } | null)?.value ?? null;
  } catch {
    return null;
  }
}

export async function storeGroupId(db: Pick<SupabaseClient, "from">, groupId: string): Promise<void> {
  await db.from("app_settings").upsert({ key: LINE_GROUP_SETTING_KEY, value: groupId });
  // เก็บแบบหลายกลุ่มด้วย — key แยกต่อกลุ่ม
  await db.from("app_settings").upsert({ key: `${LINE_GROUP_SETTING_KEY}:${groupId}`, value: groupId });
}

// ทุกกลุ่มที่ webhook เคยเจอ (รวมค่า legacy เดี่ยว)
export async function getGroupTargets(db: Pick<SupabaseClient, "from">): Promise<string[]> {
  try {
    const { data } = await db.from("app_settings").select("key, value").like("key", `${LINE_GROUP_SETTING_KEY}%`);
    const rows = (data ?? []) as Array<{ key: string; value: string }>;
    return [...new Set(rows.map((row) => row.value))];
  } catch {
    return [];
  }
}
