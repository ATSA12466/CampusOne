import { images, imageForSrc, isAllowedImageSrc } from "@/config/images";
import { isCampusDate } from "@/lib/home/schedule";
import type {
  AccommodationListing,
  LostFoundReport,
  MarketplaceListing,
  MediaItem,
  LearningResource,
} from "@/types";
import type { DiscoverItem } from "@/types/discover";
export function discoverLiving(item: AccommodationListing): DiscoverItem {
  return {
    category: "accommodation",
    id: item.id,
    title: item.title,
    description:
      item.facilities.join(" · ") ||
      "Facilities not supplied. Review the original listing.",
    href: `/accommodation/${encodeURIComponent(item.id)}`,
    destination: "detail",
    cover: item.details?.gallery[0] ?? images.campusLiving,
    illustrative: true,
    facts: [
      { label: "Location", value: item.location },
      { label: "Listed price", value: item.price },
      { label: "Type", value: item.details?.kind ?? "Type not supplied" },
    ],
  };
}
export function discoverMarket(item: MarketplaceListing): DiscoverItem {
  return {
    category: "marketplace",
    id: item.id,
    title: item.title,
    description: item.description,
    href: `/marketplace/${encodeURIComponent(item.id)}`,
    destination: "detail",
    cover: images.campusMarket,
    illustrative: true,
    facts: [
      { label: "Category", value: item.category },
      { label: "Listed price", value: item.priceLabel },
    ],
  };
}
export function discoverReport(item: LostFoundReport): DiscoverItem {
  return {
    category: "lost-found",
    id: item.id,
    title: item.item,
    description: `${item.type === "lost" ? "Lost" : "Found"} item reported at ${item.location}. Opens the shared board, not an individual report page.`,
    href: "/lost-and-found",
    destination: "board",
    cover: images.studyCorner,
    illustrative: true,
    ...(isCampusDate(item.date) ? { date: item.date } : {}),
    facts: [
      { label: "Location", value: item.location },
      { label: "Reported", value: item.date },
      { label: "Status", value: item.status },
    ],
  };
}
export function discoverResource(item: LearningResource): DiscoverItem {
  return {
    category: "resources",
    id: item.id,
    title: item.title,
    description: item.description,
    href: `/academics/resources/${encodeURIComponent(item.id)}`,
    destination: "detail",
    cover: images.studyCorner,
    illustrative: true,
    ...(isCampusDate(item.uploadedAt) ? { date: item.uploadedAt } : {}),
    facts: [
      { label: "Course", value: item.course },
      { label: "Format", value: item.category.toUpperCase() },
    ],
  };
}
export function discoverMedia(item: MediaItem): DiscoverItem {
  const registered = imageForSrc(item.thumbnail),
    supplied =
      registered?.provenance !== "placeholder" &&
      isAllowedImageSrc(item.thumbnail);
  return {
    category: "media",
    id: item.id,
    title: item.title,
    description: `By ${item.creator}. Opens the media library; this card does not start playback.`,
    href: "/media",
    destination: "library",
    cover: supplied
      ? (registered ?? {
          src: item.thumbnail,
          alt: `Publisher-supplied cover for ${item.title}`,
          provenance: "upload",
        })
      : images.clubDebate,
    illustrative: !supplied,
    facts: [
      { label: "Format", value: item.kind },
      { label: "Duration", value: item.duration },
    ],
  };
}
