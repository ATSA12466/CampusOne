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
export const workspaceSchemas: {
  [K in keyof WorkspaceMap]: z.ZodType<WorkspaceMap[K]>;
} = {
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
