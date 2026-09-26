"use client";

import Image from "next/image";

export function PhotoGrid({ photos, onOpen }: { photos: string[]; onOpen: (index: number) => void }) {
  const multi = photos.length >= 2;
  return (
    <div className={`mt-2 grid gap-1.5 ${multi ? "grid-cols-3" : "grid-cols-1"}`}>
      {photos.map((src, index) => (
        <button
          key={`${src}-${index}`}
          type="button"
          onClick={() => onOpen(index)}
          aria-label={`Photo ${index + 1}`}
          className={`relative overflow-hidden rounded-lg ${multi ? "aspect-square" : "aspect-[4/3]"}`}
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 32vw, 220px"
            className="object-cover"
          />
        </button>
      ))}
    </div>
  );
}
