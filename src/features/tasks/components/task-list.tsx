import { EmptyState } from "@/components/shared/empty-state";
import { Badge, Button, Card } from "@/components/ui";
import type { TaskItem } from "@/types";

interface TaskListProps {
  tasks: TaskItem[];
  onToggle: (id: string) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, onToggle, onEdit, onDelete }: TaskListProps) {
  if (!tasks.length) {
    return <EmptyState title="No tasks found" description="Create a task or change your filters." />;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{task.title}</h3>
              <Badge tone={task.priority === "high" ? "danger" : task.priority === "medium" ? "warning" : "success"}>{task.priority}</Badge>
              {task.completed ? <Badge tone="success">Completed</Badge> : null}
            </div>
            {task.description ? <p className="mt-1 text-sm text-slate-600">{task.description}</p> : null}
            {task.dueDate ? <p className="mt-1 text-xs text-slate-500">Due: {task.dueDate}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => onToggle(task.id)}>
              {task.completed ? "Reopen" : "Complete"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(task.id)}>
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
