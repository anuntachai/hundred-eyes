import { getSupabase } from "./supabase/client";
import type { Locale } from "./i18n/provider";

export type EnablePushResult = "granted" | "denied" | "unsupported" | "error";

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  let b64 = base64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function enablePushNotifications(locale: Locale): Promise<EnablePushResult> {
  try {
    if (
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      return "unsupported";
    }
    if (Notification.permission !== "granted") {
      const result = await Notification.requestPermission();
      if (result !== "granted") return "denied";
    }
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return "error";
    const sb = getSupabase();
    if (!sb) return "error";
    const { data: sessionData } = await sb.auth.getSession();
    const session = sessionData?.session;
    if (!session) return "error";

    // ลงทะเบียน SW เองแทนการรอ serviceWorker.ready — กันค้างตลอดกาล
    // ถ้าลงทะเบียนไว้แล้วจะได้ registration เดิม; พร้อม timeout กันห้อย
    const reg = await Promise.race([
      navigator.serviceWorker.register("/sw.js").catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    if (!reg || !reg.active) {
      const fallback = await Promise.race([
        navigator.serviceWorker.ready.then((r) => (r.active ? r : null)).catch(() => null),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      if (!fallback) return "error";
    }
    const swReg = reg ?? (await navigator.serviceWorker.ready);

    let sub = await swReg.pushManager.getSubscription();
    const json0 = sub?.toJSON() as { keys?: { p256dh?: string; auth?: string } } | undefined;
    if (sub && !json0?.keys?.p256dh) {
      // subscription เก่าไม่มี keys → สร้างใหม่
      await sub.unsubscribe();
      sub = null;
    }
    if (!sub) {
      sub = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return "error";

    const { error } = await sb.from("push_subscriptions").upsert(
      {
        user_id: session.user.id,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        locale,
        user_agent: navigator.userAgent,
      },
      { onConflict: "endpoint" },
    );
    if (error) return "error";
    return "granted";
  } catch {
    return "error";
  }
}
