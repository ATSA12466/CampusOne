import { z } from "zod";
export const campusId = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine(
    (id) => !/[\/\\?#\u0000-\u001f]/.test(id) && id !== "." && id !== "..",
    "Invalid resource ID",
  );
export const requestInputSchema = z.object({
  title: z.string().trim().min(3, "Request title is required").max(120),
  category: z.enum(["Academic support", "Welfare", "Infrastructure"]),
  description: z
    .string()
    .trim()
    .min(10, "Please add enough context for review")
    .max(2000),
});
export const studentRequestSchema = requestInputSchema.extend({
  id: campusId,
  status: z.enum(["submitted", "under-review", "resolved"]),
  createdAt: z.iso.date(),
});
export const campusActivitySchema = z
  .object({
    savedAnnouncementIds: z.array(campusId).max(500),
    requests: z.array(studentRequestSchema).max(200),
  })
  .refine(
    (value) =>
      new Set(value.savedAnnouncementIds).size ===
        value.savedAnnouncementIds.length &&
      new Set(value.requests.map((r) => r.id)).size === value.requests.length,
    "Duplicate private records",
  );
