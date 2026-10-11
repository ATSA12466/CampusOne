import { EmptyState } from "@/components/shared/empty-state";
import { Badge, Button, Card } from "@/components/ui";
import type { TaskItem } from "@/types";

interface TaskListProps {
  tasks: TaskItem[];
  disabled?: boolean;
  onToggle: (id: string) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
}

export function TaskList({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  disabled = false,
}: TaskListProps) {
  if (!tasks.length) {
    return (
      <EmptyState
        title="No tasks found"
        description="Create a task or change your filters."
      />
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card
          key={task.id}
          data-task-id={task.id}
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words font-display text-xl font-semibold">
                {task.title}
              </h3>
              <Badge
                tone={
                  task.priority === "high"
                    ? "danger"
                    : task.priority === "medium"
                      ? "warning"
                      : "success"
                }
              >
                {task.priority}
              </Badge>
              {task.completed ? <Badge tone="success">Completed</Badge> : null}
            </div>
            {task.description ? (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {task.description}
              </p>
            ) : null}
            {task.dueDate ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Due: {task.dueDate}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={disabled}
              variant="secondary"
              size="sm"
              onClick={() => onToggle(task.id)}
            >
              {task.completed ? "Reopen" : "Complete"}
            </Button>
            <Button
              disabled={disabled}
              variant="ghost"
              size="sm"
              onClick={() => onEdit(task)}
            >
              Edit
            </Button>
            <Button
              disabled={disabled}
              variant="danger"
              size="sm"
              onClick={() => onDelete(task.id)}
            >
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
