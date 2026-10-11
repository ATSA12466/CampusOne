import type { CatalogService, CollectionMap, ServiceOptions } from "@/types/service-contracts";
import type { HomeCollection, HomeFeedService } from "@/types/home";
const collections: readonly HomeCollection[] = [
  "featured",
  "clubs",
  "events",
  "opportunities",
  "campaigns",
  "timetable",
  "courses",
];
export function createHomeFeedService(
  catalog: CatalogService,
  { timeoutMs = 8000 }: { timeoutMs?: number } = {},
): HomeFeedService {
  return {
    async snapshot(options = {}) {
      options.signal?.throwIfAborted();
      const unavailable: HomeCollection[] = [],
        truncated: HomeCollection[] = [];
      const load = async <K extends HomeCollection>(
        collection: K,
        request: ServiceOptions,
      ): Promise<CollectionMap[K][]> => {
        try {
          const deadline = AbortSignal.timeout(timeoutMs);
          const signal = request.signal ? AbortSignal.any([request.signal, deadline]) : deadline;
          const page = await catalog.list(collection, { pageSize: 30, ...request, signal });
          if (page.hasMore) truncated.push(collection);
          return page.items;
        } catch (error) {
          if (options.signal?.aborted) throw error;
          unavailable.push(collection);
          return [];
        }
      };
      const [featured, clubs, events, opportunities, campaigns, timetable, courses] =
        await Promise.all([
          load("featured", options),
          load("clubs", options),
          load("events", options),
          load("opportunities", options),
          load("campaigns", options),
          load("timetable", options),
          load("courses", options),
        ]);
      options.signal?.throwIfAborted();
      return {
        featured,
        clubs,
        events,
        opportunities,
        campaigns,
        timetable,
        courses,
        now: options.now ?? new Date().toISOString(),
        unavailable: collections.filter((key) => unavailable.includes(key)),
        truncated: collections.filter((key) => truncated.includes(key)),
      };
    },
  };
}
