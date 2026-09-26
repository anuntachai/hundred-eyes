"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { REPORT_THROTTLE_MS, STORAGE_BUCKET } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { isThrottled, markReported } from "@/lib/throttle";
import { validateMessage } from "@/lib/validate";
import { PhotoPicker, type PhotoItem } from "./PhotoPicker";
import { useToast } from "./Toast";

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ph-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// upload พร้อม retry 1 ครั้งต่อภาพ
async function uploadPhoto(
  sb: NonNullable<ReturnType<typeof getSupabase>>,
  userId: string,
  file: File,
): Promise<string> {
  const path = `${userId}/${newId()}.jpg`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { error } = await sb.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType: "image/jpeg", upsert: true });
    if (!error) return sb.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  }
  throw new Error("upload_failed");
}

export function ReportForm({ userId }: { userId: string }) {
  const { t } = useT();
  const { showToast } = useToast();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isFlooded, setIsFlooded] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const busyPhotos = photos.some((photo) => photo.status !== "ready");
  const canSubmit = !submitting && message.trim().length > 0 && !busyPhotos;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    if (isThrottled(Date.now(), REPORT_THROTTLE_MS, window.localStorage)) {
      showToast(t("error.throttled"), "error");
      return;
    }
    const text = validateMessage(message);
    if (!text) {
      showToast(t("error.network"), "error");
      return;
    }
    setSubmitting(true);
    try {
      const sb = getSupabase();
      if (!sb) throw new Error("no_supabase");
      // 1. compress แล้วตอนเลือกภาพ → upload ตอนส่ง
      const urls: string[] = [];
      for (const photo of photos) {
        if (photo.status === "ready" && photo.file) {
          urls.push(await uploadPhoto(sb, userId, photo.file));
        }
      }
      // 2. insert รายงาน
      const { data: inserted, error } = await sb
        .from("reports")
        .insert({ user_id: userId, is_flooded: isFlooded, message: text, photos: urls })
        .select("id")
        .single();
      if (error || !inserted) throw new Error(error?.message ?? "insert_failed");
      // 3. fire-and-forget → server จะ verify/claim เอง (idempotent)
      if (isFlooded) {
        void fetch("/api/notify-flood", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reportId: inserted.id as string }),
        }).catch(() => {});
      }
      // 4. mark throttle แล้วกลับหน้าหลัก
      markReported(Date.now(), window.localStorage);
      showToast(t("report.success"), "success");
      router.push("/");
    } catch {
      showToast(t("error.network"), "error");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label htmlFor="report-message" className="font-semibold">
          {t("report.messageLabel")}
        </label>
        <textarea
          id="report-message"
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, 500))}
          placeholder={t("report.messagePlaceholder")}
          rows={4}
          maxLength={500}
          className="mt-2 w-full resize-none rounded-lg border border-slate-200 p-3 focus:border-primary focus:outline-none"
        />
        <div className="mt-1 text-right text-xs text-slate-500">{message.length}/500</div>
      </div>

      <PhotoPicker photos={photos} setPhotos={setPhotos} />

      <label
        className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 shadow-sm transition-colors ${
          isFlooded ? "border-danger bg-danger-bg" : "border-slate-200 bg-white"
        }`}
      >
        <input
          type="checkbox"
          checked={isFlooded}
          onChange={(event) => setIsFlooded(event.target.checked)}
          className="mt-0.5 size-5 accent-red-600"
        />
        <span>
          <span className="font-semibold">{t("report.floodCheck")}</span>
          {isFlooded && (
            <span className="mt-1 block text-sm font-medium text-danger">{t("report.floodCheckHint")}</span>
          )}
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-2xl bg-primary py-4 text-lg font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? t("report.submitting") : t("report.submit")}
      </button>
    </form>
  );
}
