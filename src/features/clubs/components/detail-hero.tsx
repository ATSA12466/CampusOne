import { Users } from "lucide-react";
import { CampusImage } from "@/components/media/campus-image";
import { clubCover } from "@/lib/clubs/media";
import { clubCategoryLabel } from "@/lib/clubs/category";
import type { Club } from "@/types";
import { SaveClubButton } from "./save-club-button";
export function DetailHero({
  club,
  saved,
  onSave,
  disabled,
}: {
  club: Club;
  saved: boolean;
  onSave: () => void;
  disabled: boolean;
}) {
  return (
    <section
      className="club-hero relative isolate overflow-hidden rounded-media text-on-photo"
      aria-labelledby="club-detail-title"
    >
      <CampusImage
        image={clubCover(club)}
        priority
        quality={60}
        aspect="panorama"
        sizes="(max-width:1023px) calc(100vw - 2rem), 1000px"
        className="absolute inset-0 h-full w-full aspect-auto"
      />
      <div className="photo-scrim hero-photo-scrim absolute inset-0" aria-hidden="true" />
      <SaveClubButton name={club.name} saved={saved} disabled={disabled} onSave={onSave} overlay />
      <div className="club-hero-content relative flex flex-col justify-end p-6 md:p-9">
        <p className="text-[10px] font-bold tracking-widest uppercase">
          {clubCategoryLabel(club.category)}
        </p>
        <h1
          id="club-detail-title"
          className="mt-3 max-w-lg font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.05] tracking-tight"
        >
          {club.name}
        </h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed">
          {club.details?.tagline ?? club.description}
        </p>
        <p className="mt-5 flex items-center gap-2 text-xs">
          <Users className="size-4" aria-hidden="true" />
          {club.details
            ? `${club.details.memberCount} members · Since ${club.details.founded}`
            : "Explore this community"}
        </p>
        <p className="mt-5 max-w-sm text-[10px]">
          {clubCover(club).provenance === "generated"
            ? "Generated demo scene · fictional students"
            : "Photo supplied by its publisher"}
        </p>
      </div>
    </section>
  );
}
