import { cache } from "react";
import { createHash } from "node:crypto";
import { campusService, discoverCatalogService } from "@/services";
import { discoverServerOptions } from "@/features/discover/server-options";
import { filterFromParams } from "@/features/discover/validation/filter.schema";
import type { ListingDomain } from "@/types/listings";
import { ListingsFeature } from ".";
export async function ListingDirectoryPage({
  domain,
  searchParams,
}: {
  domain: ListingDomain;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams,
    params = new URLSearchParams();
  for (const [k, v] of Object.entries(query))
    if (typeof v === "string") params.set(k, v);
  const filter = {
      ...filterFromParams(params),
      category: domain,
      view:
        params.get("view") === "saved" ? ("saved" as const) : ("all" as const),
    },
    section = await discoverCatalogService.section(
      domain,
      1,
      await discoverServerOptions(),
    ),
    initial = { sections: [section], now: new Date().toISOString() };
  return (
    <ListingsFeature
      domain={domain}
      initial={initial}
      initialFilter={filter}
      key={createHash("sha256")
        .update(JSON.stringify({ initial, filter }))
        .digest("hex")}
    />
  );
}
export const readListing = cache(async (domain: ListingDomain, id: string) => {
  const options = await discoverServerOptions(),
    normalized = await discoverCatalogService.get(
      { category: domain, id },
      options,
    ),
    raw = await campusService.get(domain, id, {
      ...options,
      signal: AbortSignal.timeout(8000),
    });
  return { normalized, details: raw?.details };
});
