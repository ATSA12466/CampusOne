import { routeMetadata } from "@/config/metadata";
import { CalendarFeature } from "@/features/calendar";
import { scheduleSnapshot } from "@/services/schedule/schedule.service";
export const dynamic = "force-dynamic";
export const metadata = routeMetadata("calendar");
export default async function Page() {
  return <CalendarFeature initial={await scheduleSnapshot()} />;
}
