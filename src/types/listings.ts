import type { CampusMedia } from "./media";
export type ListingDomain =
  | "accommodation"
  | "marketplace"
  | "opportunities"
  | "resources"
  | "lost-found";
export interface ListingDetails {
  intro: string;
  body: string[];
  gallery: CampusMedia[];
  kind: string;
  owner: string;
  tags: string[];
  priceValue?: number;
  walkMinutes?: number;
  condition?: string;
  eligibility?: string[];
  applicationUrl?: string;
}
export interface ListingEnquiry {
  id: string;
  category: ListingDomain;
  listingId: string;
  message: string;
  intent: "enquiry" | "report" | "application";
  createdAt: string;
}
