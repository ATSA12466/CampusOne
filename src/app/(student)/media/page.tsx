import { routeMetadata } from "@/config/metadata";
import { MediaFeature } from "@/features/media";
import { readCampusFeed } from "@/features/campus-feed/server";
export const metadata = routeMetadata("media");
export default async function MediaPage() {
  return <MediaFeature initial={await readCampusFeed("media")} />;
}
