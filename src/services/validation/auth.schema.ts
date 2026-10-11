import { z } from "zod";
import { authRoles } from "@/config/auth";
import { isAllowedImageSrc } from "@/config/image-policy";
import type { UserProfile } from "@/types/common";
export const userProfileSchema: z.ZodType<UserProfile> = z.object({
  id: z.string().min(1).max(100),
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(254),
  role: z.enum(authRoles),
  programme: z.string().max(120),
  level: z.string().max(40),
  avatar: z
    .string()
    .refine(
      (value) => !value.startsWith("blob:") && isAllowedImageSrc(value),
      "Unapproved profile image",
    )
    .optional(),
});
export const authResponseSchema = z.object({ user: userProfileSchema });
export const sessionResponseSchema = z.object({ user: userProfileSchema.nullable() });
export const resetResponseSchema = z.object({ accepted: z.literal(true) });
