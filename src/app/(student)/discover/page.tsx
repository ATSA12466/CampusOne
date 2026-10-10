import { routeMetadata } from "@/config/metadata";
import { DiscoverFeature } from "@/features/discover";

export const metadata = routeMetadata("discover");

export default function DiscoverPage() {
  return <DiscoverFeature />;
}
