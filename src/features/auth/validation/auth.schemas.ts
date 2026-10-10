import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "club-executive", "committee-member", "src-representative", "administrator"]),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((payload) => payload.password === payload.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
