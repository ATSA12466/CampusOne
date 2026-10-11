import type { EventItem } from "./engagement";
import type { Page, ServiceOptions } from "./service-contracts";
export interface EventDetails {
  cover: string;
  coverAlt: string;
  tagline: string;
  description: string[];
  startsAt: string;
  endsAt: string;
  bookingClosesAt: string;
  timeZone: "Africa/Accra";
  price: number;
  organizer: string;
  status: "scheduled" | "cancelled";
  rank: number;
  highlights: string[];
  agenda: { title: string; startsAt: string; description: string }[];
  speakers: { name: string; role: string; avatar?: string }[];
  accessibility: string[];
  gallery: { src: string; alt: string }[];
}
export interface EventCatalog {
  page: Page<EventItem> | null;
  error: string | null;
  now: string;
}
export interface EventDetailSnapshot {
  event: EventItem | null;
  now: string;
}
export interface EventFilters {
  query: string;
  category: string;
  time: "upcoming" | "week" | "month" | "past" | "all";
  sort: "soon" | "name" | "popular" | "price";
  view: "all" | "going" | "saved";
  page: number;
  freeOnly: boolean;
}
export interface EventActivity {
  goingIds: string[];
  savedIds: string[];
  attendance: { eventId: string; registered: number }[];
}
export interface EventMutation {
  persisted: boolean;
}
export interface EventTicket {
  eventId: string;
  reference: string;
  payload: string;
  status: "valid" | "revoked";
  source: "demo" | "api";
}
export interface EventActionService {
  readonly source: "demo" | "api";
  activity: (options?: ServiceOptions) => Promise<EventActivity>;
  rsvp: (id: string, going: boolean, options?: ServiceOptions) => Promise<EventMutation>;
  save: (id: string, saved: boolean, options?: ServiceOptions) => Promise<EventMutation>;
  ticket: (id: string, options?: ServiceOptions) => Promise<EventTicket>;
}
