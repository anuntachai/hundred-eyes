"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useT } from "@/lib/i18n";
import { useToast } from "./Toast";

export function InstallButton({ className = "" }: { className?: string }) {
  const { t } = useT();
  const { showToast } = useToast();
  const { canInstall, promptInstall } = useInstallPrompt();
  if (!canInstall) return null;

  async function handleClick() {
    const outcome = await promptInstall();
    // บอกผลทุกกรณี — กดแล้วเงียบไม่ได้
    if (outcome === "accepted") showToast(t("install.success"), "success");
    else if (outcome === "dismissed") showToast(t("install.dismissed"), "info");
    else showToast(t("install.manualHint"), "info");
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className={`rounded-full border border-primary px-3 py-1.5 text-sm font-semibold text-primary hover:bg-sky-50 ${className}`}
    >
      {t("install.install")}
    </button>
  );
}
