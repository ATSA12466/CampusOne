import { pageMetadata } from "@/config/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { lifeService } from "@/services";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = lifeService.listMarketplace().find((item) => item.id === id);
  return pageMetadata(
    item ? item.title : "Marketplace listing",
    item ? item.description : "Explore your GCTU campus with CampusOne.",
  );
}

export default async function MarketplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = lifeService.listMarketplace().find((item) => item.id === id);
  if (!listing) notFound();

  return (
    <div className="space-y-4">
      <Link href="/marketplace" className="inline-flex min-h-11 items-center text-sm text-brand">
        ← Back to marketplace
      </Link>
      <Card>
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {listing.category} • {listing.priceLabel}
        </p>
        <p className="mt-3 text-foreground">{listing.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Purchasing and payment are demo-only until backend/payment integration is supplied.
        </p>
      </Card>
    </div>
  );
}
