import { routeMetadata } from "@/config/metadata";
import { MarketplaceFeature } from "@/features/marketplace";
export const metadata = routeMetadata("marketplace");

export default function MarketplacePage() {
  return <MarketplaceFeature />;
}
