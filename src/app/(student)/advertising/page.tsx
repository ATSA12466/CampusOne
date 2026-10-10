import { routeMetadata } from "@/config/metadata";
import { AdvertisingFeature } from "@/features/advertising";
export const metadata = routeMetadata("advertising");

export default function AdvertisingPage() {
  return <AdvertisingFeature />;
}
