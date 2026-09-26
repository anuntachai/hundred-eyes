"use client";

import { AppHeader } from "@/components/AppHeader";
import { FloodWatch } from "@/components/FloodWatch";
import { Onboarding } from "@/components/Onboarding";
import { ReportForm } from "@/components/ReportForm";
import { useSession } from "@/hooks/useSession";
import { useT } from "@/lib/i18n";

export default function ReportPage() {
  const { state, refresh } = useSession();
  const { t } = useT();

  if (state.status === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <span
          role="status"
          aria-label="loading"
          className="inline-block size-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary"
        />
      </main>
    );
  }

  if (state.status === "noconfig") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-xl font-bold">{t("setup.title")}</h1>
        <p className="text-sm text-slate-500">{t("setup.body")}</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="font-semibold text-danger">{t("error.network")}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 rounded-full bg-primary px-6 py-2 font-semibold text-white hover:bg-primary-hover"
        >
          {t("home.loadMore")}
        </button>
      </main>
    );
  }

  if (state.status === "onboard") {
    return <Onboarding hasAuthUser={state.hasAuthUser} onDone={() => void refresh()} />;
  }

  return (
    <>
      <AppHeader />
      <FloodWatch userId={state.userId} />
      <main className="mx-auto max-w-2xl px-4 pb-10 pt-4">
        <h1 className="mb-3 text-xl font-bold">{t("report.title")}</h1>
        <ReportForm userId={state.userId} />
      </main>
    </>
  );
}
