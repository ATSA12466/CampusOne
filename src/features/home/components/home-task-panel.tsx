"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { appConfig } from "@/config/app-config";
import { taskSummary } from "@/lib/home/schedule";
import { useHomeTasks } from "../hooks/use-home-tasks";
import { useHomeTaskCompletion } from "../hooks/use-home-task-completion";
import { TaskPreview } from "./task-preview";
export function HomeTaskPanel({ now }: { now: Date }) {
  const data = useHomeTasks(),
    summary = taskSummary(data.items, now),
    { lastCompleted, saved, setUndoRef, complete, undo } =
      useHomeTaskCompletion(data),
    available = data.ready && !data.loading && !data.error;
  return (
    <>
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
        {available ? (
          <p className="text-[11px] text-muted-foreground">
            {summary.overdue ? `${summary.overdue} overdue · ` : ""}
            {summary.dueToday} due today
          </p>
        ) : null}
        {!data.ready ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to open your private task list.
          </p>
        ) : data.loading ? (
          <p role="status" className="mt-3 text-sm">
            Loading your task list…
          </p>
        ) : data.error ? (
          <div role="alert" className="mt-3 text-sm">
            <p className="text-danger">{data.error}</p>
            <button
              type="button"
              onClick={data.refresh}
              className="mt-2 min-h-11 rounded-control px-2 font-semibold text-brand underline"
            >
              Retry task list
            </button>
          </div>
        ) : summary.pending.length ? (
          <TaskPreview
            tasks={summary.pending}
            now={now}
            onComplete={complete}
          />
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            You&apos;re caught up. Make time for something you enjoy.
          </p>
        )}
      </div>
      {lastCompleted ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p role="status" className="min-w-0 flex-1 text-xs text-success">
            Task marked complete
            {saved ? "." : " for this visit; storage is unavailable."}
          </p>
          <button
            ref={setUndoRef}
            type="button"
            className="min-h-11 rounded-control px-2 text-xs font-semibold text-brand underline"
            onClick={undo}
          >
            Undo
          </button>
        </div>
      ) : null}
      <div className="mt-auto pt-5">
        {available ? (
          <>
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
          </>
        ) : null}
        <p className="mt-3 text-[10px] text-muted-foreground">
          {appConfig.dataSource === "demo"
            ? "Demo planner · stored on this device, not an official timetable"
            : "Publisher-owned task workspace · not institutional timetable synchronization"}
        </p>
      </div>
    </>
  );
}
