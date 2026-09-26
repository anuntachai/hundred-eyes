export interface PushPayload {
  title: string;
  body: string;
  tag: string;
  data: { url: string };
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function buildPushPayload(locale: "th" | "en", reporterName: string, message: string): PushPayload {
  const msg = truncate(message, 80);
  const name = reporterName.trim() || (locale === "th" ? "เพื่อนบ้าน" : "A neighbour");
  if (locale === "th") {
    return {
      title: "⚠️ แจ้งเตือนน้ำท่วม",
      body: `${name} รายงานน้ำท่วมเข้าหมู่บ้าน: ${msg}`,
      tag: "flood-alert",
      data: { url: "/" },
    };
  }
  return {
    title: "⚠️ Flood Alert",
    body: `${name} reported flooding in the village: ${msg}`,
    tag: "flood-alert",
    data: { url: "/" },
  };
}
