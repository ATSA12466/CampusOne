import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { nextClass, relativeCampusDay } from "@/lib/home/schedule";
import type { Course } from "@/types/academics";
import type { TimetableSession } from "@/types/productivity";
export function NextClassCard({
  sessions,
  courses,
  now,
}: {
  sessions: readonly TimetableSession[];
  courses: readonly Course[];
  now: Date;
}) {
  const next = nextClass(sessions, now);
  return (
    <div className="rounded-control bg-brand-soft p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold tracking-[0.12em] text-brand uppercase">
          {next?.inProgress ? "Happening now" : "Your next class"}
        </p>
        <Link
          prefetch={false}
          href="/timetable"
          aria-label="Open your timetable"
          className="-m-2 grid size-11 place-items-center rounded-control text-brand"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      {next ? (
        <>
          <h3 className="mt-2 font-display text-xl font-semibold">
            {courses.find((course) => course.code === next.session.course)?.title ??
              next.session.course}
          </h3>
          <p className="mt-1 text-xs font-semibold text-brand">
            {next.session.course} · {relativeCampusDay(next.date, now)}, {next.session.start}–
            {next.session.end}
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />
            {next.session.venue}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          No classes in your demo timetable. You have a little room to breathe.
        </p>
      )}
    </div>
  );
}
