import { useMemo } from "react";
import type { TaskItem } from "@/types";

export type TaskFilter = "all" | "open" | "completed" | "overdue";

export function useTaskFilter(tasks: TaskItem[], filter: TaskFilter, query: string) {
  return useMemo(
    () =>
      tasks.filter((task) => {
        const queryMatch = task.title.toLowerCase().includes(query.toLowerCase());
        const filterMatch =
          filter === "all" ||
          (filter === "completed" && task.completed) ||
          (filter === "open" && !task.completed) ||
          (filter === "overdue" && !!task.dueDate && new Date(task.dueDate) < new Date() && !task.completed);
        return queryMatch && filterMatch;
      }),
    [filter, query, tasks],
  );
}
