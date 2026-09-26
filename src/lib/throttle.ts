import { LAST_REPORT_KEY, REPORT_THROTTLE_MS } from "./constants";

export function isThrottled(now: number, windowMs: number = REPORT_THROTTLE_MS, store: Storage): boolean {
  const last = Number(store.getItem(LAST_REPORT_KEY));
  if (!Number.isFinite(last) || last <= 0) return false;
  return now - last < windowMs;
}

export function markReported(now: number, store: Storage): void {
  try {
    store.setItem(LAST_REPORT_KEY, String(now));
  } catch {
    /* storage เต็ม/ถูกปิด → ปล่อยผ่าน */
  }
}
