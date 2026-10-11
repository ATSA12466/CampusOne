import { routeMetadata } from "@/config/metadata";
import { AnnouncementsFeature } from "@/features/announcements";
import { readCampusFeed } from "@/features/campus-feed/server";
export const metadata = routeMetadata("announcements");
export default async function AnnouncementsPage() {
  return (
    <AnnouncementsFeature initial={await readCampusFeed("announcements")} />
  );
}
