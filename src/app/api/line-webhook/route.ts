import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractGroupId, storeGroupId, verifyLineSignature } from "@/lib/line";

export const runtime = "nodejs";

// LINE Messaging API webhook — จับรหัสกลุ่มหมู่บ้านจาก event แรกที่ได้รับ
// ตั้งค่า URL นี้ที่ LINE Developers Console → Messaging API → Webhook URL
export async function POST(request: NextRequest) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ตอบ 200 เสมอเมื่อยังไม่ตั้งค่า กัน LINE retry ซ้ำ
  if (!secret || !supabaseUrl || !serviceKey) {
    return new NextResponse(null, { status: 200 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";
  if (!verifyLineSignature(rawBody, signature, secret)) {
    return new NextResponse(null, { status: 401 });
  }

  const groupId = extractGroupId(rawBody);
  if (groupId) {
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    await storeGroupId(db, groupId);
  }

  // LINE ต้องการ 200 พร้อม body ว่าง
  return new NextResponse(null, { status: 200 });
}
