"use client";

import type { FeedItem } from "@/lib/supabase/types";
import { useT } from "@/lib/i18n";
import { relativeTime } from "@/lib/reltime";

export function FloodBanner({ item }: { item: FeedItem }) {
  const { t, locale } = useT();
  return (
    <button
      type="button"
      role="alert"
      onClick={() =>
        document.getElementById(`report-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      className="mb-4 flex w-full items-center gap-2 rounded-xl bg-danger px-4 py-3 text-left font-semibold text-white shadow-sm"
    >
      <span aria-hidden="true">⚠️</span>
      <span className="flex-1">{t("home.floodBanner")}</span>
      <span className="text-xs font-normal opacity-90">{relativeTime(item.created_at, locale)}</span>
    </button>
  );
}
