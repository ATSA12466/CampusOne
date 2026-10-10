"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button, Input, Select } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useAuthStore } from "@/stores/auth-store";
import { signInSchema, type SignInValues } from "../validation/auth.schemas";

export function SignInForm() {
  const router = useRouter();
  const signInDemo = useAuthStore((state) => state.signInDemo);
  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "student@campusone.demo", password: "123456", role: "student" },
  });

  const onSubmit = async (values: SignInValues) => {
    signInDemo(values.role);
    completeOnboarding();
    router.push("/home");
  };

  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="auth-email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <Input
          id="auth-email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "auth-email-error" : undefined}
          type="email"
          {...register("email")}
        />
        {errors.email ? (
          <p id="auth-email-error" role="alert" className="mt-1 text-xs text-danger">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="auth-password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <Input
          id="auth-password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "auth-password-error" : undefined}
          type="password"
          {...register("password")}
        />
        {errors.password ? (
          <p id="auth-password-error" role="alert" className="mt-1 text-xs text-danger">
            {errors.password.message}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="auth-role" className="mb-1 block text-sm font-medium">
          Role (demo switch)
        </label>
        <Select id="auth-role" {...register("role")}>
          <option value="student">Student</option>
          <option value="club-executive">Club Executive</option>
          <option value="committee-member">Committee Member</option>
          <option value="src-representative">SRC Representative</option>
          <option value="administrator">Administrator</option>
        </Select>
      </div>
      <Button className="w-full" type="submit" disabled={isSubmitting}>
        Sign in (demo)
      </Button>
      <div className="flex justify-between text-xs text-muted-foreground">
        <Link
          href="/register"
          className="inline-flex min-h-11 items-center underline underline-offset-4"
        >
          Create account
        </Link>
        <Link
          href="/forgot-password"
          className="inline-flex min-h-11 items-center underline underline-offset-4"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
