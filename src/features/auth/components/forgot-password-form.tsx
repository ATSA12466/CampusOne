"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../validation/auth.schemas";
import { EmailField } from "./email-field";
import { ActionFeedback } from "./action-feedback";
import { useAuthAction } from "../hooks/use-auth-action";
import { useAuthService } from "../hooks/use-auth-service";
import type { AuthPreview, ResetResult } from "@/types/auth";
export function ForgotPasswordForm({
  next = "/home",
  preview,
}: {
  next?: string;
  preview?: AuthPreview;
}) {
  const service = useAuthService(preview),
    action = useAuthAction();
  const [result, setResult] = useState<ResetResult | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  return (
    <form
      noValidate
      className="space-y-5"
      aria-busy={action.pending}
      onSubmit={handleSubmit(async (values) => {
        setResult(null);
        const response = await action.run((signal) =>
          service.requestReset(values.email, { signal }),
        );
        if (response) setResult(response);
      })}
    >
      {preview ? (
        <p className="rounded-control bg-warning-soft p-3 text-xs text-warning">
          Development-only {preview} fixture, not email delivery.
        </p>
      ) : null}
      <EmailField {...register("email")} error={errors.email?.message} disabled={action.pending} />
      <ActionFeedback {...action} onCancel={action.cancel} />
      <Button type="submit" className="w-full" disabled={action.pending}>
        {action.pending
          ? "Requesting…"
          : service.source === "demo"
            ? "Preview reset request"
            : "Request reset link"}
      </Button>
      {result ? (
        <div
          role="status"
          className="rounded-card border border-border bg-success-soft p-5 text-success"
        >
          <MailCheck className="mb-3 size-6" aria-hidden="true" />
          <h2 className="font-semibold">
            {result.delivery === "preview"
              ? "Preview complete. No email was sent."
              : "Request accepted."}
          </h2>
          <p className="mt-2 text-sm">
            {result.delivery === "preview"
              ? "Your email format is valid. A real reset link needs a connected email and authentication service."
              : "If an account exists for that address, the backend can send recovery instructions. We cannot verify mailbox delivery here."}
          </p>
        </div>
      ) : null}
      <Link
        prefetch={false}
        href={`/sign-in?next=${encodeURIComponent(next)}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-control text-sm font-semibold text-brand"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to sign in
      </Link>
    </form>
  );
}
