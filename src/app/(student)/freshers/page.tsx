import { routeMetadata } from "@/config/metadata";
import { FreshersFeature } from "@/features/freshers";
import { readCampusFeed } from "@/features/campus-feed/server";
export const metadata = routeMetadata("freshers");
export const dynamic = "force-dynamic";
export default async function FreshersPage() {
  return <FreshersFeature initial={await readCampusFeed("clubs")} />;
}
