import { useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { eventActionService } from "@/services";
import type { EventItem } from "@/types";
import type { EventMutations } from "../hooks/use-event-mutations";
export function CancelRsvpDialog({
  event,
  action,
  onClose,
}: {
  event: EventItem;
  action: EventMutations;
  onClose: () => void;
}) {
  const returnTo = useRef<HTMLElement | null>(
      typeof document === "undefined"
        ? null
        : (document.activeElement as HTMLElement | null),
    ),
    close = () => {
      action.cancel();
      onClose();
    };
  return (
    <Dialog
      title={`Cancel your RSVP to ${event.title}?`}
      description={
        eventActionService.source === "demo"
          ? "This removes the RSVP and ticket preview from your current local demo profile. It does not cancel a real booking."
          : "This asks the connected event service to remove your RSVP and revoke its ticket."
      }
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
      returnFocusRef={returnTo}
      fallbackFocusSelector=".event-detail-actions, #event-directory-title"
    >
      <div className="flex flex-wrap gap-2">
        <Button
          variant="danger"
          disabled={!!action.busy}
          onClick={async () => {
            if (
              await action.run(
                `cancel:${event.id}`,
                (signal) =>
                  eventActionService.rsvp(event.id, false, { signal }),
                "RSVP cancelled",
              )
            )
              onClose();
          }}
        >
          {action.busy ? "Cancelling…" : "Cancel RSVP"}
        </Button>
        <Button variant="secondary" onClick={close}>
          {action.busy ? "Stop waiting" : "Keep my RSVP"}
        </Button>
      </div>
      {eventActionService.source === "api" ? (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Closing this dialog only stops waiting. It cannot undo a cancellation
          already accepted by the service. Reopen the listing to check your
          RSVP.
        </p>
      ) : null}
      {action.error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {action.error}
        </p>
      ) : null}
    </Dialog>
  );
}
