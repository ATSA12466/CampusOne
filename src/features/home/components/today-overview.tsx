"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useAppStore } from "@/stores/app-store";
import { taskSummary } from "@/lib/home/schedule";
import { useHomeClock } from "../hooks/use-home-clock";
import { NextClassCard } from "./next-class-card";
import { TaskPreview } from "./task-preview";
import type { Course } from "@/types/academics";
import type { TaskItem, TimetableSession } from "@/types/productivity";
export function TodayOverview({
  sessions,
  courses,
  timetableUnavailable = false,
}: {
  sessions: TimetableSession[];
  courses: Course[];
  timetableUnavailable?: boolean;
}) {
  const now = useHomeClock(),
    tasks = useAppStore((state) => state.tasks),
    toggle = useAppStore((state) => state.toggleTask);
  const toast = useToast();
  const summary = taskSummary(tasks, now);
  const [lastCompleted, setLast] = useState<TaskItem | null>(null),
    [saved, setSaved] = useState(true);
  const undo = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (lastCompleted) undo.current?.focus({ preventScroll: true });
  }, [lastCompleted]);
  const complete = (task: TaskItem) => {
    let stored = true;
    try {
      toggle(task.id);
      setSaved(true);
    } catch {
      setSaved(false);
      stored = false;
    }
    setLast(task);
    toast({
      title: "Demo task updated",
      description: stored
        ? "Marked complete in your device-only planner."
        : "Only saved for this visit; device storage is unavailable.",
      tone: stored ? "success" : "info",
    });
  };
  return (
    <section
      aria-labelledby="home-day-title"
      className="flex h-full flex-col rounded-card border border-border bg-surface p-5 shadow-card md:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="home-day-title" className="font-display text-2xl font-semibold">
          A little plan. A good day.
        </h2>
        <span className="text-[10px] font-semibold text-muted-foreground">Accra time</span>
      </div>
      {timetableUnavailable ? (
        <p className="rounded-control bg-warning-soft p-4 text-sm text-warning">
          Your class schedule couldn&apos;t load. Retry the feed above.
        </p>
      ) : (
        <NextClassCard sessions={sessions} courses={courses} now={now} />
      )}
      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold">On your list</h3>
          <Link
            prefetch={false}
            href="/tasks"
            className="-m-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-[11px] font-semibold text-brand"
          >
            All tasks <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {summary.overdue ? `${summary.overdue} overdue · ` : ""}
          {summary.dueToday} due today
        </p>
        {summary.pending.length ? (
          <TaskPreview tasks={summary.pending} now={now} onComplete={complete} />
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            You&apos;re caught up. Make time for something you enjoy.
          </p>
        )}
      </div>
      {lastCompleted ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p role="status" className="min-w-0 flex-1 text-xs text-success">
            Task marked complete{saved ? "." : " for this visit; storage is unavailable."}
          </p>
          <button
            ref={undo}
            type="button"
            className="min-h-11 rounded-control px-2 text-xs font-semibold text-brand underline"
            onClick={() => {
              try {
                toggle(lastCompleted.id);
              } catch {
                setSaved(false);
              }
              const target = `home-task-${encodeURIComponent(lastCompleted.id)}`;
              setLast(null);
              requestAnimationFrame(() => document.getElementById(target)?.focus());
            }}
          >
            Undo
          </button>
        </div>
      ) : null}
      <div className="mt-auto pt-5">
        <div className="mb-2 flex justify-between gap-3 text-[11px]">
          <span className="font-semibold">A little progress</span>
          <span className="text-muted-foreground">
            {summary.completed}/{summary.total} tasks done
          </span>
        </div>
        <progress
          aria-label="Completed tasks"
          value={summary.completed}
          max={Math.max(1, summary.total)}
          className="home-progress block h-1.5 w-full overflow-hidden rounded-full"
        />
        <p className="mt-3 text-[10px] text-muted-foreground">
          Demo planner · stored on this device, not an official timetable
        </p>
      </div>
    </section>
  );
}
