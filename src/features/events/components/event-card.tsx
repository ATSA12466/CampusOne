import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { Button } from "@/components/ui/button";
import { eventCover, eventPrice } from "@/lib/events/media";
import { bookingState, eventDate } from "@/lib/events/schedule";
import type { EventItem } from "@/types";
import { SaveEventButton } from "./save-event-button";
import { EventState, bookingLabel } from "./event-state";
export function EventCard({
  event,
  now,
  count,
  going,
  saved,
  ready,
  busy,
  onSave,
  onRsvp,
}: {
  event: EventItem;
  now: Date;
  count: number;
  going: boolean;
  saved: boolean;
  ready: boolean;
  busy: boolean;
  onSave: () => void;
  onRsvp: () => void;
}) {
  const state = bookingState(event, now, count),
    cover = eventCover(event);
  return (
    <article
      className="group overflow-hidden rounded-media border border-border bg-surface shadow-low"
      aria-label={event.title}
    >
      <div className="relative">
        <Link
          prefetch={false}
          href={`/events/${encodeURIComponent(event.id)}`}
          aria-label={`View ${event.title}`}
          className="block"
        >
          <CampusImage
            image={cover}
            className="rounded-b-none"
            sizes="(max-width:639px) calc(100vw - 2rem), (max-width:1279px) 45vw, 320px"
            imageClassName="motion-safe:group-hover:scale-[1.025] transition-transform"
          />
        </Link>
        <SaveEventButton
          name={event.title}
          saved={saved}
          disabled={!ready || busy}
          onSave={onSave}
          overlay
        />
        <span className="absolute bottom-3 left-3 rounded-full bg-nav/85 px-2.5 py-1 text-[10px] font-semibold text-on-photo">
          {cover.provenance === "generated"
            ? "Generated illustration"
            : !event.details
              ? "Illustrative cover"
              : "Publisher photo"}
        </span>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-bold tracking-widest text-brand uppercase">
            {event.category}
          </p>
          <EventState event={event} now={now} count={count} going={going} />
        </div>
        <h3 className="font-display text-xl font-semibold leading-tight">
          <Link
            prefetch={false}
            href={`/events/${encodeURIComponent(event.id)}`}
            className="inline-flex min-h-11 items-center rounded-control hover:text-brand"
          >
            {event.title}
          </Link>
        </h3>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <CalendarDays className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {eventDate(event)}
        </p>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {event.venue}
        </p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="size-3.5" aria-hidden="true" />
          {count} / {event.seats} registered
        </p>
        <p className="text-xs font-semibold">{eventPrice(event)}</p>
        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          <Button asChild variant="secondary" size="sm">
            <Link prefetch={false} href={`/events/${encodeURIComponent(event.id)}`}>
              {going ? "My RSVP & details" : "Details"}
            </Link>
          </Button>
          {!going ? (
            <Button size="sm" disabled={!ready || busy || state !== "available"} onClick={onRsvp}>
              {bookingLabel[state]}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
