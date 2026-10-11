import { z } from "zod";
import { discoverCategories } from "@/config/discover";
import { isAllowedImageSrc } from "@/config/image-policy";
export const discoverIdSchema = z
  .string()
  .min(1)
  .max(100)
  .refine(
    (value) =>
      !!value.trim() &&
      value !== "." &&
      !value.includes("..") &&
      !/[\/\\#\u0000-\u001f\u007f]/.test(value),
    "This item ID cannot open its existing campus route.",
  );
export const discoverReferenceSchema = z.object({
  category: z.enum(discoverCategories),
  id: discoverIdSchema,
});
const text = z.string().min(1).max(240);
export const discoverItemSchema = discoverReferenceSchema.extend({
  title: text,
  description: z.string().max(2000),
  href: z
    .string()
    .max(600)
    .refine(
      (value) =>
        value.startsWith("/") &&
        !value.startsWith("//") &&
        !/[\\\u0000-\u001f]/.test(value),
    ),
  destination: z.enum(["detail", "board", "library"]),
  cover: z.object({
    src: z
      .string()
      .max(2048)
      .refine(
        (value) => !value.startsWith("blob:") && isAllowedImageSrc(value),
      ),
    alt: z.string().min(8).max(500),
    provenance: z.enum(["generated", "placeholder", "licensed", "upload"]),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    sourceNote: z.string().max(2000).optional(),
    blurDataURL: z.string().max(3000).optional(),
    focalPoint: z
      .object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) })
      .optional(),
  }),
  illustrative: z.boolean(),
  facts: z
    .array(z.object({ label: text, value: z.string().min(1).max(600) }))
    .max(3),
  rank: z.number().int().nonnegative().optional(),
  date: z.iso.date().optional(),
  event: z
    .object({
      date: z.iso.date(),
      endsAt: z.iso.datetime({ offset: true }).optional(),
      startsAt: z.iso.datetime({ offset: true }).optional(),
      closesAt: z.iso.datetime({ offset: true }).optional(),
      cancelled: z.boolean(),
      full: z.boolean(),
    })
    .optional(),
});
export const discoverActivitySchema = z.object({
  saved: z.array(discoverReferenceSchema).max(500),
});
export const discoverAckSchema = z.object({ ok: z.literal(true) });
