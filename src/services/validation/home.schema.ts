import { z } from "zod";
import { isAllowedImageSrc } from "@/config/image-policy";
const route = z.string().regex(/^\/(?!\/)[\w/\-#]*$/);
const media = z
  .string()
  .refine(isAllowedImageSrc, "An approved local/HTTPS media source is required");
export const featuredSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  type: z.enum(["video", "audio", "sponsored", "highlight", "opportunity", "announcement"]),
  thumbnail: media,
  thumbnailAlt: z.string().min(12).max(300),
  mediaSource: media.optional(),
  captionsSource: media.optional(),
  transcript: z.string().optional(),
  campaignId: z.string().optional(),
  creator: z.string().optional(),
  duration: z.string().optional(),
  ctaLabel: z.string().optional(),
  destination: route,
  sponsored: z.boolean().optional(),
  active: z.boolean(),
});
