import { routeMetadata } from "@/config/metadata";
import { TasksFeature } from "@/features/tasks";

export const metadata = routeMetadata("tasks");

export default function TasksPage() {
  return <TasksFeature />;
}
