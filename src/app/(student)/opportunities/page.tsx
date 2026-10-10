import { routeMetadata } from "@/config/metadata";
import { OpportunitiesFeature } from "@/features/opportunities";
export const metadata = routeMetadata("opportunities");

export default function OpportunitiesPage() {
  return <OpportunitiesFeature />;
}
