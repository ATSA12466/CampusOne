"use client";
import { useHomeClock } from "../hooks/use-home-clock";
import { NextClassCard } from "./next-class-card";
import { HomeTaskPanel } from "./home-task-panel";
import type { Course } from "@/types/academics";
import type { TimetableSession } from "@/types/productivity";
export function TodayOverview({
  sessions,
  courses,
  timetableUnavailable = false,
}: {
  sessions: TimetableSession[];
  courses: Course[];
  timetableUnavailable?: boolean;
}) {
  const now = useHomeClock();
  return (
    <section
      aria-labelledby="home-day-title"
      className="flex h-full flex-col rounded-card border border-border bg-surface p-5 shadow-card md:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="home-day-title" className="font-display text-2xl font-semibold">
          A little plan. A good day.
        </h2>
        <span className="text-[10px] font-semibold text-muted-foreground">
          Accra time
        </span>
      </div>
      {timetableUnavailable ? (
        <p className="rounded-control bg-warning-soft p-4 text-sm text-warning">
          Your class schedule couldn&apos;t load. Retry the feed above.
        </p>
      ) : (
        <NextClassCard sessions={sessions} courses={courses} now={now} />
      )}
      <HomeTaskPanel now={now} />
    </section>
  );
}
