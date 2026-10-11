import { Check } from "lucide-react";
import { campusDate, isCampusDate, relativeCampusDay } from "@/lib/home/schedule";
import type { TaskItem } from "@/types/productivity";
export function TaskPreview({
  tasks,
  now,
  onComplete,
}: {
  tasks: readonly TaskItem[];
  now: Date;
  onComplete: (task: TaskItem) => void;
}) {
  return (
    <ul className="mt-3 space-y-3">
      {tasks.slice(0, 3).map((task) => (
        <li key={task.id} className="flex items-start gap-3">
          <button
            id={`home-task-${encodeURIComponent(task.id)}`}
            type="button"
            onClick={() => onComplete(task)}
            aria-label={`Complete ${task.title}`}
            className="group grid size-11 shrink-0 place-items-center rounded-control border border-control-border bg-surface text-brand transition-colors hover:bg-brand-soft"
          >
            <Check
              className="size-4 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden="true"
            />
          </button>
          <div className="min-w-0 pt-1">
            <p className="text-xs font-semibold leading-relaxed">{task.title}</p>
            <p
              className={`mt-1 text-[11px] ${isCampusDate(task.dueDate) && task.dueDate < campusDate(now) ? "text-danger" : "text-muted-foreground"}`}
            >
              {task.dueDate
                ? `${isCampusDate(task.dueDate) && task.dueDate < campusDate(now) ? "Overdue · " : ""}${relativeCampusDay(task.dueDate, now)}`
                : "No due date"}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
