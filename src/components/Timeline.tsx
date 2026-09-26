"use client";

import type { FeedItem } from "@/lib/supabase/types";
import { useT } from "@/lib/i18n";
import { ReportCard } from "./ReportCard";

export function Timeline({
  items,
  status,
  hasMore,
  loadMore,
  retry,
  myUserId,
  onDeleted,
  highlightId,
}: {
  items: FeedItem[];
  status: "loading" | "ready" | "error";
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
  myUserId: string;
  onDeleted: (id: string) => void;
  highlightId?: string | null;
}) {
  const { t } = useT();

  if (status === "loading") {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <p className="font-semibold text-danger">{t("error.network")}</p>
        <button
          type="button"
          aria-label={t("error.network")}
          title={t("error.network")}
          onClick={retry}
          className="mt-3 inline-flex items-center justify-center rounded-full bg-primary p-2.5 text-white hover:bg-primary-hover"
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
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {t("home.empty")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ReportCard
          key={item.id}
          item={item}
          myUserId={myUserId}
          onDeleted={onDeleted}
          highlight={item.id === highlightId}
        />
      ))}
      {hasMore && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            {t("home.loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}
