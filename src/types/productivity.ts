export type TaskPriority = "low" | "medium" | "high";

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  priority: TaskPriority;
  category: "academic" | "personal" | "club";
}

export interface CalendarEntry {
  id: string;
  title: string;
  date: string;
  type: "task" | "event" | "study" | "timetable";
}

export interface TimetableSession {
  id: string;
  day: string;
  course: string;
  start: string;
  end: string;
  venue: string;
}
