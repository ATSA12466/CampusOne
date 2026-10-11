import { Gallery } from "@/components/media/gallery";
import { eventGallery } from "@/lib/events/media";
import { agendaTime } from "@/lib/events/schedule";
import { appConfig } from "@/config/app-config";
import type { EventItem } from "@/types";
export function EventDetailStories({ event }: { event: EventItem }) {
  const details = event.details;
  return (
    <article className="min-w-0 space-y-8">
      <section aria-labelledby="event-story">
        <p className="text-[10px] font-bold tracking-widest text-brand uppercase">
          A plan worth making room for
        </p>
        <h2 id="event-story" className="mt-2 font-display text-2xl font-semibold md:text-3xl">
          What&apos;s the plan?
        </h2>
        <div className="mt-4 max-w-prose space-y-4 text-sm leading-7 text-muted-foreground">
          {(
            details?.description ?? [
              "The publisher has not supplied a detailed programme, precise time or entry price. The available date, venue and capacity are shown above.",
            ]
          ).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </section>
      {details?.highlights.length ? (
        <section aria-labelledby="event-highlights">
          <h2 id="event-highlights" className="font-display text-xl font-semibold">
            A few things to look forward to.
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {details.highlights.map((highlight, index) => (
              <li key={highlight} className="rounded-control border border-border bg-surface p-4">
                <span className="text-xs font-semibold text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-2 text-sm font-semibold leading-relaxed">{highlight}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {details?.agenda.length ? (
        <section aria-labelledby="event-agenda">
          <h2 id="event-agenda" className="font-display text-xl font-semibold">
            A little shape to the day.
          </h2>
          <ol className="mt-4 divide-y divide-border rounded-media border border-border bg-surface px-5">
            {details.agenda.map((item, index) => (
              <li
                key={`${item.startsAt}:${index}`}
                className="grid gap-2 py-5 sm:grid-cols-[90px_minmax(0,1fr)]"
              >
                <p className="text-xs font-semibold text-brand">
                  <time dateTime={item.startsAt}>{agendaTime(event, item.startsAt)}</time>
                </p>
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[10px] text-muted-foreground">
            Times are in Africa/Accra (GMT).{" "}
            {appConfig.dataSource === "demo"
              ? "This programme is fictional."
              : "Confirm changes with its publisher."}
          </p>
        </section>
      ) : null}
      {details ? (
        <section aria-labelledby="event-hosts">
          <h2 id="event-hosts" className="font-display text-xl font-semibold">
            The people behind the plan.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Hosted by <span className="font-semibold text-foreground">{details.organizer}</span>
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {details.speakers.map((person, index) => (
              <li
                key={`${person.name}:${index}`}
                className="rounded-control border border-border bg-surface p-4"
              >
                <h3 className="text-sm font-semibold">{person.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{person.role}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {details?.accessibility.length ? (
        <section aria-labelledby="event-access">
          <h2 id="event-access" className="font-display text-xl font-semibold">
            Before you head over.
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {details.accessibility.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {details?.gallery.length ? (
        <section aria-labelledby="event-gallery">
          <h2 id="event-gallery" className="mb-4 font-display text-xl font-semibold">
            A glimpse of the atmosphere.
          </h2>
          <Gallery images={eventGallery(event)} label={`${event.title} gallery`} />
          <p className="mt-3 text-[10px] text-muted-foreground">
            {appConfig.dataSource === "demo"
              ? "Generated fictional scenes, not photographs of this event."
              : "Photos supplied with this listing; registered demo images remain illustrative."}
          </p>
        </section>
      ) : null}
    </article>
  );
}
