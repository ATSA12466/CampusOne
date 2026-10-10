import { routeMetadata } from "@/config/metadata";
import { NotificationsFeature } from "@/features/notifications";
export const metadata = routeMetadata("notifications");

export default function NotificationsPage() {
  return <NotificationsFeature />;
}
