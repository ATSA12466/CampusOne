import { CalendarDays } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { eventCover } from "@/lib/events/media";
import { eventDate } from "@/lib/events/schedule";
import type { EventItem } from "@/types";
import { SaveEventButton } from "./save-event-button";
export function EventDetailHero({
  event,
  saved,
  disabled,
  onSave,
}: {
  event: EventItem;
  saved: boolean;
  disabled: boolean;
  onSave: () => void;
}) {
  const cover = eventCover(event);
  return (
    <section
      className="event-hero relative isolate overflow-hidden rounded-media text-on-photo"
      aria-labelledby="event-detail-title"
    >
      <CampusImage
        image={cover}
        priority
        quality={60}
        aspect="panorama"
        sizes="(max-width:1023px) calc(100vw - 2rem), 1000px"
        className="absolute inset-0 h-full w-full aspect-auto"
      />
      <div className="photo-scrim hero-photo-scrim absolute inset-0" aria-hidden="true" />
      <SaveEventButton
        name={event.title}
        saved={saved}
        disabled={disabled}
        onSave={onSave}
        overlay
      />
      <div className="event-hero-content relative flex flex-col justify-end p-6 md:p-9">
        <p className="text-[10px] font-bold tracking-widest uppercase">{event.category}</p>
        <h1
          id="event-detail-title"
          className="mt-3 max-w-lg font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.05] tracking-tight"
        >
          {event.title}
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed">
          {event.details?.tagline ??
            "Explore this campus event. Detailed programme information has not been supplied."}
        </p>
        <p className="mt-5 flex items-center gap-2 text-xs">
          <CalendarDays className="size-4" aria-hidden="true" />
          {eventDate(event)}
        </p>
        <p className="mt-5 max-w-sm text-[10px]">
          {!event.details
            ? "Illustrative generated cover · no event photograph supplied"
            : cover.provenance === "generated"
              ? "Generated demo scene · not an actual event photograph"
              : "Photograph supplied by its publisher"}
        </p>
      </div>
    </section>
  );
}
