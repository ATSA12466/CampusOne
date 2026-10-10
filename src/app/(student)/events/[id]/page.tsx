import { pageMetadata } from "@/config/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { engagementService } from "@/services";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = engagementService.listEvents().find((item) => item.id === id);
  return pageMetadata(
    item ? item.title : "Event",
    item
      ? `${item.title} at ${item.venue}. Student event details and demo registration.`
      : "Explore your GCTU campus with CampusOne.",
  );
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = engagementService.listEvents().find((item) => item.id === id);
  if (!event) notFound();

  return (
    <div className="space-y-4">
      <Link href="/events" className="inline-flex min-h-11 items-center text-sm text-brand">
        ← Back to events
      </Link>
      <Card>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="mt-2 text-muted-foreground">
          {event.date} • {event.venue}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Category: {event.category} • Capacity {event.seats}
        </p>
        <p className="mt-3 text-sm text-foreground">
          Registration and ticket issuance are currently demo workflows.
        </p>
      </Card>
    </div>
  );
}
