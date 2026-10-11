"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { registerSchema, type RegisterValues } from "../validation/auth.schemas";
import { EmailField } from "./email-field";
import { PasswordField } from "./password-field";
import { ActionFeedback } from "./action-feedback";
import { StorageNotice } from "./storage-notice";
import { useAuthAction } from "../hooks/use-auth-action";
import { useAuthService } from "../hooks/use-auth-service";
import type { AuthPreview } from "@/types/auth";
export function RegisterForm({
  next = "/home",
  preview,
}: {
  next?: string;
  preview?: AuthPreview;
}) {
  const router = useRouter(),
    service = useAuthService(preview),
    action = useAuthAction();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", consent: false },
  });
  const onSubmit = async (values: RegisterValues) => {
    const session = await action.run((signal) =>
      service.register(
        { name: values.name, email: values.email, password: values.password },
        { signal },
      ),
    );
    if (!session) return;
    useAuthStore.getState().setSession(session);
    useOnboardingStore.getState().resetOnboarding();
    router.replace(`/onboarding?next=${encodeURIComponent(next)}`);
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
          Development-only {preview} fixture, not a real registration.
        </p>
      ) : null}
      <Field id="auth-name" label="Full name" required error={errors.name?.message}>
        <Input
          id="auth-name"
          autoComplete="name"
          placeholder="e.g. Kwame Mensah"
          maxLength={80}
          {...register("name")}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "auth-name-error" : undefined}
          disabled={action.pending}
        />
      </Field>
      <EmailField {...register("email")} error={errors.email?.message} disabled={action.pending} />
      <PasswordField
        {...register("password")}
        autoComplete="new-password"
        hint="Use 8–128 characters. Use a made-up preview password, never your campus password."
        error={errors.password?.message}
        disabled={action.pending}
      />
      <PasswordField
        id="auth-confirmPassword"
        label="Confirm password"
        {...register("confirmPassword")}
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        disabled={action.pending}
      />
      <div>
        <Controller
          name="consent"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="auth-consent"
              label="I understand the preview notice"
              name={field.name}
              checked={field.value}
              onCheckedChange={(value) => field.onChange(value === true)}
              aria-invalid={!!errors.consent}
              aria-describedby={errors.consent ? "auth-consent-error" : undefined}
              disabled={action.pending}
            />
          )}
        />
        {errors.consent ? (
          <p id="auth-consent-error" role="alert" className="mt-1 text-sm text-danger">
            {errors.consent.message}
          </p>
        ) : null}
        <a
          href="#preview-notice"
          className="inline-flex min-h-11 items-center rounded-control text-xs text-muted-foreground underline underline-offset-4"
        >
          Read how this preview handles your data
        </a>
      </div>
      <ActionFeedback {...action} onCancel={action.cancel} />
      <Button type="submit" className="w-full" disabled={action.pending}>
        {action.pending
          ? "Creating your preview…"
          : service.source === "demo"
            ? "Create account (demo)"
            : "Create account"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Already have a profile?{" "}
        <Link
          prefetch={false}
          href={`/sign-in?next=${encodeURIComponent(next)}`}
          className="inline-flex min-h-11 items-center rounded-control font-semibold text-brand"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
