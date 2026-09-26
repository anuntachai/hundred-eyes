"use client";

import { useRef } from "react";
import { compressImage } from "@/lib/compress";
import { MAX_PHOTOS } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import { useToast } from "./Toast";

export interface PhotoItem {
  id: string;
  url: string;
  file: File | null;
  status: "compressing" | "ready" | "error";
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function PhotoPicker({
  photos,
  setPhotos,
}: {
  photos: PhotoItem[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoItem[]>>;
}) {
  const { t } = useT();
  const { showToast } = useToast();
  const takeInputRef = useRef<HTMLInputElement>(null);
  const chooseInputRef = useRef<HTMLInputElement>(null);
  // mirror ล่าสุดสำหรับเช็คจำนวนตอน event กันเลือกรัว ๆ ทะลุลิมิต 6 ภาพ
  const photosRef = useRef(photos);
  photosRef.current = photos;

  async function handleFiles(fileList: File[]) {
    const files = fileList;
    if (files.length === 0) return;
    const room = MAX_PHOTOS - photosRef.current.length;
    if (files.length > room) showToast(t("error.photoTooMany"), "error");
    const accepted = files.slice(0, Math.max(0, room));
    if (accepted.length === 0) return;
    const items: PhotoItem[] = accepted.map((file) => ({
      id: newId(),
      url: URL.createObjectURL(file),
      file,
      status: "compressing",
    }));
    setPhotos((prev) => [...prev, ...items]);
    await Promise.all(
      items.map(async (item) => {
        try {
          const compressed = await compressImage(item.file as File);
          const url = URL.createObjectURL(compressed);
          URL.revokeObjectURL(item.url);
          setPhotos((prev) =>
            prev.map((photo) =>
              photo.id === item.id ? { ...photo, url, file: compressed, status: "ready" as const } : photo,
            ),
          );
        } catch {
          setPhotos((prev) =>
            prev.map((photo) => (photo.id === item.id ? { ...photo, status: "error" as const } : photo)),
          );
        }
      }),
    );
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const target = prev.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((photo) => photo.id !== id);
    });
  }

  const pickButtonClass =
    "rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => takeInputRef.current?.click()} className={pickButtonClass}>
          {t("report.takePhoto")}
        </button>
        <button type="button" onClick={() => chooseInputRef.current?.click()} className={pickButtonClass}>
          {t("report.choosePhotos")}
        </button>
        <span className="text-xs text-slate-500">{t("report.photoLimit")}</span>
      </div>
      <input
        ref={takeInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        hidden
        onChange={(event) => {
          // คัดลอกเป็น array ก่อนเคลียร์ value — FileList เป็น live object ถูกล้างตาม input ทันที
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) void handleFiles(files);
        }}
      />
      <input
        ref={chooseInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) void handleFiles(files);
        }}
      />
      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-lg border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- preview จาก blob URL ใช้ next/image ไม่ได้ */}
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
              {photo.status !== "ready" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-semibold text-white">
                  {photo.status === "compressing" ? (
                    <span className="inline-block size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    "!"
                  )}
                </div>
              )}
              <button
                type="button"
                aria-label={t("report.delete")}
                onClick={() => removePhoto(photo.id)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="size-3"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
