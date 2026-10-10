import Link from "next/link";
import { Card } from "@/components/ui";
import type { EventItem, TaskItem } from "@/types";

export function TodayOverview({ tasks, events }: { tasks: TaskItem[]; events: EventItem[] }) {
  const dueToday = tasks.filter((task) => !task.completed).slice(0, 3);

  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900">Today&apos;s overview</h3>
      <div className="mt-3 space-y-3 text-sm">
        <div>
          <p className="font-medium">Tasks due</p>
          {dueToday.length ? (
            <ul className="mt-1 list-disc pl-5 text-slate-600">
              {dueToday.map((task) => (
                <li key={task.id}>{task.title}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-slate-500">No urgent tasks. <Link href="/tasks" className="text-blue-700">Add one</Link>.</p>
          )}
        </div>
        <div>
          <p className="font-medium">Upcoming events</p>
          <p className="text-slate-600">{events[0] ? `${events[0].title} • ${events[0].date}` : "No upcoming events"}</p>
        </div>
      </div>
    </Card>
  );
}
