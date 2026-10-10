import { Card } from "@/components/ui";
import type { TaskItem } from "@/types";

export function TaskStats({ tasks }: { tasks: TaskItem[] }) {
  const stats = {
    total: tasks.length,
    completed: tasks.filter((task) => task.completed).length,
    overdue: tasks.filter(
      (task) => !!task.dueDate && new Date(task.dueDate) < new Date() && !task.completed,
    ).length,
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card>
        <p className="text-sm text-muted-foreground">Total</p>
        <p className="text-2xl font-bold">{stats.total}</p>
      </Card>
      <Card>
        <p className="text-sm text-muted-foreground">Completed</p>
        <p className="text-2xl font-bold">{stats.completed}</p>
      </Card>
      <Card>
        <p className="text-sm text-muted-foreground">Overdue</p>
        <p className="text-2xl font-bold text-danger">{stats.overdue}</p>
      </Card>
    </div>
  );
}
