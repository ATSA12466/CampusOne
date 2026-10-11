import { routeMetadata } from "@/config/metadata";
import { CommunityFeature } from "@/features/community";
import { readCampusFeed } from "@/features/campus-feed/server";
export const metadata = routeMetadata("community");
export const dynamic = "force-dynamic";
export default async function CommunityPage() {
  return <CommunityFeature initial={await readCampusFeed("posts")} />;
}
