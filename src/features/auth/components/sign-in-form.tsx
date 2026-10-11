"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useAuthStore } from "@/stores/auth-store";
import { signInSchema, type SignInValues } from "../validation/auth.schemas";
import { EmailField } from "./email-field";
import { PasswordField } from "./password-field";
import { ActionFeedback } from "./action-feedback";
import { StorageNotice } from "./storage-notice";
import { useAuthAction } from "../hooks/use-auth-action";
import { useAuthService } from "../hooks/use-auth-service";
import type { AuthPreview } from "@/types/auth";
export function SignInForm({ next = "/home", preview }: { next?: string; preview?: AuthPreview }) {
  const router = useRouter(),
    service = useAuthService(preview),
    action = useAuthAction();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: service.source === "demo" ? "ama.nyarko@campusone.demo" : "",
      password: service.source === "demo" ? "campusone-demo" : "",
      role: "student",
      remember: true,
    },
  });
  const onSubmit = async (values: SignInValues) => {
    const session = await action.run((signal) => service.signIn(values, { signal }));
    if (!session) return;
    useAuthStore.getState().setSession(session, values.remember);
    router.replace(
      useOnboardingStore.getState().completed
        ? next
        : `/onboarding?next=${encodeURIComponent(next)}`,
    );
  };
  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      aria-busy={action.pending}
    >
      <StorageNotice />
      {preview ? (
        <p className="rounded-control bg-warning-soft p-3 text-xs text-warning">
          Development-only {preview} fixture, not real authentication.
        </p>
      ) : null}
      <EmailField {...register("email")} error={errors.email?.message} disabled={action.pending} />
      <PasswordField
        {...register("password")}
        autoComplete="current-password"
        error={errors.password?.message}
        disabled={action.pending}
      />
      {service.source === "demo" ? (
        <Field
          id="auth-role"
          label="Role (demo switch)"
          hint="Preview only. Choosing a role does not grant university authority."
        >
          <Select
            id="auth-role"
            {...register("role")}
            disabled={action.pending}
            aria-describedby="auth-role-hint"
          >
            <option value="student">Student</option>
            <option value="club-executive">Club Executive</option>
            <option value="committee-member">Committee Member</option>
            <option value="src-representative">SRC Representative</option>
            <option value="administrator">Administrator</option>
          </Select>
        </Field>
      ) : null}
      {service.source === "demo" ? (
        <Controller
          name="remember"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Remember this demo profile on this device"
              name={field.name}
              checked={field.value}
              onCheckedChange={(value) => field.onChange(value === true)}
              disabled={action.pending}
            />
          )}
        />
      ) : null}
      <ActionFeedback {...action} onCancel={action.cancel} />
      <Button type="submit" className="w-full" disabled={action.pending}>
        {action.pending ? "Signing in…" : service.source === "demo" ? "Sign in (demo)" : "Sign in"}
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link
          prefetch={false}
          href={`/register?next=${encodeURIComponent(next)}`}
          className="inline-flex min-h-11 items-center rounded-control font-semibold text-brand"
        >
          Create account
        </Link>
        <Link
          prefetch={false}
          href={`/forgot-password?next=${encodeURIComponent(next)}`}
          className="inline-flex min-h-11 items-center rounded-control text-muted-foreground underline underline-offset-4"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
