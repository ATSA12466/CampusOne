import type { CampusMedia } from "./media";
import type { Bookmark } from "./common";
import type { Page, ServiceOptions } from "./service-contracts";
export type DiscoverCategory =
  | "clubs"
  | "events"
  | "resources"
  | "opportunities"
  | "accommodation"
  | "marketplace"
  | "media"
  | "lost-found";
export interface DiscoverFilter {
  query: string;
  category: "all" | DiscoverCategory;
  view: "edit" | "all" | "saved";
  sort: "mix" | "name" | "date";
  page: number;
}
export interface DiscoverReference {
  category: DiscoverCategory;
  id: string;
}
export interface DiscoverItem extends DiscoverReference {
  title: string;
  description: string;
  href: string;
  destination: "detail" | "board" | "library";
  cover: CampusMedia;
  illustrative: boolean;
  facts: { label: string; value: string }[];
  rank?: number;
  date?: string;
  event?: {
    date: string;
    endsAt?: string;
    startsAt?: string;
    closesAt?: string;
    cancelled: boolean;
    full: boolean;
  };
}
export interface DiscoverSection {
  category: DiscoverCategory;
  page: Page<DiscoverItem> | null;
  error: string | null;
}
export interface DiscoverSnapshot {
  sections: DiscoverSection[];
  now: string;
}
export interface DiscoverCatalogService {
  snapshot: (options?: ServiceOptions) => Promise<DiscoverSnapshot>;
  section: (
    category: DiscoverCategory,
    page?: number,
    options?: ServiceOptions,
  ) => Promise<DiscoverSection>;
  get: (
    reference: DiscoverReference,
    options?: ServiceOptions,
  ) => Promise<DiscoverItem | null>;
}
export interface DiscoverActivity {
  saved: DiscoverReference[];
}
export interface DiscoverActionService {
  readonly source: "demo" | "api";
  activity: (options?: ServiceOptions) => Promise<DiscoverActivity>;
  save: (
    reference: DiscoverReference,
    saved: boolean,
    options?: ServiceOptions,
  ) => Promise<{ persisted: boolean }>;
}
export type DiscoverBookmarkType = Extract<
  Bookmark["entityType"],
  | "club"
  | "event"
  | "resource"
  | "opportunity"
  | "accommodation"
  | "marketplace"
  | "media"
  | "lost-found"
>;
