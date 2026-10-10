import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(2, "Task title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
  category: z.enum(["academic", "personal", "club"]),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
