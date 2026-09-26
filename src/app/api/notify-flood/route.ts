import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { broadcastFloodNotification } from "@/lib/notify";
import { isUuid } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !publicKey || !privateKey || !supabaseUrl) {
    return NextResponse.json({ error: "server_not_configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const reportId = (body as { reportId?: unknown } | null)?.reportId;
  if (!isUuid(reportId)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const result = await broadcastFloodNotification(reportId, {
      db,
      env: {
        publicKey,
        privateKey,
        subject: process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
      },
      sendNotification: (subscription, payload, options) =>
        webpush.sendNotification(subscription, payload, options),
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "broadcast_failed" }, { status: 500 });
  }
}
