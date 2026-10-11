import { ArrowDown, Compass } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { Button } from "@/components/ui/button";
import { images } from "@/config/images";
export function DiscoverHero() {
  return (
    <section
      className="discover-hero relative isolate overflow-hidden rounded-media text-on-photo"
      aria-labelledby="discover-title"
    >
      <CampusImage
        image={images.campusLife}
        priority
        quality={60}
        aspect="panorama"
        sizes="(max-width:1023px) calc(100vw - 2rem), 1000px"
        className="absolute inset-0 h-full w-full aspect-auto"
      />
      <div
        className="photo-scrim hero-photo-scrim absolute inset-0"
        aria-hidden="true"
      />
      <div className="discover-hero-content relative flex flex-col justify-between gap-8 p-6 md:p-9">
        <p className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase">
          <Compass className="size-4" aria-hidden="true" /> One campus. Plenty
          of possibilities.
        </p>
        <div className="max-w-md">
          <h1
            id="discover-title"
            className="font-display text-[clamp(2.7rem,5vw,4.5rem)] font-semibold leading-[.98] tracking-tight"
          >
            A little
            <br />
            curiosity goes
            <br />
            <span className="italic">a long way.</span>
          </h1>
          <p className="mt-5 max-w-72 text-sm leading-relaxed">
            Your next community, good idea or useful find. Take a look around.
          </p>
          <Button asChild variant="overlay" className="mt-5">
            <a href="#discover-directory">
              Explore campus
              <ArrowDown className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
        <p className="text-[10px]">
          Generated illustration · fictional campus and people, not GCTU
          photographs
        </p>
      </div>
    </section>
  );
}
