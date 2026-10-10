import { destinations } from "@/config/navigation";
import { normalizeSearch, rankSearchResults } from "@/lib/search/rank";
import { searchQuerySchema } from "@/services/validation/search.schema";
import type { CatalogService } from "@/types/service-contracts";
import type { SearchCategory, SearchResult, SearchService } from "@/types/search";
import { catalogSearchSources } from "./catalog-sources";

export function createSearchService(catalog: CatalogService): SearchService {
  const sources = catalogSearchSources(catalog);
  return {
    async search(input) {
      input.signal?.throwIfAborted();
      const { query, scope, limit } = searchQuerySchema.parse(input);
      const term = normalizeSearch(query);
      const pages: SearchResult[] =
        scope === "all" || scope === "destinations"
          ? destinations
              .filter((item) =>
                normalizeSearch(
                  `${item.label} ${item.description} ${"keywords" in item ? item.keywords : ""}`,
                ).includes(term),
              )
              .map((item) => ({
                id: `page:${item.href}`,
                title: item.label,
                description: item.description,
                href: item.href,
                group: "Pages",
                icon: item.icon,
              }))
          : [];
      const selected =
        query.length >= 2
          ? sources.filter((source) => scope === "all" || source.category === scope)
          : [];
      const replies = await Promise.allSettled(
        selected.map((source) =>
          source.load(query, { signal: input.signal, headers: input.headers }),
        ),
      );
      input.signal?.throwIfAborted();
      const unavailable: SearchCategory[] = [];
      const content: SearchResult[] = [];
      let hasMore = false;
      replies.forEach((reply, index) => {
        if (reply.status === "rejected") {
          unavailable.push(selected[index].category);
          return;
        }
        content.push(...reply.value.items);
        hasMore ||= reply.value.hasMore;
      });
      const ranked = query ? rankSearchResults([...content, ...pages], query) : pages;
      return {
        items: ranked.slice(0, limit),
        unavailable,
        hasMore: hasMore || ranked.length > limit,
      };
    },
  };
}
