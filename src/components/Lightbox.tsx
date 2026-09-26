"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

export function Lightbox({
  photos,
  index,
  onClose,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(index);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4"
      onClick={onClose}
    >
      <div className="flex items-center justify-between text-white">
        <span className="text-sm font-medium">
          {current + 1}/{photos.length}
        </span>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/10"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="size-6"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="relative flex-1" onClick={(event) => event.stopPropagation()}>
        <Image
          src={photos[current]}
          alt=""
          fill
          sizes="100vw"
          className="object-contain"
        />
      </div>
      {photos.length > 1 && (
        <div className="flex items-center justify-between" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={prev}
            className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6"
              aria-hidden="true"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={next}
            className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-6"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
