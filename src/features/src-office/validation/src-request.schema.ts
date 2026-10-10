import { z } from "zod";

export const srcRequestSchema = z.object({
  title: z.string().min(3, "Request title is required"),
  category: z.enum(["Academic support", "Welfare", "Infrastructure"]),
  description: z.string().min(10, "Please add enough context for review"),
});

export type SrcRequestValues = z.infer<typeof srcRequestSchema>;
