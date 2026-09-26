"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useT } from "@/lib/i18n";

export function InstallButton({ className = "" }: { className?: string }) {
  const { t } = useT();
  const { canInstall, promptInstall } = useInstallPrompt();
  if (!canInstall) return null;
  return (
    <button
      type="button"
      onClick={() => void promptInstall()}
      className={`rounded-full border border-primary px-3 py-1.5 text-sm font-semibold text-primary hover:bg-sky-50 ${className}`}
    >
      {t("install.install")}
    </button>
  );
}
