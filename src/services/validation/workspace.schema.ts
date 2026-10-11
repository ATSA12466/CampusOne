import { z } from "zod";
import type { WorkspaceMap } from "@/types/workspace";
export const recordIdSchema = z
  .string()
  .min(1)
  .max(100)
  .refine(
    (v) => !/[\\/\u0000-\u001f]/.test(v) && v !== "." && v !== "..",
    "Invalid record ID",
  );
export const enquiryInputSchema = z.object({
  message: z
    .string()
    .trim()
    .min(15, "Please add at least 15 characters.")
    .max(1500),
  consent: z.literal("yes", {
    error: "Confirm the local-demo / service notice.",
  }),
});
export const ownedPhotoSchema = z
  .string()
  .max(720000)
  .regex(
    /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/,
    "Prepare a JPG, PNG or WebP photo first.",
  );
export const photoRecordInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(2000),
  category: z.string().trim().min(3).max(80),
  location: z.string().trim().min(3).max(120),
  priceValue: z.coerce.number().min(0).max(1000000),
  type: z.enum(["listing", "lost", "found"]),
});
export const photoRecordSchema = photoRecordInputSchema.extend({
  id: recordIdSchema,
  photo: ownedPhotoSchema,
  createdAt: z.iso.datetime(),
  status: z.enum(["open", "closed"]),
});
export const workspaceSchemas: {
  [K in keyof WorkspaceMap]: z.ZodType<WorkspaceMap[K]>;
} = {
  marketPosts: photoRecordSchema,
  reports: photoRecordSchema,
  enquiries: z.object({
    id: recordIdSchema,
    category: z.enum([
      "accommodation",
      "marketplace",
      "opportunities",
      "resources",
    ]),
    listingId: recordIdSchema,
    message: z.string().min(15).max(1500),
    intent: z.enum(["enquiry", "report", "application"]),
    createdAt: z.iso.datetime(),
  }),
};
