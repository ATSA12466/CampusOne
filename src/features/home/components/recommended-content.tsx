import Link from "next/link";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { appConfig } from "@/config/app-config";
import { images } from "@/config/images";
import { relativeCampusDay } from "@/lib/home/schedule";
import type { EventItem, Opportunity } from "@/types/engagement";
export function RecommendedContent({
  events,
  opportunities,
  now,
}: {
  events: readonly EventItem[];
  opportunities: readonly Opportunity[];
  now: Date;
}) {
  const event = events[0];
  return (
    <section aria-labelledby="home-next-title" className="home-recommendations">
      <div className="mb-4">
        <p className="mb-1 text-[10px] font-bold tracking-[0.16em] text-brand uppercase">
          Good things ahead
        </p>
        <h2 id="home-next-title" className="font-display text-2xl font-semibold">
          Something to look forward to.
        </h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {event ? (
          <Link
            prefetch={false}
            href={`/events/${encodeURIComponent(event.id)}`}
            className="group overflow-hidden rounded-card border border-border bg-surface shadow-card"
          >
            <div className="relative">
              <CampusImage
                image={images.innovationNight}
                aspect="video"
                sizes="(max-width:767px) calc(100vw - 2rem), 500px"
                imageClassName="media-zoom"
              />
              <span className="absolute bottom-3 left-3 rounded-full bg-nav/85 px-2.5 py-1 text-[10px] text-on-photo">
                Generated demo event imagery
              </span>
            </div>
            <div className="p-5">
              <p className="mb-2 text-[10px] font-bold tracking-wide text-brand uppercase">
                Coming up · {event.category}
              </p>
              <h3 className="font-display text-2xl font-semibold">{event.title}</h3>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {relativeCampusDay(event.date, now)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" aria-hidden="true" />
                  {event.venue}
                </span>
              </div>
              <span className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-brand">
                See what&apos;s happening
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ) : (
          <div className="rounded-card border border-dashed border-border bg-surface p-6">
            <h3 className="font-display text-xl">Your next campus moment.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No upcoming events in this feed yet. Find something new in Discover.
            </p>
            <Link
              prefetch={false}
              href="/discover"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-brand"
            >
              Explore Discover
            </Link>
          </div>
        )}
        <div className="rounded-card border border-border bg-surface p-5 shadow-card md:p-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-2xl font-semibold">Your next chapter.</h3>
            <Link
              prefetch={false}
              href="/opportunities"
              className="-m-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-[11px] font-semibold text-brand"
            >
              View all <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <p className="mb-5 text-xs text-muted-foreground">
            A few doors worth opening.{" "}
            {appConfig.dataSource === "demo" ? "Demo opportunities, sorted" : "Sorted"} by deadline.
          </p>
          <div className="space-y-3">
            {opportunities.length ? (
              opportunities.slice(0, 3).map((item) => (
                <Link
                  prefetch={false}
                  href={`/opportunities/${encodeURIComponent(item.id)}`}
                  key={item.id}
                  className="group flex min-h-24 items-center gap-4 rounded-control border border-border p-4 transition-colors hover:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold text-brand">{item.category}</p>
                    <h4 className="mt-1 text-sm font-semibold">{item.title}</h4>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {item.provider} · Closes {relativeCampusDay(item.deadline, now)}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No open opportunities in this feed. New ones will appear here when published.
              </p>
            )}
          </div>
          <p className="mt-5 text-[10px] text-muted-foreground">
            Check requirements with the provider. This prototype does not verify offers.
          </p>
        </div>
      </div>
    </section>
  );
}
