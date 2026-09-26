"use client";

import { useEffect, useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useT } from "@/lib/i18n";
import { INSTALL_BANNER_DISMISSED_KEY } from "@/lib/constants";
import { EyeLogo } from "./EyeLogo";

// แบนเนอร์ชวนติดตั้งแอป — แสดงเฉพาะมือถือ (sm:hidden):
// Android ที่มี install prompt → ปุ่มติดตั้ง | iOS → คำแนะนำเพิ่มหน้าจอหลัก
// ติดตั้งแล้ว (standalone) หรือกดปิดไปแล้ว → ไม่แสดงอีก
export function InstallBanner() {
  const { t } = useT();
  const { canInstall, promptInstall, isIOS, standalone, inAppBrowser } = useInstallPrompt();
  // เริ่มด้วย dismissed เพื่อกัน hydration mismatch แล้วค่อยเปิดใน effect
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed || standalone || (!canInstall && !isIOS && !inAppBrowser)) return null;

  async function handleInstall() {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      setDismissed(true);
      try {
        window.localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, "1");
      } catch {
        /* ignore */
      }
    }
  }

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sky-900 shadow-sm sm:hidden">
      <div className="flex items-start gap-3">
        <EyeLogo size={40} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("install.bannerTitle")}</p>
          <p className="mt-0.5 text-sm">{t("install.bannerBody")}</p>
          {inAppBrowser && !canInstall ? (
            <p className="mt-2 text-sm font-medium">{t("install.openInBrowser")}</p>
          ) : canInstall ? (
            <button
              type="button"
              onClick={() => void handleInstall()}
              className="mt-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              {t("install.install")}
            </button>
          ) : (
            <p className="mt-2 text-sm font-medium">{t("install.iosHint")}</p>
          )}
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={dismiss}
          className="rounded-full p-1.5 text-sky-700 hover:bg-sky-100"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="size-4"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
