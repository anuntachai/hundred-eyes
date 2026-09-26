"use client";

import { useCallback, useEffect, useState } from "react";
import { enablePushNotifications, type EnablePushResult } from "@/lib/push";
import { getSupabase } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/provider";

export type PermissionState = NotificationPermission | "unsupported";

// subscription healing: permission ค้าง granted แต่ยังไม่มี subscription จริง → subscribe เงียบ ๆ
async function healSubscription(locale: Locale): Promise<void> {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const sb = getSupabase();
      if (!sb) return;
      const { data } = await sb
        .from("push_subscriptions")
        .select("id")
        .eq("endpoint", sub.endpoint)
        .maybeSingle();
      if (data) return;
    }
    await enablePushNotifications(locale);
  } catch {
    /* silent */
  }
}

export function usePushPermission() {
  const [permission, setPermission] = useState<PermissionState>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  const heal = useCallback(async (locale: Locale) => {
    await healSubscription(locale);
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const enable = useCallback(async (locale: Locale): Promise<EnablePushResult> => {
    const result = await enablePushNotifications(locale);
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
    return result;
  }, []);

  return { permission, enable, heal };
}
