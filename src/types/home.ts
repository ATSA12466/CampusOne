export type FeaturedContentType =
  | "video"
  | "audio"
  | "sponsored"
  | "highlight"
  | "opportunity"
  | "announcement";

export interface FeaturedContentItem {
  id: string;
  title: string;
  description: string;
  type: FeaturedContentType;
  thumbnail: string;
  thumbnailAlt: string;
  mediaSource?: string;
  captionsSource?: string;
  transcript?: string;
  campaignId?: string;
  creator?: string;
  duration?: string;
  ctaLabel?: string;
  destination: string;
  sponsored?: boolean;
  active: boolean;
}

export type HomeCollection =
  | "featured"
  | "clubs"
  | "events"
  | "opportunities"
  | "campaigns"
  | "timetable"
  | "courses";
export interface HomeSnapshot {
  featured: FeaturedContentItem[];
  clubs: import("./engagement").Club[];
  events: import("./engagement").EventItem[];
  opportunities: import("./engagement").Opportunity[];
  campaigns: import("./engagement").Campaign[];
  timetable: import("./productivity").TimetableSession[];
  courses: import("./academics").Course[];
  unavailable: HomeCollection[];
  truncated: HomeCollection[];
  now: string;
}
export interface HomeFeedService {
  snapshot: (
    options?: import("./service-contracts").ServiceOptions & { now?: string },
  ) => Promise<HomeSnapshot>;
}
export interface NextClass {
  session: import("./productivity").TimetableSession;
  date: string;
  startsAt: string;
  endsAt: string;
  inProgress: boolean;
  minutesUntil: number;
}

export type HomePreviewMode =
  | "empty"
  | "inactive"
  | "partial"
  | "offline"
  | "recover"
  | "truncated";
