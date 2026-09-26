"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { FeedItem } from "@/lib/supabase/types";
import { useT } from "@/lib/i18n";
import { relativeTime } from "@/lib/reltime";
import { Lightbox } from "./Lightbox";
import { PhotoGrid } from "./PhotoGrid";
import { useToast } from "./Toast";

export function ReportCard({
  item,
  myUserId,
  onDeleted,
}: {
  item: FeedItem;
  myUserId: string;
  onDeleted: (id: string) => void;
}) {
  const { t, locale } = useT();
  const { showToast } = useToast();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const mine = item.user_id === myUserId;

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm(t("report.deleteConfirm"))) return;
    setDeleting(true);
    try {
      const sb = getSupabase();
      if (!sb) throw new Error("no_supabase");
      const { error } = await sb.from("reports").delete().eq("id", item.id);
      if (error) throw new Error(error.message);
      onDeleted(item.id);
    } catch {
      showToast(t("error.network"), "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article
      id={`report-${item.id}`}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm scroll-mt-20"
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold">{item.reporter_name}</span>
        {item.is_flooded && (
          <span className="rounded-full bg-danger-bg px-2 py-0.5 text-xs font-bold text-danger">
            {t("home.floodBadge")}
          </span>
        )}
        <time
          dateTime={item.created_at}
          className="ml-auto text-xs text-slate-500"
        >
          {relativeTime(item.created_at, locale)}
        </time>
        {mine && (
          <button
            type="button"
            aria-label={t("report.delete")}
            title={t("report.delete")}
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="rounded-full p-1.5 text-slate-400 hover:bg-danger-bg hover:text-danger disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words">{item.message}</p>
      {item.photos.length > 0 && <PhotoGrid photos={item.photos} onOpen={(i) => setLightbox(i)} />}
      {lightbox !== null && (
        <Lightbox photos={item.photos} index={lightbox} onClose={() => setLightbox(null)} />
      )}
    </article>
  );
}
