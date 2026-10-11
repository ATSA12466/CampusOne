import { cache } from "react";
import { pageMetadata } from "@/config/metadata";
import { notFound } from "next/navigation";
import { eventCatalogService } from "@/services";
import { EventDetailFeature } from "@/features/events/detail";
import { eventServerOptions } from "@/features/events/server-options";
const getEvent = cache(async (id: string) =>
  eventCatalogService.read(id, await eventServerOptions()),
);
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params,
    { event } = await getEvent(id);
  return pageMetadata(
    event?.title ?? "Event",
    event?.details?.tagline ??
      (event
        ? `${event.title} at ${event.venue}. Explore the schedule and manage your plan with CampusOne.`
        : "Find your next campus plan with CampusOne."),
  );
}
export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params,
    snapshot = await getEvent(id);
  if (!snapshot.event) notFound();
  return <EventDetailFeature event={snapshot.event} initialNow={snapshot.now} />;
}
