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
      className="space-y-4"
      onSubmit={handleSubmit(() => {
        router.push("/sign-in");
      })}
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Full name</label>
        <Input {...register("name")} />
        {errors.name ? <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <Input type="email" {...register("email")} />
        {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Password</label>
        <Input type="password" {...register("password")} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Confirm Password</label>
        <Input type="password" {...register("confirmPassword")} />
        {errors.confirmPassword ? <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p> : null}
      </div>
      <Button className="w-full" type="submit">
        Create account (demo)
      </Button>
      <p className="text-xs text-slate-600">
        Already have an account? <Link href="/sign-in" className="text-blue-700">Sign in</Link>
      </p>
    </form>
  );
}
