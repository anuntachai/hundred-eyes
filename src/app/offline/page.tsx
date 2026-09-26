"use client";

import { useT } from "@/lib/i18n";

export default function OfflinePage() {
  const { t } = useT();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-xl font-bold">{t("offline.title")}</h1>
      <p className="text-sm text-slate-500">{t("offline.body")}</p>
    </main>
  );
}
