"use client";

import { useEffect, useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { usePushPermission } from "@/hooks/usePushPermission";
import { useT } from "@/lib/i18n";
import { useToast } from "./Toast";

// การ์ดชวนเปิด notification บนหน้าหลัก — ขอสิทธิ์เมื่อผู้ใช้กดเท่านั้น (ไม่ถามตอนเปิดแอป)
export function NotificationSetup() {
  const { t, locale } = useT();
  const { showToast } = useToast();
  const { permission, enable, heal } = usePushPermission();
  const { isIOS, standalone } = useInstallPrompt();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void heal(locale);
  }, [heal, locale]);

  if (permission === "granted") return null;

  const iosBlocked = isIOS && !standalone;

  async function handleEnable() {
    setBusy(true);
    const result = await enable(locale);
    setBusy(false);
    if (result === "error") showToast(t("error.network"), "error");
  }

  return (
    <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-900">
      <p className="font-semibold">{t("notif.enable")}</p>
      {permission === "denied" ? (
        <p className="mt-1 text-sm">{t("notif.blocked")}</p>
      ) : permission === "unsupported" && iosBlocked ? (
        <p className="mt-1 text-sm">{t("notif.iosHint")}</p>
      ) : (
        <>
          {iosBlocked && <p className="mt-1 text-sm">{t("notif.iosHint")}</p>}
          <button
            type="button"
            onClick={() => void handleEnable()}
            disabled={busy}
            className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {t("notif.enable")}
          </button>
        </>
      )}
    </div>
  );
}
