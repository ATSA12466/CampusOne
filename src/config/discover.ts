import type {
  DiscoverBookmarkType,
  DiscoverCategory,
  DiscoverFilter,
} from "@/types/discover";
export const discoverCategories = [
  "clubs",
  "events",
  "resources",
  "opportunities",
  "accommodation",
  "marketplace",
  "media",
  "lost-found",
] as const satisfies readonly DiscoverCategory[];
export const discoverLabels: Record<DiscoverCategory, string> = {
  clubs: "Clubs & societies",
  events: "Events",
  resources: "Study resources",
  opportunities: "Opportunities",
  accommodation: "Campus living",
  marketplace: "Marketplace",
  media: "Media",
  "lost-found": "Lost & found",
};
export const discoverBookmarkTypes: Record<
  DiscoverCategory,
  DiscoverBookmarkType
> = {
  clubs: "club",
  events: "event",
  resources: "resource",
  opportunities: "opportunity",
  accommodation: "accommodation",
  marketplace: "marketplace",
  media: "media",
  "lost-found": "lost-found",
};
export const discoverDefaults: DiscoverFilter = {
  query: "",
  category: "all",
  view: "edit",
  sort: "mix",
  page: 1,
};
export const discoverPageSize = 6;
export const discoverEditSize = 24;
export const discoverUpstreamSize = 30;
