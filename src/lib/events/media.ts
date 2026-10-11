import { images, imageForSrc } from "@/config/images";
import type { EventItem } from "@/types";
import type { CampusMedia } from "@/types/media";
export function eventCover(event: EventItem): CampusMedia {
  return event.details
    ? (imageForSrc(event.details.cover) ?? {
        src: event.details.cover,
        alt: event.details.coverAlt,
        provenance: "upload",
      })
    : images.eventShowcase;
}
export const eventGallery = (event: EventItem): CampusMedia[] =>
  (event.details?.gallery ?? []).map(
    (photo) => imageForSrc(photo.src) ?? { ...photo, provenance: "upload" },
  );
export function eventPrice(event: EventItem) {
  return !event.details
    ? "Price not supplied"
    : event.details.price === 0
      ? "Free to RSVP"
      : `GH₵${new Intl.NumberFormat("en-GH", { maximumFractionDigits: 2 }).format(event.details.price)} · listed entry fee`;
}
