import { discoverUpstreamSize } from "@/config/discover";
import { discoverItemSchema } from "../validation/discover.schema";
import {
  discoverClub,
  discoverEvent,
  discoverOpportunity,
} from "./map-engagement";
import {
  discoverLiving,
  discoverMarket,
  discoverReport,
  discoverResource,
  discoverMedia,
} from "./map-life";
import type {
  CatalogService,
  CollectionMap,
  CollectionName,
  ServiceOptions,
} from "@/types/service-contracts";
import type { DiscoverCategory, DiscoverItem } from "@/types/discover";
export function discoverSources(catalog: CatalogService) {
  function source<K extends CollectionName>(
    category: DiscoverCategory,
    collection: K,
    map: (item: CollectionMap[K]) => DiscoverItem,
  ) {
    return {
      category,
      async list(page: number, options: ServiceOptions) {
        const result = await catalog.list(collection, {
          ...options,
          page,
          pageSize: discoverUpstreamSize,
        });
        if (
          result.page !== page ||
          result.pageSize !== discoverUpstreamSize ||
          result.items.length > discoverUpstreamSize ||
          result.items.length > result.total ||
          !Number.isSafeInteger(result.total) ||
          result.total < 0 ||
          new Set(result.items.map((item) => item.id)).size !==
            result.items.length ||
          (result.items.length === 0 && result.hasMore)
        )
          throw new Error(
            "The discovery service returned an inconsistent page. Please retry.",
          );
        return {
          ...result,
          items: result.items.map((item) =>
            discoverItemSchema.parse(map(item)),
          ),
        };
      },
      async get(id: string, options: ServiceOptions) {
        const item = await catalog.get(collection, id, options);
        if (item && item.id !== id)
          throw new Error(
            "The service returned a different campus item. Please retry.",
          );
        return item ? discoverItemSchema.parse(map(item)) : null;
      },
    };
  }
  return [
    source("clubs", "clubs", discoverClub),
    source("events", "events", discoverEvent),
    source("resources", "resources", discoverResource),
    source("opportunities", "opportunities", discoverOpportunity),
    source("accommodation", "accommodation", discoverLiving),
    source("marketplace", "marketplace", discoverMarket),
    source("media", "media", discoverMedia),
    source("lost-found", "lostFound", discoverReport),
  ];
}
