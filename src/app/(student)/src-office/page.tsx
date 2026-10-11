import { routeMetadata } from "@/config/metadata";
import { SrcOfficeFeature } from "@/features/src-office";
import { readCampusFeed } from "@/features/campus-feed/server";
export const metadata = routeMetadata("src-office");
export default async function SrcOfficePage() {
  const [representatives, projects] = await Promise.all([
    readCampusFeed("representatives"),
    readCampusFeed("projects"),
  ]);
  return (
    <SrcOfficeFeature representatives={representatives} projects={projects} />
  );
}
