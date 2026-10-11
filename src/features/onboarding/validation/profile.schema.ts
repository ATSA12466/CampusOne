import { z } from "zod";
import { campusInterests, levels, programmes } from "@/config/onboarding";
export const profileSetupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(80, "Use no more than 80 characters")
    .regex(/\p{L}/u, "Use a name containing letters"),
  programme: z.enum(programmes, { error: "Choose a demo programme" }),
  level: z.enum(levels, { error: "Choose a level" }),
  interests: z.array(z.enum(campusInterests)).max(campusInterests.length),
  portrait: z.enum(["initials", "ama", "kojo"]),
});
export type ProfileSetupValues = z.infer<typeof profileSetupSchema>;
