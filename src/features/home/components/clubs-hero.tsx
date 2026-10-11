import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/config/app-config";
import { images } from "@/config/images";
export function ClubsHero({ count, priority = true }: { count: number; priority?: boolean }) {
  return (
    <section
      aria-labelledby="home-clubs-title"
      className="relative isolate min-h-[380px] overflow-hidden rounded-media text-on-photo md:min-h-[420px]"
    >
      <CampusImage
        image={images.clubsHero}
        aspect="panorama"
        priority={priority}
        quality={60}
        sizes="(max-width:767px) calc(100vw - 2rem), (max-width:1023px) calc(100vw - 3rem), 720px"
        className="absolute inset-0 h-full w-full"
      />
      <div className="photo-scrim hero-photo-scrim absolute inset-0" aria-hidden="true" />
      <div className="relative flex min-h-[inherit] flex-col justify-between p-6 md:p-8">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase">
          Clubs, societies & good company
        </p>
        <div className="max-w-80">
          <h2
            id="home-clubs-title"
            className="font-display text-[clamp(2.75rem,5vw,4rem)] font-semibold leading-[0.98] tracking-tight"
          >
            Find your
            <br />
            <span className="italic">people.</span>
          </h2>
          <p className="mt-4 max-w-64 text-sm leading-relaxed">
            For the ideas you want to try. And the friends you haven&apos;t met yet.
          </p>
          <Button asChild variant="overlay" className="mt-5">
            <Link prefetch={false} href="/clubs">
              Explore clubs <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <AvatarStack
            people={[
              { name: "Ama", image: images.studentAma },
              { name: "Kojo", image: images.studentKojo },
            ]}
            max={2}
          />
          <div className="text-[10px] leading-relaxed">
            <p>
              {count
                ? `${count} ${appConfig.dataSource === "demo" ? "demo communities to explore" : "communities in this preview"}`
                : "Your community starts here"}
            </p>
            <p>Generated imagery · fictional students</p>
          </div>
        </div>
      </div>
    </section>
  );
}
