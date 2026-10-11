import { notFound } from "next/navigation";
import { pageMetadata } from "@/config/metadata";
import { readListing } from "@/features/listings/server";
import { ListingDetail } from "@/features/listings/detail";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { normalized } = await readListing("marketplace", id);
  return pageMetadata(
    normalized?.title ?? "Marketplace",
    normalized?.description ?? "Useful student finds.",
  );
}
export default async function MarketplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { normalized: item, details } = await readListing("marketplace", id);
  if (!item) notFound();
  return <ListingDetail domain="marketplace" item={item} details={details} />;
}
