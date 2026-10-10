import { pageMetadata } from "@/config/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { lifeService } from "@/services";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = lifeService.listAccommodation().find((item) => item.id === id);
  return pageMetadata(
    item ? item.title : "Accommodation",
    item
      ? `Student accommodation in ${item.location}, ${item.price}.`
      : "Explore your GCTU campus with CampusOne.",
  );
}

export default async function AccommodationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = lifeService.listAccommodation().find((item) => item.id === id);
  if (!listing) notFound();

  return (
    <div className="space-y-4">
      <Link href="/accommodation" className="inline-flex min-h-11 items-center text-sm text-brand">
        ← Back to accommodation
      </Link>
      <Card>
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{listing.location}</p>
        <p className="mt-2 text-foreground">{listing.price}</p>
        <ul className="mt-3 list-disc pl-5 text-sm text-foreground">
          {listing.facilities.map((facility) => (
            <li key={facility}>{facility}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
