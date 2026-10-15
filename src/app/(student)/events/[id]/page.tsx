import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { engagementService } from "@/services/api";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = await engagementService.listEvents();
  const event = events.find((item: any) => item.id === id);
  if (!event) notFound();

  return (
    <div className="space-y-4">
      <Link href="/events" className="text-sm text-blue-700">← Back to events</Link>
      <Card>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="mt-2 text-slate-600">{event.date} • {event.venue}</p>
        <p className="mt-2 text-sm text-slate-500">Category: {event.category} • Capacity {event.seats}</p>
        <p className="mt-3 text-sm text-slate-700">Registration and ticket issuance are currently demo workflows.</p>
      </Card>
    </div>
  );
}
