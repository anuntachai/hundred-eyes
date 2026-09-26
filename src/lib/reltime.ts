export function relativeTime(
  input: string | number | Date,
  locale: "th" | "en",
  now: Date = new Date(),
): string {
  const time = input instanceof Date ? input.getTime() : typeof input === "number" ? input : Date.parse(input);
  if (!Number.isFinite(time)) return "";
  // clamp ไม่ติดลบ กัน clock skew (เวลาอนาคตเล็กน้อย → แสดงเป็น "เมื่อสักครู่")
  const diffSeconds = Math.max(0, Math.round((now.getTime() - time) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diffSeconds < 60) return rtf.format(-diffSeconds, "second");
  if (diffSeconds < 3600) return rtf.format(-Math.round(diffSeconds / 60), "minute");
  if (diffSeconds < 86400) return rtf.format(-Math.round(diffSeconds / 3600), "hour");
  return rtf.format(-Math.round(diffSeconds / 86400), "day");
}
