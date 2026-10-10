import type { UseFormReturn } from "react-hook-form";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import type { TaskItem } from "@/types";
import type { TaskFormValues } from "../validation/task.schema";

interface TaskFormCardProps {
  form: UseFormReturn<TaskFormValues>;
  editing: TaskItem | null;
  onSubmit: (values: TaskFormValues) => void;
  onCancelEdit: () => void;
}

export function TaskFormCard({ form, editing, onSubmit, onCancelEdit }: TaskFormCardProps) {
  return (
    <Card>
      <h2 className="font-semibold">{editing ? "Edit task" : "Add task"}</h2>
      <form className="mt-3 grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
        <Input
          aria-label="Task title"
          aria-invalid={!!form.formState.errors.title}
          aria-describedby={form.formState.errors.title ? "task-title-error" : undefined}
          placeholder="Task title"
          {...form.register("title")}
        />
        <Textarea
          aria-label="Task description"
          placeholder="Task description"
          rows={2}
          {...form.register("description")}
        />
        <div className="grid gap-3 md:grid-cols-3">
          <Input aria-label="Task due date" type="date" {...form.register("dueDate")} />
          <Select aria-label="Task priority" {...form.register("priority")}>
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </Select>
          <Select aria-label="Task category" {...form.register("category")}>
            <option value="academic">Academic</option>
            <option value="personal">Personal</option>
            <option value="club">Club</option>
          </Select>
        </div>
        {form.formState.errors.title ? (
          <p id="task-title-error" role="alert" className="text-xs text-danger">
            {form.formState.errors.title.message}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit">{editing ? "Save changes" : "Add task"}</Button>
          {editing ? (
            <Button type="button" variant="secondary" onClick={onCancelEdit}>
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
