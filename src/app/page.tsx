"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppHeader } from "@/components/AppHeader";
import { FloodBanner } from "@/components/FloodBanner";
import { FloodWatch } from "@/components/FloodWatch";
import { InstallBanner } from "@/components/InstallBanner";
import { NotificationSetup } from "@/components/NotificationSetup";
import { Onboarding } from "@/components/Onboarding";
import { Timeline } from "@/components/Timeline";
import { useSession } from "@/hooks/useSession";
import { useFeed } from "@/hooks/useFeed";
import { useT } from "@/lib/i18n";
import { activeFloodReport } from "@/lib/feed";

function RetryButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="mt-4 inline-flex items-center justify-center rounded-full bg-primary p-3 text-white hover:bg-primary-hover"
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
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    </button>
  );
}

export default function HomePage() {
  const { state, refresh } = useSession();
  const { t } = useT();
  const feed = useFeed(state.status === "ready");
  const activeFlood = useMemo(() => activeFloodReport(feed.items), [feed.items]);

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
        <RetryButton onClick={() => void refresh()} label={t("error.network")} />
      </main>
    );
  }

  if (state.status === "onboard") {
    return <Onboarding hasAuthUser={state.hasAuthUser} onDone={() => void refresh()} />;
  }

  const { userId } = state;

  return (
    <>
      <AppHeader />
      <FloodWatch userId={userId} />
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4 sm:pb-10">
        <InstallBanner />
        {activeFlood && <FloodBanner item={activeFlood} />}
        <NotificationSetup />
        <section>
          <h2 className="mb-3 text-lg font-bold">{t("home.timeline")}</h2>
          <Timeline
            items={feed.items}
            status={feed.status}
            hasMore={feed.hasMore}
            loadMore={() => void feed.loadMore()}
            retry={() => void feed.loadInitial()}
            myUserId={userId}
            onDeleted={feed.remove}
          />
        </section>
      </main>
      {/* CTA มือถือ: fixed bottom */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 p-4 sm:hidden"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <Link
          href="/report"
          className="block w-full rounded-2xl bg-primary py-4 text-center text-lg font-bold text-white shadow-lg hover:bg-primary-hover"
        >
          {t("home.reportCta")}
        </Link>
      </div>
    </>
  );
}
