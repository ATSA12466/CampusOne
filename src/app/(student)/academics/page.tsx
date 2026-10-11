import { routeMetadata } from "@/config/metadata";
import { ListingDirectoryPage } from "@/features/listings/server";
import { AcademicsFeature } from "@/features/academics";
export const metadata = routeMetadata("academics");
export default async function AcademicsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <div className="space-y-8">
      <ListingDirectoryPage domain="resources" searchParams={searchParams} />
      <AcademicsFeature />
    </div>
  );
}
