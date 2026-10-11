import { routeMetadata } from "@/config/metadata";
import { ListingDirectoryPage } from "@/features/listings/server";
export const metadata = routeMetadata("marketplace");
export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ListingDirectoryPage domain="marketplace" searchParams={searchParams} />
  );
}
