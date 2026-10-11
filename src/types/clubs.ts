import type { Club, ClubMembership } from "./engagement";
import type { Page, ServiceOptions } from "./service-contracts";
export interface ClubPhoto {
  src: string;
  alt: string;
}
export interface ClubLeader {
  name: string;
  role: string;
  avatar?: string;
}
export interface ClubDetails {
  tagline: string;
  coverAlt: string;
  memberCount: number;
  meeting: string;
  venue: string;
  fee: number;
  founded: number;
  accepting: boolean;
  rank: number;
  story: string[];
  highlights: string[];
  leaders: ClubLeader[];
  gallery: ClubPhoto[];
}
export interface ClubCatalog {
  page: Page<Club> | null;
  error: string | null;
}
export type ClubSort = "recommended" | "name" | "members";
export type ClubView = "all" | "mine" | "saved";
export interface ClubFilters {
  query: string;
  category: string;
  sort: ClubSort;
  view: ClubView;
  page: number;
}
export interface ClubActivity {
  memberships: ClubMembership[];
  savedIds: string[];
}
export interface ClubMutation {
  persisted: boolean;
}
export interface ClubActionService {
  readonly source: "demo" | "api";
  activity: (options?: ServiceOptions) => Promise<ClubActivity>;
  request: (clubId: string, note: string, options?: ServiceOptions) => Promise<ClubMutation>;
  withdraw: (clubId: string, options?: ServiceOptions) => Promise<ClubMutation>;
  review: (
    membershipId: string,
    status: "approved" | "rejected",
    options?: ServiceOptions,
  ) => Promise<ClubMutation>;
  save: (clubId: string, saved: boolean, options?: ServiceOptions) => Promise<ClubMutation>;
}
