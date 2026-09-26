export function scaledSize(
  width: number,
  height: number,
  maxDim: number,
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 0, height: 0 };
  }
  const scale = Math.min(1, maxDim / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("not_an_image");
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();
    const { width, height } = scaledSize(img.naturalWidth, img.naturalHeight, maxDim);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no_2d_context");
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
    if (!blob) throw new Error("to_blob_failed");
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
