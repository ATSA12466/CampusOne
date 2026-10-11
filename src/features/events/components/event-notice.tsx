import { bookingState } from "@/lib/events/schedule";
import type { EventItem } from "@/types";
const notices = {
  full: "Fully booked. This listing has no places left. Saving the event does not reserve a seat.",
  closed: "The RSVP window has closed. Existing RSVPs can still be removed.",
  ended:
    "This event has ended. New RSVPs and ticket previews are unavailable; existing RSVPs can be removed.",
  cancelled:
    "This event has been cancelled. New RSVPs and ticket previews are unavailable; existing RSVPs can be removed.",
  unknown: "A reliable event schedule is not available. RSVP and ticket actions are unavailable.",
};
export function EventNotice({
  event,
  now,
  count,
  going,
}: {
  event: EventItem;
  now: Date;
  count: number;
  going: boolean;
}) {
  const state = bookingState(event, now, count);
  return state !== "available" && !(going && state === "full") ? (
    <p
      role="status"
      className={`rounded-control border border-border p-4 text-sm leading-relaxed ${state === "cancelled" ? "bg-danger-soft text-danger" : "bg-surface-muted text-muted-foreground"}`}
    >
      {notices[state]}
    </p>
  ) : null;
}
