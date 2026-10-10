import { routeMetadata } from "@/config/metadata";
import { TimetableFeature } from "@/features/timetable";
export const metadata = routeMetadata("timetable");

export default function TimetablePage() {
  return <TimetableFeature />;
}
