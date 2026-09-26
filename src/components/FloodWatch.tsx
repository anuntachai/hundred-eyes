"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { playFloodAlarm } from "@/lib/alarm";
import { useT } from "@/lib/i18n";

interface RealtimeInsertPayload {
  new: { id?: string; is_flooded?: boolean; user_id?: string } | null;
}

// mounted ทุกหน้าเมื่อ session ready — เตือนน้ำท่วมจากรายงานของคนอื่น
export function FloodWatch({ userId }: { userId: string }) {
  const { t } = useT();
  const [visible, setVisible] = useState(false);
  const alertedRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const channel = sb
      .channel("flood-watch")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, (payload) => {
        const row = (payload as unknown as RealtimeInsertPayload).new;
        if (!row?.id || !row.is_flooded) return;
        if (row.user_id === userId) return;
        if (alertedRef.current.has(row.id)) return;
        alertedRef.current.add(row.id);
        playFloodAlarm();
        setVisible(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setVisible(false), 15000);
      })
      .subscribe();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void sb.removeChannel(channel);
    };
  }, [userId]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-40 px-4">
      <div
        role="alert"
        className="pointer-events-auto mx-auto flex max-w-2xl items-center gap-2 rounded-xl bg-danger px-4 py-3 font-semibold text-white shadow-lg"
      >
        <span aria-hidden="true">⚠️</span>
        <span className="flex-1">{t("alarm.banner")}</span>
        <button
          type="button"
          aria-label="Close"
          onClick={() => setVisible(false)}
          className="rounded-full p-1.5 hover:bg-white/20"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="size-4"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
