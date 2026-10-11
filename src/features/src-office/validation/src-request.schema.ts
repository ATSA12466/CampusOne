import { z } from "zod";
import { requestInputSchema } from "@/services/validation/campus-operations.schema";
export const srcRequestSchema = requestInputSchema;
export type SrcRequestValues = z.infer<typeof srcRequestSchema>;
