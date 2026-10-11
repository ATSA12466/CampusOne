import { CampusImage } from "@/components/media/campus-image";
import type { CampusMedia } from "@/types/media";
export function MagazineHeader({
  title,
  description,
  eyebrow,
  image,
}: {
  title: string;
  description: string;
  eyebrow: string;
  image: CampusMedia;
}) {
  return (
    <header className="relative isolate overflow-hidden rounded-media bg-nav text-on-photo">
      <CampusImage
        image={image}
        priority
        quality={60}
        aspect="panorama"
        sizes="(max-width:1023px) 100vw, 1000px"
        className="absolute inset-0 h-full w-full aspect-auto"
      />
      <div
        className="photo-scrim hero-photo-scrim absolute inset-0"
        aria-hidden="true"
      />
      <div className="relative flex min-h-72 flex-col justify-end p-6 md:min-h-80 md:p-9">
        <p className="text-xs font-semibold tracking-widest uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-xl font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.08]">
          {title}
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed">{description}</p>
        <p className="mt-5 max-w-md text-[10px]">
          {image.provenance === "generated"
            ? "Generated illustration · fictional campus and people, not a photograph of this listing."
            : image.provenance === "placeholder"
              ? "Illustrative placeholder · not a verified listing photograph."
              : "Publisher-supplied or licensed imagery."}
        </p>
      </div>
    </header>
  );
}
