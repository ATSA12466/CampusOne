import { routeMetadata } from "@/config/metadata";
import { ListingDirectoryPage } from "@/features/listings/server";
export const metadata = routeMetadata("accommodation");
export default async function AccommodationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ListingDirectoryPage domain="accommodation" searchParams={searchParams} />
  );
}
