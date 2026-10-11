import type { CollectionMap, CollectionName } from "./service-contracts";
export interface CampusFeed<K extends CollectionName> {
  items: CollectionMap[K][];
  total: number;
  hasMore: boolean;
  error: string | null;
}
