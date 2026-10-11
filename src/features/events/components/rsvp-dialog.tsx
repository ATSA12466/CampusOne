import { useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import { eventActionService } from "@/services";
import { eventDate, eventTime } from "@/lib/events/schedule";
import { eventPrice } from "@/lib/events/media";
import type { EventItem } from "@/types";
import type { EventMutations } from "../hooks/use-event-mutations";
import { RsvpForm } from "./rsvp-form";
export function RsvpDialog({
  event,
  action,
  onClose,
}: {
  event: EventItem;
  action: EventMutations;
  onClose: () => void;
}) {
  const returnTo = useRef<HTMLElement | null>(
    typeof document === "undefined" ? null : (document.activeElement as HTMLElement | null),
  );
  const close = () => {
    action.cancel();
    onClose();
  };
  return (
    <Dialog
      title={`RSVP to ${event.title}`}
      description="Make a little room in your calendar. Review the details before saving your plan."
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
      returnFocusRef={returnTo}
      fallbackFocusSelector=".event-detail-actions, #event-directory-title"
    >
      <div className="mb-5 rounded-control border border-border bg-surface-muted p-4 text-sm">
        <p className="font-semibold">{eventDate(event)}</p>
        <p className="mt-1 text-muted-foreground">
          {eventTime(event)} · {event.venue}
        </p>
        <p className="mt-2 text-xs font-semibold">{eventPrice(event)}</p>
        {event.details && event.details.price > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Listed fee only. No payment will be collected or simulated.
          </p>
        ) : null}
      </div>
      <RsvpForm
        pending={!!action.busy}
        onCancel={close}
        onSubmit={async () => {
          if (
            await action.run(
              `rsvp:${event.id}`,
              (signal) => eventActionService.rsvp(event.id, true, { signal }),
              eventActionService.source === "demo" ? "Demo RSVP saved" : "RSVP saved",
            )
          )
            onClose();
        }}
      />
      {action.error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {action.error}
        </p>
      ) : null}
    </Dialog>
  );
}
