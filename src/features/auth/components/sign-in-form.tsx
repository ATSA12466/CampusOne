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
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <Input type="email" {...register("email")} />
        {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Password</label>
        <Input type="password" {...register("password")} />
        {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Role (demo switch)</label>
        <Select {...register("role")}>
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
      <div className="flex justify-between text-xs text-slate-600">
        <Link href="/register">Create account</Link>
        <Link href="/forgot-password">Forgot password?</Link>
      </div>
    </form>
  );
}
