import { z } from "zod";
import { authRoles } from "@/config/auth";
const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email")
  .max(254, "Email is too long")
  .email("Enter a valid email");
const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use no more than 128 characters");
export const signInSchema = z.object({
  email,
  password,
  role: z.enum(authRoles),
  remember: z.boolean(),
});
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter your name")
      .max(80, "Use no more than 80 characters")
      .regex(/\p{L}/u, "Use a name containing letters"),
    email,
    password,
    confirmPassword: z.string().max(128),
    consent: z
      .boolean()
      .refine((value) => value, "Confirm that you understand how this preview works"),
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });
export const forgotPasswordSchema = z.object({ email });
export type SignInValues = z.infer<typeof signInSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
