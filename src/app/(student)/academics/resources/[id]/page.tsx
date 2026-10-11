import { notFound } from "next/navigation";
import { pageMetadata } from "@/config/metadata";
import { readListing } from "@/features/listings/server";
import { ListingDetail } from "@/features/listings/detail";
import { ResourceDownload } from "@/features/academics/components/resource-download";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { normalized: item } = await readListing("resources", id);
  return pageMetadata(
    item?.title ?? "Academic resource",
    item?.description ?? "Study resources.",
  );
}
export default async function ResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { normalized: item, details } = await readListing("resources", id);
  if (!item) notFound();
  return (
    <div className="space-y-6">
      <ListingDetail
        domain="resources"
        item={item}
        details={details}
        initialNow={new Date().toISOString()}
      />
      <ResourceDownload
        title={item.title}
        id={item.id}
        body={details?.body ?? [item.description]}
      />
    </div>
  );
}
