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
    <form className="space-y-4" onSubmit={handleSubmit(() => undefined)}>
      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <Input type="email" {...register("email")} />
        {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
      </div>
      <Button className="w-full" type="submit">
        Send reset link (demo)
      </Button>
      {isSubmitSuccessful ? (
        <p className="rounded-xl bg-emerald-50 p-2 text-xs text-emerald-700">Demo confirmation shown. Backend email service will be integrated later.</p>
      ) : null}
      <Link href="/sign-in" className="block text-xs text-slate-600">
        Back to sign in
      </Link>
    </form>
  );
}
