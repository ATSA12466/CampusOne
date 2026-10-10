import type { CatalogService, CollectionMap, ServiceOptions } from "@/types/service-contracts";
import type { NavIcon } from "@/types/navigation";
import type { SearchCategory, SearchResult } from "@/types/search";
interface SearchSource {
  category: SearchCategory;
  load: (
    query: string,
    options: ServiceOptions,
  ) => Promise<{ items: SearchResult[]; hasMore: boolean }>;
}
export function catalogSearchSources(catalog: CatalogService): readonly SearchSource[] {
  function source<K extends SearchCategory>(
    category: K,
    group: string,
    icon: NavIcon,
    path: string,
    title: (item: CollectionMap[K]) => string,
    description: (item: CollectionMap[K]) => string,
  ): SearchSource {
    return {
      category,
      async load(query, options) {
        const page = await catalog.list(category, { search: query, pageSize: 6, ...options });
        return {
          hasMore: page.hasMore,
          items: page.items.map((item) => ({
            id: `${category}:${item.id}`,
            title: title(item),
            description: description(item),
            group,
            icon,
            href: `${path}/${encodeURIComponent(item.id)}`,
          })),
        };
      },
    };
  }
  return [
    source(
      "clubs",
      "Clubs",
      "clubs",
      "/clubs",
      (item) => item.name,
      (item) => item.description,
    ),
    source(
      "events",
      "Events",
      "events",
      "/events",
      (item) => item.title,
      (item) => `${item.venue} · ${item.date}`,
    ),
    source(
      "opportunities",
      "Opportunities",
      "opportunities",
      "/opportunities",
      (item) => item.title,
      (item) => `${item.provider} · ${item.summary}`,
    ),
    source(
      "accommodation",
      "Housing",
      "housing",
      "/accommodation",
      (item) => item.title,
      (item) => `${item.location} · ${item.price}`,
    ),
    source(
      "marketplace",
      "Market",
      "market",
      "/marketplace",
      (item) => item.title,
      (item) => `${item.priceLabel} · ${item.description}`,
    ),
    source(
      "resources",
      "Resources",
      "academics",
      "/academics/resources",
      (item) => item.title,
      (item) => `${item.course} · ${item.description}`,
    ),
    source(
      "announcements",
      "News",
      "announcements",
      "/announcements",
      (item) => item.title,
      (item) => item.content,
    ),
  ];
}
