import { routeMetadata } from "@/config/metadata";
import { AdvertisingFeature } from "@/features/advertising";
import { readCampusFeed } from "@/features/campus-feed/server";
export const metadata = routeMetadata("advertising");
export default async function AdvertisingPage() {
  return <AdvertisingFeature initial={await readCampusFeed("campaigns")} />;
}
