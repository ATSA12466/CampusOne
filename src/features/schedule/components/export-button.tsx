"use client";
import { Button } from "@/components/ui";
import { scheduleCalendar } from "@/lib/schedule/calendar";
import type { AgendaItem } from "@/types/schedule";
export function ScheduleExport({ items }: { items: AgendaItem[] }) {
  return (
    <Button
      variant="secondary"
      disabled={!items.length}
      onClick={() => {
        const url = URL.createObjectURL(
            new Blob([scheduleCalendar(items, new Date().toISOString())], {
              type: "text/calendar;charset=utf-8",
            }),
          ),
          a = document.createElement("a");
        a.href = url;
        a.download = "campusone-planning-snapshot.ics";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      }}
    >
      Export shown schedule (.ics)
    </Button>
  );
}
