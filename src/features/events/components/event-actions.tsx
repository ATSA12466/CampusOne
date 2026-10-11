import Link from "next/link";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eventActionService } from "@/services";
import { bookingState, countdown, eventPhase } from "@/lib/events/schedule";
import type { EventItem } from "@/types";
import { EventState, bookingLabel } from "./event-state";
import { CalendarButton } from "./calendar-button";
export function EventActions({
  event,
  now,
  count,
  going,
  ready,
  busy,
  user,
  onRsvp,
  onCancel,
  onTicket,
}: {
  event: EventItem;
  now: Date;
  count: number;
  going: boolean;
  ready: boolean;
  busy: boolean;
  user: boolean;
  onRsvp: () => void;
  onCancel: () => void;
  onTicket: () => void;
}) {
  const state = bookingState(event, now, count),
    phase = eventPhase(event, now),
    ticketAllowed = !["ended", "cancelled", "unknown"].includes(phase);
  return (
    <aside
      className="event-detail-actions rounded-media border border-border bg-surface-raised p-4 shadow-raised"
      aria-label="Event actions"
      tabIndex={-1}
    >
      <div className="hidden lg:block">
        <p className="text-[10px] font-bold tracking-widest text-brand uppercase">Make it a plan</p>
        <h2 className="mt-2 font-display text-2xl font-semibold">A little time for you.</h2>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {count} / {event.seats} registered
        </p>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 lg:mt-4">
        <EventState event={event} now={now} count={count} going={going} />
        <p className="text-[10px] font-medium text-muted-foreground" data-testid="event-countdown">
          {countdown(event, now)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {!user ? (
          <Button asChild>
            <Link href="/login">Sign in to RSVP</Link>
          </Button>
        ) : going ? (
          <>
            <Button disabled={!ready || busy || !ticketAllowed} onClick={onTicket}>
              <Ticket className="size-4" aria-hidden="true" />
              {eventActionService.source === "demo" ? "Demo ticket" : "View ticket"}
            </Button>
            <Button variant="ghost" disabled={!ready || busy} onClick={onCancel}>
              Cancel RSVP
            </Button>
          </>
        ) : (
          <Button disabled={!ready || busy || state !== "available"} onClick={onRsvp}>
            {busy ? "Updating…" : bookingLabel[state]}
          </Button>
        )}
        <div className={going ? "col-span-2 lg:col-span-1" : "contents"}>
          <CalendarButton event={event} />
        </div>
      </div>
      <p className="mt-4 hidden text-xs leading-relaxed text-muted-foreground lg:block">
        {eventActionService.source === "demo"
          ? "Local demo only. No real place is reserved, payment collected or entry ticket issued."
          : "Your organizer manages admission and ticket access. No payment is taken here."}
      </p>
    </aside>
  );
}
