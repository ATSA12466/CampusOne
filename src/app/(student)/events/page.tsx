import { createHash } from "node:crypto";
import { routeMetadata } from "@/config/metadata";
import { EventsFeature } from "@/features/events";
import { eventServerOptions } from "@/features/events/server-options";
import { eventCatalogService } from "@/services";
export const metadata = routeMetadata("events");
export default async function EventsPage() {
  const initial = await eventCatalogService.list(1, await eventServerOptions());
  return (
    <EventsFeature
      initial={initial}
      key={createHash("sha256").update(JSON.stringify(initial)).digest("hex")}
    />
  );
}
