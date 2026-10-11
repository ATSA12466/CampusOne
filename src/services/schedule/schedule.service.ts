import { campusService } from "@/services";
import { appConfig } from "@/config/app-config";
import type { ScheduleSnapshot } from "@/types/schedule";
export async function scheduleSnapshot(): Promise<ScheduleSnapshot> {
  const result = await Promise.allSettled([
    campusService.list("timetable", { pageSize: 30 }),
    campusService.list("events", { pageSize: 30 }),
  ]);
  return {
    sessions: result[0].status === "fulfilled" ? result[0].value.items : [],
    events: result[1].status === "fulfilled" ? result[1].value.items : [],
    errors: result.flatMap((r, n) =>
      r.status === "rejected"
        ? [
            `${n ? "Events" : "Timetable"} source is unavailable; no fictional fallback was added.`,
          ]
        : [],
    ),
    now: new Date().toISOString(),
    source: appConfig.dataSource,
  };
}
