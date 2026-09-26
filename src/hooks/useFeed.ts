"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { FeedItem } from "@/lib/supabase/types";
import { PAGE_SIZE } from "@/lib/constants";
import { mergeReports } from "@/lib/feed";

export type FeedStatus = "loading" | "ready" | "error";

export function useFeed(enabled: boolean) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [status, setStatus] = useState<FeedStatus>("loading");
  const [hasMore, setHasMore] = useState(false);
  const loadingRef = useRef(false);
  const itemsRef = useRef<FeedItem[]>([]);

  const applyItems = useCallback((next: FeedItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const loadInitial = useCallback(async () => {
    setStatus("loading");
    loadingRef.current = true;
    try {
      const sb = getSupabase();
      if (!sb) throw new Error("no_supabase");
      const { data, error } = await sb
        .from("v_report_feed")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as FeedItem[];
      applyItems(rows);
      setHasMore(rows.length === PAGE_SIZE);
      setStatus("ready");
    } catch {
      setStatus("error");
    } finally {
      loadingRef.current = false;
    }
  }, [applyItems]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const sb = getSupabase();
      if (!sb) throw new Error("no_supabase");
      const offset = itemsRef.current.length;
      const { data, error } = await sb
        .from("v_report_feed")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as FeedItem[];
      applyItems(mergeReports(itemsRef.current, rows));
      setHasMore(rows.length === PAGE_SIZE);
    } catch {
      /* โหลดเพิ่มไม่สำเร็จ → คงรายการเดิม กดอีกครั้งได้ */
    } finally {
      loadingRef.current = false;
    }
  }, [applyItems]);

  const remove = useCallback(
    (id: string) => {
      applyItems(itemsRef.current.filter((item) => item.id !== id));
    },
    [applyItems],
  );

  useEffect(() => {
    if (!enabled) return;
    void loadInitial();
    const sb = getSupabase();
    if (!sb) return;
    const channel = sb
      .channel("feed-inserts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, () => {
        void (async () => {
          try {
            const { data, error } = await sb
              .from("v_report_feed")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(PAGE_SIZE);
            if (error) return;
            applyItems(mergeReports(itemsRef.current, (data ?? []) as FeedItem[]));
          } catch {
            /* refetch หลัง realtime ล้ม → คง state เดิม */
          }
        })();
      })
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [enabled, loadInitial, applyItems]);

  return { items, status, hasMore, loadMore, loadInitial, remove };
}
