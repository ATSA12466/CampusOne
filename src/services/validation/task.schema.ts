import { z } from "zod";
import { recordIdSchema } from "./owned-media.schema";
export const taskInputSchema = z.object({
  title: z.string().trim().min(2, "Task title is required").max(120),
  description: z.string().trim().max(2000).optional(),
  dueDate: z
    .union([z.literal(""), z.iso.date({ error: "Choose a real due date." })])
    .optional(),
  priority: z.enum(["low", "medium", "high"]),
  category: z.enum(["academic", "personal", "club"]),
});
export const taskRecordSchema = taskInputSchema.extend({
  id: recordIdSchema,
  completed: z.boolean(),
});
