import { z } from "zod";

export const imageFileSchema = z
  .custom<File>(
    (value) => typeof File !== "undefined" && value instanceof File,
    "Choose a photo first",
  )
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    "Choose a JPG, PNG or WebP photo — SVG, GIF and HEIC are not supported",
  )
  .refine(
    (file) => file.size > 0 && file.size <= 12 * 1024 * 1024,
    "Choose a photo smaller than 12 MB",
  );
