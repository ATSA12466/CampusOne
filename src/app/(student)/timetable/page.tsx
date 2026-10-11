import { routeMetadata } from "@/config/metadata";
import { TimetableFeature } from "@/features/timetable";
import { scheduleSnapshot } from "@/services/schedule/schedule.service";
export const dynamic = "force-dynamic";
export const metadata = routeMetadata("timetable");
export default async function Page() {
  return <TimetableFeature initial={await scheduleSnapshot()} />;
}
