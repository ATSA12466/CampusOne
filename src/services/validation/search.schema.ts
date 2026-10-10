import { z } from "zod";
export const searchQuerySchema = z.object({
  query: z.string().trim().max(100),
  scope: z
    .enum([
      "all",
      "destinations",
      "clubs",
      "events",
      "resources",
      "accommodation",
      "marketplace",
      "opportunities",
      "announcements",
    ])
    .default("all"),
  limit: z.number().int().min(1).max(30).default(18),
});
