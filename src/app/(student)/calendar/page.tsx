import { routeMetadata } from "@/config/metadata";
import { CalendarFeature } from "@/features/calendar";
export const metadata = routeMetadata("calendar");

export default function CalendarPage() {
  return <CalendarFeature />;
}
