import { ArrowDown, Sparkles, Users } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar";
import { images } from "@/config/images";
import { appConfig } from "@/config/app-config";
export function DirectoryHero({ count }: { count?: number }) {
  return (
    <section
      className="club-hero relative isolate overflow-hidden rounded-media text-on-photo"
      aria-labelledby="clubs-title"
    >
      <CampusImage
        image={images.clubsHero}
        aspect="panorama"
        priority
        quality={60}
        sizes="(max-width:1023px) calc(100vw - 2rem), 1000px"
        className="absolute inset-0 h-full w-full aspect-auto"
      />
      <div className="photo-scrim hero-photo-scrim absolute inset-0" aria-hidden="true" />
      <div className="club-hero-content relative flex flex-col justify-between gap-8 p-6 md:p-9">
        <div className="flex items-center justify-between gap-3 text-[10px] font-bold tracking-widest uppercase">
          <span>Campus communities</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-4" aria-hidden="true" />A place to belong
          </span>
        </div>
        <div className="max-w-sm">
          <h1
            id="clubs-title"
            className="font-display text-[clamp(2.75rem,5vw,4.5rem)] font-semibold leading-[.98] tracking-tight"
          >
            Find your
            <br />
            <span className="italic">people.</span>
          </h1>
          <p className="mt-4 max-w-72 text-sm leading-relaxed">
            For the ideas you want to try. And the friends you haven&apos;t met yet.
          </p>
          <Button asChild variant="overlay" className="mt-5">
            <a href="#club-directory">
              Explore the communities <ArrowDown className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AvatarStack
            people={[
              { name: "Ama", image: images.studentAma },
              { name: "Kojo", image: images.studentKojo },
            ]}
            max={2}
          />
          <div className="text-xs">
            <p className="flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden="true" />
              {count === undefined
                ? "A place for your next good hello"
                : `${count} ${appConfig.dataSource === "demo" ? "fictional demo communities" : "communities"}`}
            </p>
            <p className="mt-1 text-[10px]">Generated imagery · not actual campus photos</p>
          </div>
        </div>
      </div>
    </section>
  );
}
