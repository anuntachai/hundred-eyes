"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable" | "error";

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);
  // ในแอปเบราว์เซอร์ (LINE/Facebook/Messenger/Instagram) — ติดตั้ง PWA ไม่ได้ ต้องเปิดด้วย browser จริง
  const [inAppBrowser, setInAppBrowser] = useState(false);

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setInAppBrowser(
      /Line\//i.test(navigator.userAgent) ||
        /FBAN|FBAV|Messenger|Instagram/i.test(navigator.userAgent),
    );
    const mq = window.matchMedia("(display-mode: standalone)");
    const update = () => {
      setStandalone(mq.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    };
    update();
    mq.addEventListener("change", update);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      mq.removeEventListener("change", update);
    };
  }, []);

  // คืนผลลัพธ์ให้ UI แจ้งผู้ใช้เสมอ — ไม่มีทางกดแล้วเงียบ
  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!installEvent) return "unavailable";
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      setInstallEvent(null);
      return choice.outcome;
    } catch {
      setInstallEvent(null);
      return "error";
    }
  }, [installEvent]);

  return { canInstall: installEvent !== null, promptInstall, isIOS, standalone, inAppBrowser };
}
