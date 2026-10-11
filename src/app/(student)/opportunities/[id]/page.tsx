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
  const { normalized: item } = await readListing("opportunities", id);
  return pageMetadata(
    item?.title ?? "Opportunity",
    item?.description ?? "Explore student opportunities.",
  );
}
export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { normalized: item, details } = await readListing("opportunities", id);
  if (!item) notFound();
  return (
    <ListingDetail
      initialNow={new Date().toISOString()}
      domain="opportunities"
      item={item}
      details={details}
    />
  );
}
