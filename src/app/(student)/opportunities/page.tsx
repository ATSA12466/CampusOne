import { routeMetadata } from "@/config/metadata";
import { ListingDirectoryPage } from "@/features/listings/server";
export const metadata = routeMetadata("opportunities");
export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ListingDirectoryPage domain="opportunities" searchParams={searchParams} />
  );
}
