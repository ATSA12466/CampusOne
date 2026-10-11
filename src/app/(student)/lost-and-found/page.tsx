import { routeMetadata } from "@/config/metadata";
import { discoverCatalogService } from "@/services";
import { discoverServerOptions } from "@/features/discover/server-options";
import { LostAndFoundFeature } from "@/features/lost-and-found";
export const metadata = routeMetadata("lost-and-found");
export default async function LostAndFoundPage() {
  const section = await discoverCatalogService.section(
    "lost-found",
    1,
    await discoverServerOptions(),
  );
  return (
    <LostAndFoundFeature
      initial={{ sections: [section], now: new Date().toISOString() }}
    />
  );
}
