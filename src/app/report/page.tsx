"use client";

import Link from "next/link";
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
        <div className="mb-3 flex items-center gap-2">
          <Link
            href="/"
            aria-label={t("common.back")}
            title={t("common.back")}
            className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">{t("report.title")}</h1>
        </div>
        <ReportForm userId={state.userId} />
      </main>
    </>
  );
}
