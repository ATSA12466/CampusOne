import { z } from "zod";
export const listQuerySchema = z.object({
  search: z.string().trim().max(160).default(""),
  category: z.string().trim().max(80).default("all"),
  sort: z.enum(["title", "newest"]).default("title"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(30).default(18),
});
