import {
  academicsService,
  communityService,
  engagementService,
  homeService,
  lifeService,
  mediaService,
  productivityService,
} from "./index";
import { listQuerySchema } from "@/services/validation/queries.schema";
import type {
  CatalogService,
  CollectionMap,
  CollectionName,
  ListQuery,
  Page,
  ServiceOptions,
} from "@/types/service-contracts";

const readers: { [K in CollectionName]: () => CollectionMap[K][] } = {
  featured: homeService.listFeaturedContent,
  clubs: engagementService.listClubs,
  events: engagementService.listEvents,
  opportunities: engagementService.listOpportunities,
  accommodation: lifeService.listAccommodation,
  marketplace: lifeService.listMarketplace,
  lostFound: lifeService.listLostFound,
  resources: academicsService.listResources,
  courses: academicsService.listCourses,
  posts: communityService.listPosts,
  conversations: communityService.listConversations,
  notifications: communityService.listNotifications,
  media: mediaService.listMedia,
  announcements: engagementService.listAnnouncements,
  timetable: productivityService.listTimetableSessions,
  representatives: engagementService.listRepresentatives,
  projects: engagementService.listSrcProjects,
  campaigns: engagementService.listCampaigns,
};
function property(item: object, keys: readonly string[]) {
  for (const key of keys) {
    const value: unknown = Object.entries(item).find(([name]) => name === key)?.[1];
    if (typeof value === "string") return value;
  }
  return "";
}
export const demoCatalog: CatalogService = {
  async list<K extends CollectionName>(
    collection: K,
    query: ListQuery = {},
  ): Promise<Page<CollectionMap[K]>> {
    query.signal?.throwIfAborted();
    const filter = listQuerySchema.parse(query);
    const items = readers[collection]()
      .filter((item) => {
        const text = Object.values(item)
          .filter((value) => typeof value === "string")
          .join(" ")
          .toLocaleLowerCase("en-GH");
        return (
          text.includes(filter.search.toLocaleLowerCase("en-GH")) &&
          (filter.category === "all" ||
            property(item, ["category", "kind", "type"]) === filter.category)
        );
      })
      .sort((a, b) =>
        filter.sort === "newest"
          ? property(b, [
              "createdAt",
              "publishedAt",
              "uploadedAt",
              "date",
              "startDate",
            ]).localeCompare(
              property(a, ["createdAt", "publishedAt", "uploadedAt", "date", "startDate"]),
            )
          : property(a, ["title", "name", "item", "course", "author"]).localeCompare(
              property(b, ["title", "name", "item", "course", "author"]),
              "en-GH",
            ),
      );
    const offset = (filter.page - 1) * filter.pageSize;
    return {
      items: structuredClone(items.slice(offset, offset + filter.pageSize)),
      page: filter.page,
      pageSize: filter.pageSize,
      total: items.length,
      hasMore: offset + filter.pageSize < items.length,
    };
  },
  async get<K extends CollectionName>(
    collection: K,
    id: string,
    options: ServiceOptions = {},
  ): Promise<CollectionMap[K] | null> {
    options.signal?.throwIfAborted();
    return structuredClone(readers[collection]().find((item) => item.id === id) ?? null);
  },
};
