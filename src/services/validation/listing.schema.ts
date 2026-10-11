import { z } from "zod";
import { clubImageSourceSchema } from "./club.schema";
export const listingPhotoSchema = z.object({
  src: clubImageSourceSchema,
  alt: z.string().min(8).max(500),
  provenance: z.enum(["placeholder", "generated", "licensed", "upload"]),
  width: z.number().positive().max(16000).optional(),
  height: z.number().positive().max(16000).optional(),
  blurDataURL: z.string().max(50000).optional(),
  sourceNote: z.string().max(2000).optional(),
  focalPoint: z
    .object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
    .optional(),
});
export const listingDetailsSchema = z.object({
  intro: z.string().min(5).max(500),
  body: z.array(z.string().min(5).max(1500)).max(8),
  gallery: z.array(listingPhotoSchema).max(6),
  kind: z.string().min(1).max(80),
  owner: z.string().min(1).max(120),
  tags: z.array(z.string().min(1).max(80)).max(12),
  priceValue: z.number().int().min(0).max(1000000).optional(),
  walkMinutes: z.number().int().min(0).max(240).optional(),
  condition: z.string().max(100).optional(),
  eligibility: z.array(z.string().max(300)).max(8).optional(),
  applicationUrl: z
    .url()
    .refine(
      (v) =>
        v.startsWith("https://") &&
        !new URL(v).username &&
        !new URL(v).password,
      "HTTPS links only",
    )
    .optional(),
});
