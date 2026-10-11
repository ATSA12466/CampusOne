import { taskIsOverdue, campusToday } from "@/lib/tasks/status";
import { useMemo } from "react";
import type { TaskItem } from "@/types";

export type TaskFilter = "all" | "open" | "completed" | "overdue";

export function useTaskFilter(
  tasks: TaskItem[],
  filter: TaskFilter,
  query: string,
) {
  const today = campusToday();
  return useMemo(
    () =>
      tasks
        .filter((task) => {
          const queryMatch =
            `${task.title} ${task.description ?? ""} ${task.category}`
              .toLowerCase()
              .includes(query.trim().toLowerCase());
          const filterMatch =
            filter === "all" ||
            (filter === "completed" && task.completed) ||
            (filter === "open" && !task.completed) ||
            (filter === "overdue" && taskIsOverdue(task, today));
          return queryMatch && filterMatch;
        })
        .sort(
          (a, b) =>
            Number(a.completed) - Number(b.completed) ||
            (a.dueDate || "9999").localeCompare(b.dueDate || "9999") ||
            a.title.localeCompare(b.title),
        ),
    [filter, query, tasks, today],
  );
}
