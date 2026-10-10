import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { lifeService } from "@/services/demo";

export default async function AccommodationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = lifeService.listAccommodation().find((item) => item.id === id);
  if (!listing) notFound();

  return (
    <div className="space-y-4">
      <Link href="/accommodation" className="text-sm text-blue-700">← Back to accommodation</Link>
      <Card>
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{listing.location}</p>
        <p className="mt-2 text-slate-700">{listing.price}</p>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
          {listing.facilities.map((facility) => <li key={facility}>{facility}</li>)}
        </ul>
      </Card>
    </div>
  );
}
