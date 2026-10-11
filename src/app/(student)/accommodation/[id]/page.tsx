import { notFound } from "next/navigation";
import { pageMetadata } from "@/config/metadata";
import { ListingDetail } from "@/features/listings/detail";
import { readListing } from "@/features/listings/server";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { normalized: item } = await readListing("accommodation", id);
  return pageMetadata(
    item?.title ?? "Accommodation",
    item?.description ?? "Find student accommodation.",
  );
}
export default async function AccommodationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { normalized: item, details } = await readListing("accommodation", id);
  if (!item) notFound();
  return (
    <ListingDetail
      initialNow={new Date().toISOString()}
      domain="accommodation"
      item={item}
      details={details}
    />
  );
}
