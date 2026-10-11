"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button, Checkbox, Textarea } from "@/components/ui";
import { Field } from "@/components/ui/field";
import { clubActionService } from "@/services";
import {
  membershipRequestSchema,
  type MembershipRequestValues,
} from "../validation/request.schema";
export function RequestForm({
  name,
  pending,
  onSubmit,
  onCancel,
}: {
  name: string;
  pending: boolean;
  onSubmit: (note: string) => Promise<void>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MembershipRequestValues>({
    resolver: zodResolver(membershipRequestSchema),
    defaultValues: { note: "", acknowledged: false },
    shouldFocusError: true,
  });
  return (
    <form
      onSubmit={handleSubmit(async (values) => onSubmit(values.note))}
      noValidate
      className="space-y-5"
    >
      <Field
        label="A little introduction (optional)"
        id="club-introduction"
        error={errors.note?.message}
        hint="What would you like to try or learn? Up to 400 characters."
      >
        <Textarea
          {...register("note")}
          id="club-introduction"
          aria-invalid={!!errors.note}
          aria-describedby={`club-introduction-hint${errors.note ? " club-introduction-error" : ""}`}
          rows={4}
          disabled={pending}
          placeholder={`I'd love to try a session with ${name}...`}
        />
      </Field>
      <Controller
        control={control}
        name="acknowledged"
        render={({ field }) => (
          <Checkbox
            ref={field.ref}
            id="club-request-acknowledged"
            label={
              clubActionService.source === "demo"
                ? "I understand this request is a local demo, not sent to a real club."
                : "I understand this request will go to the connected club service."
            }
            checked={field.value}
            onCheckedChange={(value) => field.onChange(value === true)}
            aria-invalid={!!errors.acknowledged}
            aria-describedby={errors.acknowledged ? "club-request-ack-error" : undefined}
            disabled={pending}
          />
        )}
      />
      {errors.acknowledged ? (
        <p id="club-request-ack-error" className="text-sm text-danger" role="alert">
          {errors.acknowledged.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving request…" : "Submit membership request"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {pending ? "Cancel request" : "Not now"}
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {clubActionService.source === "demo"
          ? "Requests stay with your current demo profile on this device. Approval here is not official enrollment."
          : "Membership and permission decisions are made by your connected backend."}
      </p>
    </form>
  );
}
