import type { ServiceOptions } from "./service-contracts";
import type { NavIcon } from "./navigation";
export type SearchCategory =
  | "clubs"
  | "events"
  | "opportunities"
  | "accommodation"
  | "marketplace"
  | "resources"
  | "announcements";
export type SearchScope = "all" | "destinations" | SearchCategory;
export interface SearchQuery extends ServiceOptions {
  query: string;
  scope?: SearchScope;
  limit?: number;
}
export interface SearchResult {
  id: string;
  title: string;
  description: string;
  href: string;
  group: string;
  icon: NavIcon;
}
export interface SearchResponse {
  items: SearchResult[];
  unavailable: readonly SearchCategory[];
  hasMore: boolean;
}
export interface SearchService {
  search: (query: SearchQuery) => Promise<SearchResponse>;
}

// Only the development /design showcase supplies these controlled fixtures.
export type SearchPreviewMode = "default" | "error" | "partial" | "slow";
