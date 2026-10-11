import { z } from "zod";
import { levels } from "@/config/onboarding";
export const profileInputSchema = z
  .object({
    name: z.string().trim().min(2, "Add your preferred name.").max(80),
    programme: z.string().trim().min(2).max(120),
    level: z.enum(levels),
    bio: z.string().trim().max(500),
    interests: z.string().trim().max(240),
    visibility: z.enum(["private", "campus-preview"]),
    showProgramme: z.enum(["yes", "no"]),
  })
  .strict();
