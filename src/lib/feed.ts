import { FLOOD_ALERT_WINDOW_HOURS } from "./constants";
import type { FeedItem } from "./supabase/types";

export function mergeReports(a: FeedItem[], b: FeedItem[]): FeedItem[] {
  const map = new Map<string, FeedItem>();
  for (const item of a) map.set(item.id, item);
  for (const item of b) if (!map.has(item.id)) map.set(item.id, item);
  return [...map.values()].sort((x, y) => Date.parse(y.created_at) - Date.parse(x.created_at));
}

export function activeFloodReport(items: FeedItem[], now: Date = new Date()): FeedItem | null {
  const windowMs = FLOOD_ALERT_WINDOW_HOURS * 3_600_000;
  let latest: FeedItem | null = null;
  for (const item of items) {
    if (!item.is_flooded) continue;
    const time = Date.parse(item.created_at);
    if (!Number.isFinite(time)) continue;
    if (now.getTime() - time > windowMs) continue;
    if (!latest || time > Date.parse(latest.created_at)) latest = item;
  }
  return latest;
}
