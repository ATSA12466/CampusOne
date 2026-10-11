import { campusService } from "@/services";
import { discoverServerOptions } from "@/features/discover/server-options";
import type { CollectionName } from "@/types/service-contracts";
import type { CampusFeed } from "@/types/campus-feed";
export async function readCampusFeed<K extends CollectionName>(
  collection: K,
): Promise<CampusFeed<K>> {
  try {
    const page = await campusService.list(collection, {
      ...(await discoverServerOptions()),
      signal: AbortSignal.timeout(8000),
      page: 1,
      pageSize: 30,
    });
    if (
      page.page !== 1 ||
      page.pageSize !== 30 ||
      !Number.isSafeInteger(page.total) ||
      page.total < page.items.length ||
      new Set(page.items.map((r) => r.id)).size !== page.items.length
    )
      throw new Error("The source returned an inconsistent page.");
    return {
      items: page.items,
      total: page.total,
      hasMore: page.hasMore,
      error: null,
    };
  } catch {
    return {
      items: [],
      total: 0,
      hasMore: false,
      error:
        "This campus source could not load. Retry without losing your private drafts.",
    };
  }
}
