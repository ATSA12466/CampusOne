"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button, Input } from "@/components/ui";
import { registerSchema, type RegisterValues } from "../validation/auth.schemas";

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(() => {
        router.push("/sign-in");
      })}
    >
      <div>
        <label htmlFor="auth-name" className="mb-1 block text-sm font-medium">
          Full name
        </label>
        <Input
          id="auth-name"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "auth-name-error" : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <p id="auth-name-error" role="alert" className="mt-1 text-xs text-danger">
            {errors.name.message}
          </p>
        ) : null}
      </div>
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
          autoComplete="new-password"
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
        <label htmlFor="auth-confirmPassword" className="mb-1 block text-sm font-medium">
          Confirm Password
        </label>
        <Input
          id="auth-confirmPassword"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "auth-confirmPassword-error" : undefined}
          type="password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p id="auth-confirmPassword-error" role="alert" className="mt-1 text-xs text-danger">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>
      <Button className="w-full" type="submit">
        Create account (demo)
      </Button>
      <p className="text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="inline-flex min-h-11 min-w-11 items-center text-brand underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
