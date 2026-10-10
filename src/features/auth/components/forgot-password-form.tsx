"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button, Input } from "@/components/ui";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../validation/auth.schemas";

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit(() => undefined)}>
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
      <Button className="w-full" type="submit">
        Send reset link (demo)
      </Button>
      {isSubmitSuccessful ? (
        <p className="rounded-xl bg-success-soft p-2 text-xs text-success">
          Demo confirmation shown. Backend email service will be integrated later.
        </p>
      ) : null}
      <Link
        href="/sign-in"
        className="inline-flex min-h-11 items-center text-xs text-brand underline underline-offset-4"
      >
        Back to sign in
      </Link>
    </form>
  );
}
