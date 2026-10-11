import { bookingState, eventPhase } from "@/lib/events/schedule";
import type { EventItem } from "@/types";
export const bookingLabel = {
  available: "RSVP",
  full: "Fully booked",
  closed: "RSVP closed",
  ended: "Event ended",
  cancelled: "Cancelled",
  unknown: "Schedule unavailable",
};
export function EventState({
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
  const state = bookingState(event, now, count),
    phase = eventPhase(event, now);
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${state === "cancelled" ? "bg-danger-soft text-danger" : going ? "bg-success-soft text-success" : state === "available" ? "bg-brand-soft text-brand" : "bg-surface-muted text-muted-foreground"}`}
    >
      {state === "cancelled"
        ? "Cancelled"
        : going
          ? `RSVP saved${phase === "ended" ? " · past event" : ""}`
          : phase === "live"
            ? "Happening now"
            : state === "available"
              ? "Open for RSVPs"
              : bookingLabel[state]}
    </span>
  );
}
