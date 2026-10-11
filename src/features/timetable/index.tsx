"use client";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { images } from "@/config/images";
import { useWorkspace } from "@/features/workspace/hooks/use-workspace";
import {
  dateAdd,
  weekStart,
  weeklyAgenda,
  sortAgenda,
} from "@/lib/schedule/agenda";
import { AgendaList } from "@/features/schedule/components/agenda-list";
import { ScheduleExport } from "@/features/schedule/components/export-button";
import { ClassEditor } from "@/features/schedule/components/class-editor";
import type { ScheduleSnapshot } from "@/types/schedule";
export function TimetableFeature({ initial }: { initial: ScheduleSnapshot }) {
  const w = useWorkspace("sessions"),
    start = weekStart(initial.now.slice(0, 10)),
    dates = Array.from({ length: 7 }, (_, n) => dateAdd(start, n)),
    rows = sortAgenda([
      ...weeklyAgenda(
        initial.sessions,
        dates,
        initial.source === "demo"
          ? "Demo class · not official"
          : "Catalog class · verify official schedule",
      ),
      ...weeklyAgenda(w.items, dates, "Your personal class"),
    ]);
  return (
    <div className="space-y-6">
      <MagazineHeader
        eyebrow="Timetable"
        title="Your week, with room to breathe."
        description="A clear view of your classes. Keep the official timetable close, too."
        image={images.studyCorner}
      />
      {initial.errors.map((e) => (
        <p
          key={e}
          role="alert"
          className="rounded-control bg-warning-soft p-4 text-sm"
        >
          {e}
        </p>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold">Week of {start}</h2>
        <ScheduleExport items={rows} />
      </div>
      <AgendaList items={rows} />
      <ClassEditor />
    </div>
  );
}
