import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { lifeService } from "@/services/demo";

export default async function MarketplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = lifeService.listMarketplace().find((item) => item.id === id);
  if (!listing) notFound();

  return (
    <div className="space-y-4">
      <Link href="/marketplace" className="text-sm text-blue-700">← Back to marketplace</Link>
      <Card>
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{listing.category} • {listing.priceLabel}</p>
        <p className="mt-3 text-slate-700">{listing.description}</p>
        <p className="mt-2 text-xs text-slate-500">Purchasing and payment are demo-only until backend/payment integration is supplied.</p>
      </Card>
    </div>
  );
}
