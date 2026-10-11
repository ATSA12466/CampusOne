import type { UseFormReturn } from "react-hook-form";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";
import type { TaskItem } from "@/types/productivity";
import type { TaskFormValues } from "../validation/task.schema";
interface Props {
  form: UseFormReturn<TaskFormValues>;
  editing: TaskItem | null;
  disabled?: boolean;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  onCancelEdit: () => void;
}
const fields = [
  { name: "title", label: "Task title", type: "text" },
  { name: "description", label: "Task description", type: "textarea" },
  { name: "dueDate", label: "Task due date", type: "date" },
  {
    name: "priority",
    label: "Task priority",
    options: ["low", "medium", "high"],
  },
  {
    name: "category",
    label: "Task category",
    options: ["academic", "personal", "club"],
  },
] as const;
export function TaskFormCard({
  form,
  editing,
  disabled = false,
  onSubmit,
  onCancelEdit,
}: Props) {
  const busy = disabled || form.formState.isSubmitting;
  return (
    <Card>
      <h2 className="font-display text-2xl font-semibold">
        {editing ? "Edit task" : "A little something to get done."}
      </h2>
      <form
        noValidate
        className="mt-5 grid gap-4 sm:grid-cols-3"
        onSubmit={form.handleSubmit(onSubmit)}
        aria-busy={form.formState.isSubmitting}
      >
        {fields.map((field) => {
          const error = form.formState.errors[field.name],
            id = `task-${field.name}`,
            common = {
              id,
              disabled: busy,
              "aria-invalid": !!error,
              "aria-describedby": error ? `${id}-error` : undefined,
              ...form.register(field.name),
            };
          return (
            <div
              key={field.name}
              className={
                field.name === "title" || field.name === "description"
                  ? "sm:col-span-3"
                  : undefined
              }
            >
              <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
                {field.label}
              </label>
              {"options" in field ? (
                <Select {...common}>
                  {field.options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </Select>
              ) : field.type === "textarea" ? (
                <Textarea
                  {...common}
                  rows={3}
                  maxLength={2000}
                  placeholder="A few useful details…"
                />
              ) : (
                <Input
                  {...common}
                  type={field.type}
                  maxLength={120}
                  placeholder={
                    field.name === "title"
                      ? "What would you like to finish?"
                      : undefined
                  }
                />
              )}{" "}
              {error ? (
                <p
                  id={`${id}-error`}
                  role="alert"
                  className="mt-1 text-xs text-danger"
                >
                  {error.message}
                </p>
              ) : null}
            </div>
          );
        })}
        <div className="flex flex-wrap gap-2 sm:col-span-3">
          <Button type="submit" disabled={busy}>
            {form.formState.isSubmitting
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Add task"}
          </Button>
          {editing ? (
            <Button
              type="button"
              disabled={busy}
              variant="secondary"
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
