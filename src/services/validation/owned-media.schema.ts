import { z } from "zod";
export const recordIdSchema = z
  .string()
  .min(1)
  .max(100)
  .refine(
    (v) => !/[\\/\u0000-\u001f?#]/.test(v) && v !== "." && v !== "..",
    "Invalid record ID",
  );
export const ownedPhotoSchema = z
  .string()
  .max(720000)
  .regex(
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/,
    "Prepare a JPG, PNG or WebP photo first.",
  );
