"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Select } from "@/components/ui";
import { useAppStore } from "@/stores/app-store";
import type { TaskItem } from "@/types";
import { TaskFormCard } from "./components/task-form-card";
import { TaskList } from "./components/task-list";
import { TaskStats } from "./components/task-stats";
import { useTaskFilter, type TaskFilter } from "./hooks/use-task-filter";
import { taskSchema, type TaskFormValues } from "./validation/task.schema";

const DEFAULT_VALUES: TaskFormValues = {
  title: "",
  description: "",
  dueDate: "",
  priority: "medium",
  category: "academic",
};

export function TasksFeature() {
  const tasks = useAppStore((state) => state.tasks);
  const addTask = useAppStore((state) => state.addTask);
  const toggleTask = useAppStore((state) => state.toggleTask);
  const removeTask = useAppStore((state) => state.removeTask);
  const updateTask = useAppStore((state) => state.updateTask);

  const [filter, setFilter] = useState<TaskFilter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<TaskItem | null>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const filteredTasks = useTaskFilter(tasks, filter, query);

  const resetForm = () => {
    setEditing(null);
    form.reset(DEFAULT_VALUES);
  };

  const handleSubmit = (values: TaskFormValues) => {
    if (editing) {
      updateTask({ ...editing, ...values });
      resetForm();
      return;
    }

    addTask(values);
    form.reset(DEFAULT_VALUES);
  };

  const handleEdit = (task: TaskItem) => {
    setEditing(task);
    form.reset({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category,
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Tasks" description="Create, manage, and track personal productivity." />
      <TaskStats tasks={tasks} />
      <TaskFormCard
        form={form}
        editing={editing}
        onSubmit={handleSubmit}
        onCancelEdit={resetForm}
      />

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <SearchInput value={query} onChange={setQuery} placeholder="Search tasks" />
        <Select
          aria-label="Filter tasks by status"
          value={filter}
          onChange={(event) => setFilter(event.target.value as TaskFilter)}
        >
          <option value="all">All tasks</option>
          <option value="open">Open</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </Select>
      </div>

      <TaskList
        tasks={filteredTasks}
        onToggle={toggleTask}
        onEdit={handleEdit}
        onDelete={removeTask}
      />
    </div>
  );
}
