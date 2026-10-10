import type { CropSettings, ProcessedImage } from "@/types/media";
import { cropRectangle } from "./crop";

async function readBitmap(file: File) {
  if (typeof createImageBitmap !== "function")
    throw new Error(
      "Photo editing needs a newer browser. Try a current version of Chrome, Edge or Safari.",
    );
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("We couldn't open this photo. Choose a different JPG, PNG or WebP.");
  }
  if (bitmap.width * bitmap.height > 40_000_000) {
    bitmap.close();
    throw new Error("This photo is very large. Choose one below 40 megapixels.");
  }
  return bitmap;
}
export async function inspectPhoto(file: File) {
  const bitmap = await readBitmap(file);
  try {
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}
function toBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Your browser could not prepare this photo. Please try a JPG.")),
      "image/jpeg",
      quality,
    ),
  );
}
export async function preparePhoto(
  file: File,
  crop: CropSettings,
  onProgress?: (value: number) => void,
): Promise<ProcessedImage> {
  const bitmap = await readBitmap(file);
  try {
    const rectangle = cropRectangle(bitmap.width, bitmap.height, crop);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Photo editing isn't supported in this browser.");
    let scale = Math.min(1, 1600 / Math.max(rectangle.width, rectangle.height));
    let quality = 0.88;
    for (let attempt = 0; attempt < 8; attempt++) {
      canvas.width = Math.max(1, Math.round(rectangle.width * scale));
      canvas.height = Math.max(1, Math.round(rectangle.height * scale));
      context.fillStyle = "white"; // Flatten PNG transparency onto a canonical photo background.
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        bitmap,
        rectangle.x,
        rectangle.y,
        rectangle.width,
        rectangle.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      onProgress?.(15 + attempt * 8);
      const blob = await toBlob(canvas, quality);
      if (blob.size <= 512 * 1024) {
        onProgress?.(85);
        return {
          file: new File(
            [blob],
            `${file.name.replace(/\.[^.]+$/, "").slice(0, 90)}-campusone.jpg`,
            { type: "image/jpeg", lastModified: Date.now() },
          ),
          width: canvas.width,
          height: canvas.height,
          originalBytes: file.size,
        };
      }
      if (quality > 0.5) quality -= 0.13;
      else scale *= 0.8;
    }
    throw new Error("We couldn't make this photo small enough. Try a smaller image.");
  } finally {
    bitmap.close();
  }
}
export function formatBytes(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`;
}
