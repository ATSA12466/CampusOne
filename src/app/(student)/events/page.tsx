import { routeMetadata } from "@/config/metadata";
import { EventsFeature } from "@/features/events";
export const metadata = routeMetadata("events");

export default function EventsPage() {
  return <EventsFeature />;
}
