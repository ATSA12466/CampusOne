"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button, Checkbox } from "@/components/ui";
import { eventActionService } from "@/services";
import { rsvpSchema, type RsvpValues } from "../validation/rsvp.schema";
export function RsvpForm({
  pending,
  onSubmit,
  onCancel,
}: {
  pending: boolean;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RsvpValues>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: { acknowledged: false },
    shouldFocusError: true,
  });
  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Controller
        control={control}
        name="acknowledged"
        render={({ field }) => (
          <Checkbox
            ref={field.ref}
            id="event-rsvp-acknowledged"
            label={
              eventActionService.source === "demo"
                ? "I understand this is a local demo RSVP, not a real event booking."
                : "I understand this RSVP is managed by the connected event service; no payment is taken here."
            }
            checked={field.value}
            onCheckedChange={(value) => field.onChange(value === true)}
            aria-invalid={!!errors.acknowledged}
            aria-describedby={errors.acknowledged ? "event-rsvp-ack-error" : undefined}
            disabled={pending}
          />
        )}
      />
      {errors.acknowledged ? (
        <p id="event-rsvp-ack-error" className="text-sm text-danger" role="alert">
          {errors.acknowledged.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving RSVP…"
            : eventActionService.source === "demo"
              ? "Confirm demo RSVP"
              : "Confirm RSVP"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {pending ? "Stop waiting" : "Not now"}
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {eventActionService.source === "demo"
          ? "Your plan stays with the current demo profile on this device. It does not reserve a real place or collect a fee."
          : "Admission and capacity are managed by the backend; no listed fee is collected here. Stopping a pending wait does not undo a request already accepted by the service. Reopen the listing to check."}
      </p>
    </form>
  );
}
