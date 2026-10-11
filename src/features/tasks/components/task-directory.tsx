"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useAuthAction } from "@/features/auth/hooks/use-auth-action";
import { taskService } from "@/services";
import type { TaskItem } from "@/types/productivity";
import { TaskFormCard } from "./task-form-card";
import { TaskList } from "./task-list";
import { TaskStats } from "./task-stats";
import { useTaskData } from "../hooks/use-task-data";
import { useTaskFilter, type TaskFilter } from "../hooks/use-task-filter";
import { taskSchema, type TaskFormValues } from "../validation/task.schema";
const defaults: TaskFormValues = {
  title: "",
  description: "",
  dueDate: "",
  priority: "medium",
  category: "academic",
};
export function TaskDirectory() {
  const source = useTaskData(),
    action = useAuthAction(),
    [filter, setFilter] = useState<TaskFilter>("all"),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(1),
    [editing, setEditing] = useState<TaskItem | null>(null),
    [notice, setNotice] = useState("");
  const form = useForm<TaskFormValues>({
      resolver: zodResolver(taskSchema),
      defaultValues: defaults,
    }),
    filtered = useTaskFilter(source.items, filter, query),
    pages = Math.max(1, Math.ceil(filtered.length / 6)),
    current = Math.min(page, pages);
  const reset = () => {
    setEditing(null);
    form.reset(defaults);
  };
  const change = async (item: TaskItem | string) => {
    const result = await action.run((signal) =>
      typeof item === "string"
        ? taskService.remove(item, { signal })
        : taskService.put(item, { signal }),
    );
    if (result) {
      setNotice(
        result.persisted
          ? "Task change saved for this profile."
          : "For this visit only; device storage is unavailable.",
      );
      source.refresh();
    }
    return !!result;
  };
  return (
    <section className="space-y-5">
      <TaskStats tasks={source.items} />
      <TaskFormCard
        form={form}
        editing={editing}
        disabled={action.pending || source.loading || !!source.error}
        onCancelEdit={reset}
        onSubmit={async (values) => {
          if (
            await change({
              ...values,
              id: editing?.id ?? crypto.randomUUID(),
              completed: editing?.completed ?? false,
            })
          )
            reset();
        }}
      />
      {source.loading ? <p role="status">Loading your private tasks…</p> : null}
      {source.error ? (
        <div role="alert">
          <p>{source.error}</p>
          <Button onClick={source.refresh}>Retry tasks</Button>
        </div>
      ) : null}
      {action.error ? (
        <p role="alert" className="text-sm text-danger">
          {action.error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-xs text-muted-foreground">
          {notice}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <Input
          aria-label="Search tasks"
          placeholder="Find a little focus…"
          maxLength={120}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Filter tasks by status"
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as TaskFilter);
            setPage(1);
          }}
        >
          <option value="all">All loaded tasks</option>
          <option value="open">Open</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        {source.items.length} of {source.total} source records loaded. Due dates
        become overdue after the entire date in Accra, not at its start. Demo
        tasks are illustrative.
      </p>
      <TaskList
        tasks={filtered.slice((current - 1) * 6, current * 6)}
        disabled={action.pending || !!source.error}
        onToggle={(id) => {
          const task = source.items.find((t) => t.id === id);
          if (task) void change({ ...task, completed: !task.completed });
        }}
        onDelete={(id) => void change(id)}
        onEdit={(task) => {
          setEditing(task);
          form.reset(task);
          form.setFocus("title");
        }}
      />
      <Pagination
        page={current}
        totalPages={pages}
        onPageChange={setPage}
        label="Task pages"
      />
    </section>
  );
}
