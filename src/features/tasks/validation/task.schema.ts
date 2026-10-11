import { z } from "zod";
import { taskInputSchema } from "@/services/validation/task.schema";
export const taskSchema = taskInputSchema;
export type TaskFormValues = z.infer<typeof taskSchema>;
