"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
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

  const promptInstall = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    setInstallEvent(null);
  }, [installEvent]);

  return { canInstall: installEvent !== null, promptInstall, isIOS, standalone };
}
