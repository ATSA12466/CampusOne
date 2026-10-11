import { imageForSrc } from "@/config/images";
import type { Club } from "@/types";
import type { CampusMedia } from "@/types/media";
export function clubCover(club: Club): CampusMedia {
  return (
    imageForSrc(club.cover) ?? {
      src: club.cover,
      alt: club.details?.coverAlt ?? `${club.name} cover photograph, supplied by its publisher`,
      provenance: "upload",
    }
  );
}
export function clubGallery(club: Club): CampusMedia[] {
  return (club.details?.gallery ?? []).map(
    (photo) => imageForSrc(photo.src) ?? { ...photo, provenance: "upload" },
  );
}
export function clubFee(club: Club) {
  if (!club.details) return "Fee not supplied";
  return club.details.fee === 0
    ? "Free to join"
    : `GH₵${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 2 }).format(club.details.fee)} / semester`;
}
