import { routeMetadata } from "@/config/metadata";
import { AnnouncementsFeature } from "@/features/announcements";
export const metadata = routeMetadata("announcements");

export default function AnnouncementsPage() {
  return <AnnouncementsFeature />;
}
