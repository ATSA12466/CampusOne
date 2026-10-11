import { createHash } from "node:crypto";
import { routeMetadata } from "@/config/metadata";
import { DiscoverFeature } from "@/features/discover";
import { discoverServerOptions } from "@/features/discover/server-options";
import { filterFromParams } from "@/features/discover/validation/filter.schema";
import { discoverCatalogService } from "@/services";
export const metadata = routeMetadata("discover");
export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams,
    params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (typeof value === "string") params.set(key, value);
  const filter = filterFromParams(params),
    initial = await discoverCatalogService.snapshot(
      await discoverServerOptions(),
    );
  return (
    <DiscoverFeature
      initial={initial}
      filter={filter}
      key={createHash("sha256")
        .update(JSON.stringify({ initial, filter }))
        .digest("hex")}
    />
  );
}
