import { routeMetadata } from "@/config/metadata";
import { MessagesFeature } from "@/features/messages";
export const metadata = routeMetadata("messages");

export default function MessagesPage() {
  return <MessagesFeature />;
}
