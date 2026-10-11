import { ArrowDown, CalendarDays, Sparkles } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { Button } from "@/components/ui/button";
import { images } from "@/config/images";
import { appConfig } from "@/config/app-config";
export function EventDirectoryHero({ count }: { count?: number }) {
  return (
    <section
      className="event-hero relative isolate overflow-hidden rounded-media text-on-photo"
      aria-labelledby="events-title"
    >
      <CampusImage
        image={images.eventSocial}
        priority
        quality={60}
        aspect="panorama"
        sizes="(max-width:1023px) calc(100vw - 2rem), 1000px"
        className="absolute inset-0 h-full w-full aspect-auto"
      />
      <div className="photo-scrim hero-photo-scrim absolute inset-0" aria-hidden="true" />
      <div className="event-hero-content relative flex flex-col justify-between gap-7 p-6 md:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold tracking-widest uppercase">
          <span>Beyond the lecture hall</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-4" aria-hidden="true" />A little more campus life
          </span>
        </div>
        <div className="max-w-md">
          <h1
            id="events-title"
            className="font-display text-[clamp(2.75rem,5vw,4.5rem)] font-semibold leading-[.98] tracking-tight"
          >
            Find your
            <br />
            next good
            <br />
            <span className="italic">plan.</span>
          </h1>
          <p className="mt-4 max-w-72 text-sm leading-relaxed">
            For the ideas, the music and the people you haven&apos;t met yet.
          </p>
          <Button asChild variant="overlay" className="mt-5">
            <a href="#event-directory">
              Explore what&apos;s on
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
        <div className="text-xs">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4" aria-hidden="true" />
            {count === undefined
              ? "Make room for something new"
              : `${count} ${appConfig.dataSource === "demo" ? "fictional demo events" : "listed events"}`}
          </p>
          <p className="mt-2 text-[10px]">
            Generated illustration · not an actual campus gathering
          </p>
        </div>
      </div>
    </section>
  );
}
