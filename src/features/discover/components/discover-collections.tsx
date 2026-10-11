import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { images } from "@/config/images";
const collections = [
  {
    category: "clubs",
    title: "Find your people.",
    description: "A community for your kind of curiosity.",
    image: images.clubArts,
  },
  {
    category: "events",
    title: "Make a good plan.",
    description: "Something worth leaving the lecture hall for.",
    image: images.eventMusic,
  },
  {
    category: "resources",
    title: "Get a head start.",
    description: "A little more focus for your next study session.",
    image: images.studyCorner,
  },
] as const;
export function DiscoverCollections() {
  return (
    <section aria-labelledby="discover-collections-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2
          id="discover-collections-title"
          className="font-display text-2xl font-semibold"
        >
          Pick a starting point.
        </h2>
        <p className="text-xs text-muted-foreground">
          Not recommendations. Just a few ways in.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {collections.map((collection) => (
          <Link
            key={collection.category}
            prefetch={false}
            href={`/discover?category=${collection.category}&view=all#discover-directory`}
            className="group relative isolate block overflow-hidden rounded-media border border-border text-on-photo"
            aria-label={collection.title}
          >
            <CampusImage
              image={collection.image}
              aspect="video"
              sizes="(max-width:639px) calc(100vw - 2rem), 300px"
            />
            <div className="photo-scrim absolute inset-0" aria-hidden="true" />
            <div className="absolute inset-0 flex flex-col justify-end p-4">
              <p className="font-display text-xl font-semibold">
                {collection.title}
              </p>
              <p className="mt-1 pr-7 text-xs leading-relaxed">
                {collection.description}
              </p>
              <ArrowUpRight
                className="absolute top-4 right-4 size-5"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Generated category illustrations, not photographs of specific listings.
      </p>
    </section>
  );
}
